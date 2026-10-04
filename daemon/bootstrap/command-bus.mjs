import {page,toolMap} from "./agent/contracts.mjs";
import { envelope, diagnostic } from "../../protocol/src/protocol.ts";

const MAX_EVENTS = 512;
const MAX_TRACES = 128;

export class CommandBus {
  #counter = 0;
  #revision = 0;
  #sequence = 0;
  #events = [];
  #traces = new Map();
  #undo = [];
  #projects;
  #pending = Promise.resolve();
  #errors = [];
  #errorSequence = 0;
  agentService = null;

  constructor({ projects } = {}) { this.#projects = projects;
    if(projects) projects.onScriptEvent=(job,context)=>this.#recordEvent(envelope("event",{type:"script.jobFinished",data:job,sequence:++this.#sequence},context));
    if(projects) projects.onAssetEvent=(job,context)=>this.#recordEvent(envelope("event",{type:"asset.jobFinished",data:job,sequence:++this.#sequence},context));
  }

  // HTTP callers serialize disk operations and ordinary commands in arrival order.
  dispatch(command) {
    const result = this.#pending.then(() => this.#dispatch(command));
    this.#pending = result.catch(() => {});
    return result;
  }

  async #dispatch(command) {
    if ((typeof command?.payload?.type !== "string" || !(command.payload.type.startsWith("project.") || command.payload.type.startsWith("scene.") || command.payload.type.startsWith("asset.") || command.payload.type.startsWith("play.") || command.payload.type.startsWith("script.") || this.agentService?.has(command.payload.type))) || !this.#projects) return this.execute(command);
    const started = performance.now();
    const trace = { traceId: command.traceId, correlationId: command.correlationId, level: "normal",
      steps: [{ stage: "command.accepted", atMs: 0, command: command.payload.type }] };
    const context = { correlationId: command.correlationId, traceId: command.traceId, causationId: command.messageId, actor: command.actor };
    try {
      this.#validateEnvelope(command);
      const events = { "scene.entity.reparent":"scene.entitiesReparented", "scene.primitive.create":"scene.primitiveCreated", "script.compile":"script.compileStarted", "script.job.get":"script.jobStatus", "script.job.cancel":"script.jobCancelRequested", "project.create": "project.created", "project.open": "project.opened", "project.save": "project.saved", "project.list": "project.listed", "scene.get": "scene.snapshot", "scene.entity.create": "scene.entityCreated", "scene.entity.update": "scene.entityUpdated", "scene.entity.delete": "scene.entityDeleted", "scene.undo": "scene.undone", "scene.redo": "scene.redone", "scene.save": "scene.saved", "asset.job.start":"asset.jobStarted", "asset.job.get":"asset.jobStatus", "asset.job.cancel":"asset.jobCancelRequested", "asset.explain":"asset.explained", "asset.import":"asset.imported", "asset.get":"asset.loaded", "scene.asset.place":"scene.assetPlaced", "scene.camera.update":"scene.cameraChanged", "play.start":"play.started", "play.stop":"play.stopped", "project.close":"project.closed" };
      const eventType = events[command.payload.type] ?? ({"scene.material.set":"scene.materialChanged","scene.light.set":"scene.lightChanged","scene.lod.set":"scene.lodChanged","scene.rendering.update":"scene.renderingChanged","scene.collider.set":"scene.colliderChanged","scene.rigidBody.set":"scene.rigidBodyChanged","scene.component.add":"scene.componentAdded","scene.component.remove":"scene.componentRemoved"}[command.payload.type]) ?? (this.agentService?.has(command.payload.type)?command.payload.type+".result":null);
      if (!eventType) throw this.#error("AX_COMMAND_0002", "Command type is not registered", []);
      if (command.payload.expectedRevision !== undefined && command.payload.expectedRevision !== this.#revision) {
        throw this.#error("AX_COMMAND_0003", "Expected command revision does not match", []);
      }
      const type=command.payload.type,args=command.payload.data;
      if(context.actor?.kind==='agent'&&toolMap.get(type)?.route==='workspace'&&toolMap.get(type)?.mutates&&!args?.workspaceId&&!['project.create','project.open'].includes(type))throw Object.assign(new Error('Agent edits require an explicit proposal workspace'),{code:'AX_WORKSPACE_0001'});
      const data = this.agentService?.has(type) ? await this.agentService.run(type,args,context) : args?.workspaceId ? await this.agentService.proposals.execute(type,args,context) : await this.#projects.run(type,args,context);
      const event = envelope("event", { type: eventType, data, sequence: ++this.#sequence }, context);
      this.#recordEvent(event);
      trace.steps.push({ stage: "event.emitted", atMs: performance.now() - started, event: eventType });
      return event;
    } catch (error) {
      const known = ["AX_WORKSPACE_0001","AX_AGENT_0001","AX_AGENT_0002","AX_AGENT_0003","AX_AGENT_0004","AX_SCRIPT_0001","AX_ASSET_0001", "AX_SCENE_0005", "AX_SCENE_0006", "AX_SCENE_0001", "AX_SCENE_0002", "AX_SCENE_0003", "AX_SCENE_0004", "AX_FS_0001", "AX_PROJECT_0001", "AX_PROJECT_0002", "AX_PROJECT_0003", "AX_PROJECT_0004", "AX_COMMAND_0002"];
      const code = known.includes(error.code) ? error.code : error.code === "ENOENT" ? "AX_PROJECT_0001" : "AX_PROJECT_0005";
      const detail = error.axiomDiagnostic ?? diagnostic(code, "project-store",
        known.includes(error.code) ? error.message : code === "AX_PROJECT_0001" ? "Project does not exist" : "Project storage operation failed",
        [], ["trace(command.traceId)"]);
      this.recordError({...detail,traceId:command?.traceId});
      trace.steps.push({ stage: "command.rejected", atMs: performance.now() - started, code: detail.code });
      return envelope("error", detail, context);
    } finally {
      trace.durationMs = performance.now() - started;
      this.#recordTrace(trace);
    }
  }

  recordError(error) {
    this.#errors.push({sequence:++this.#errorSequence,code:error.code,cause:String(error.cause??error.message??'').slice(0,2048),subsystem:error.subsystem??'command-bus',traceId:error.traceId??null});
    if(this.#errors.length>128)this.#errors.shift();
  }
  errorPage(args){return this.#deltaPage(this.#errors,args,this.#errorSequence);}
  eventPage(args){return this.#deltaPage(this.#events.map(e=>({sequence:e.payload.sequence,type:e.payload.type,traceId:e.traceId,correlationId:e.correlationId,causationId:e.causationId,actor:e.actor,sceneRevision:e.payload.data?.sceneRevision??null})),args,this.#sequence);}
  #deltaPage(items,args,latest){const since=args.since??0,oldest=items[0]?.sequence??latest+1;const result=page(items.filter(e=>e.sequence>since),{...args,offset:0,maxBytes:(args.maxBytes??8192)-64},{gap:since<oldest-1,oldestSequence:oldest,latestSequence:latest});return {...result,nextSince:result.items.at(-1)?.sequence??since};}
  get state() {
    return { counter: this.#counter, revision: this.#revision };
  }

  eventsSince(sequence) {
    return this.#events.filter((event) => event.payload.sequence > sequence);
  }

  trace(traceId) {
    return this.#traces.get(traceId) ?? null;
  }

  execute(commandEnvelope) {
    const started = performance.now();
    const trace = {
      traceId: commandEnvelope?.traceId,
      correlationId: commandEnvelope?.correlationId,
      level: "normal",
      steps: [{ stage: "command.accepted", atMs: 0, command: commandEnvelope?.payload?.type }]
    };

    try {
      this.#validateEnvelope(commandEnvelope);
      const command = commandEnvelope.payload;
      if (command.expectedRevision !== undefined && command.expectedRevision !== this.#revision) {
        throw this.#error("AX_COMMAND_0003", "Expected revision does not match current revision", [
          { expected: command.expectedRevision, actual: this.#revision }
        ]);
      }

      let eventPayload;
      switch (command.type) {
        case "system.ping":
          eventPayload = { type: "system.pong", data: { echo: command.data?.echo ?? null } };
          trace.steps.push({ stage: "system.ping.handled", atMs: performance.now() - started });
          break;
        case "demo.increment": {
          const amount = command.data?.amount ?? 1;
          if (!Number.isSafeInteger(amount) || amount === 0) {
            throw this.#error("AX_COMMAND_0004", "Increment amount must be a non-zero safe integer", [
              { received: command.data?.amount }
            ]);
          }
          const previous = this.#counter;
          this.#counter += amount;
          this.#revision += 1;
          this.#undo.push({ type: "demo.restoreCounter", value: previous });
          eventPayload = {
            type: "demo.counterChanged",
            reasonCode: "AX_DEMO_0001",
            data: { previous, current: this.#counter, revision: this.#revision }
          };
          trace.steps.push({ stage: "demo.counter.mutated", atMs: performance.now() - started, previous, current: this.#counter });
          break;
        }
        case "editor.undo": {
          const inverse = this.#undo.pop();
          if (!inverse) {
            throw this.#error("AX_COMMAND_0005", "There is no command to undo", []);
          }
          const previous = this.#counter;
          this.#counter = inverse.value;
          this.#revision += 1;
          eventPayload = {
            type: "editor.commandUndone",
            reasonCode: "AX_EDITOR_0001",
            data: { previous, current: this.#counter, revision: this.#revision }
          };
          trace.steps.push({ stage: "editor.undo.applied", atMs: performance.now() - started });
          break;
        }
        default:
          throw this.#error("AX_COMMAND_0002", "Command type is not registered", [{ type: command.type }]);
      }

      this.#sequence += 1;
      const event = envelope("event", { ...eventPayload, sequence: this.#sequence }, {
        correlationId: commandEnvelope.correlationId,
        traceId: commandEnvelope.traceId,
        causationId: commandEnvelope.messageId
      });
      trace.steps.push({ stage: "event.emitted", atMs: performance.now() - started, event: event.payload.type });
      trace.durationMs = performance.now() - started;
      this.#recordEvent(event);
      this.#recordTrace(trace);
      return event;
    } catch (error) {
      const detail = error.axiomDiagnostic ?? diagnostic(
        "AX_SYSTEM_0001",
        "command-bus",
        "Unhandled command failure",
        [{ error: String(error.message ?? error) }],
        ["trace(command.traceId)"]
      );
      this.recordError({...detail,traceId:commandEnvelope?.traceId});
      trace.steps.push({ stage: "command.rejected", atMs: performance.now() - started, code: detail.code });
      trace.durationMs = performance.now() - started;
      this.#recordTrace(trace);
      return envelope("error", detail, {
        correlationId: commandEnvelope?.correlationId ?? "invalid",
        traceId: commandEnvelope?.traceId ?? "invalid",
        causationId: commandEnvelope?.messageId ?? null
      });
    }
  }

  #validateEnvelope(value) {
    if (!value || value.protocolVersion !== 1 || value.kind !== "command") {
      throw this.#error("AX_PROTOCOL_0001", "Invalid command envelope", [{ protocolVersion: value?.protocolVersion, kind: value?.kind }]);
    }
    if (!value.messageId || !value.correlationId || !value.traceId || !value.payload?.type) {
      throw this.#error("AX_PROTOCOL_0002", "Command envelope is missing required identity fields", []);
    }
  }

  #error(code, cause, evidence) {
    const error = new Error(cause);
    error.axiomDiagnostic = diagnostic(code, "command-bus", cause, evidence, ["describeError(code)", "trace(command.traceId)"]);
    return error;
  }

  #recordEvent(event) {
    // Binary/geometry payloads are returned to the requester, not retained in diagnostics.
    const retained=event.payload.type==="renderer.capture.result" ? {...event,payload:{...event.payload,data:{frame:event.payload.data.frame,sceneRevision:event.payload.data.sceneRevision}}} : event.payload.type==="asset.loaded" ? {...event,payload:{...event.payload,data:{assetId:event.payload.data.assetId,kind:event.payload.data.asset.kind}}} : event;
    this.#events.push(retained);
    if (this.#events.length > MAX_EVENTS) this.#events.shift();
  }

  #recordTrace(trace) {
    this.#traces.set(trace.traceId, trace);
    if (this.#traces.size > MAX_TRACES) this.#traces.delete(this.#traces.keys().next().value);
  }
}
