"""Isolated executions of exact upstream AST methods; no provider/app requests."""
import ast, asyncio, contextlib, errno, json, logging, pathlib, queue, random, sys, threading, time, traceback, types
from types import SimpleNamespace as NS

ROOT=pathlib.Path(__file__).parent
RESULTS=[]
def lift(path,name,namespace=None):
    tree=ast.parse((ROOT/path).read_text())
    nodes=[n for n in ast.walk(tree) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name==name]
    assert len(nodes)==1,(path,name,len(nodes))
    node=nodes[0]; node.decorator_list=[]; node.returns=None
    for a in node.args.posonlyargs+node.args.args+node.args.kwonlyargs:a.annotation=None
    if node.args.vararg:node.args.vararg.annotation=None
    if node.args.kwarg:node.args.kwarg.annotation=None
    ns=dict(namespace or {}); ns.setdefault('logger',logging.getLogger('audit'))
    mod=ast.fix_missing_locations(ast.Module(body=[node],type_ignores=[]))
    exec(compile(mod,str(ROOT/path),'exec'),ns)
    return ns[name],ns
def record(name,observed,expected,risk):
    RESULTS.append(dict(name=name,observed=observed,expected=expected,risk=risk))

async def main():
    path='browser/browser_use/agent/service.py'
    fn,_=lift(path,'_update_loop_detector_actions')
    recorded=[]
    actions=[NS(model_dump=lambda **kw:{'navigate':{'url':'https://example.test'}}),NS(model_dump=lambda **kw:{'click':{'index':99}})]
    agent=NS(settings=NS(loop_detection_enabled=True),state=NS(last_model_output=NS(action=actions),last_result=[NS(error=None)],loop_detector=NS(record_action=lambda name,args:recorded.append(name))))
    fn(agent)
    assert recorded==['navigate','click']
    record('browser_counts_undispatched_batch_tail',recorded,['navigate'],'False loop evidence: proposed click is recorded although only navigation ran.')

    fn,_=lift(path,'_post_process')
    async def noop(*args):pass
    agent=NS(browser_session=object(),_check_and_update_downloads=noop,_update_loop_detector_actions=lambda:None,logger=logging.getLogger('audit'),state=NS(last_model_output=None,n_steps=3,consecutive_failures=2,last_result=[NS(error=None,is_done=False),NS(error='failed',is_done=False)]))
    await fn(agent)
    assert agent.state.consecutive_failures==0
    record('browser_multi_action_failure_resets_failure_count',agent.state.consecutive_failures,'Retain failure/stall evidence for the failed operation','A partially successful batch bypasses the consecutive single-action failure limit; soft loop nudges remain.')

    fn,_=lift(path,'_judge_and_log')
    judgment=NS(verdict=False,failure_reason='missing deliverable',reached_captcha=False,reasoning='not complete')
    async def judge():return judgment
    result=NS(is_done=True,success=True)
    agent=NS(_judge_trace=judge,history=NS(history=[NS(result=[result])]),logger=logging.getLogger('audit'))
    await fn(agent)
    assert result.success is True and result.judgement.verdict is False
    record('browser_negative_judge_keeps_self_reported_success',dict(success=result.success,judge=result.judgement.verdict),'Separate self-report from authoritative acceptance','Intentional upstream telemetry design; cannot use self-report as Axiom verified status.')

    path='unity/Server/src/services/tools/batch_execute.py'
    calls=[]
    async def get_editor_state(ctx):calls.append(ctx.limit);return NS(data={'settings':{'batch_execute_max_commands':ctx.limit}})
    module=types.ModuleType('services.resources.editor_state');module.get_editor_state=get_editor_state
    sys.modules['services.resources.editor_state']=module
    fn,ns=lift(path,'_get_max_commands_from_editor_state',dict(_cached_max_commands=None,DEFAULT_MAX_COMMANDS_PER_BATCH=25,ABSOLUTE_MAX_COMMANDS_PER_BATCH=100))
    first=await fn(NS(limit=1));second=await fn(NS(limit=20))
    assert [first,second]==[1,1] and calls==[1]
    record('unity_batch_limit_cache_crosses_instances',dict(limits=[first,second],editor_reads=calls),dict(limits=[1,20],editor_reads=[1,20]),'Global cache has no instance key; second instance can inherit first instance limit until invalidated.')

    path='unity/Server/src/transport/legacy/unity_connection.py'
    fake_time=NS(monotonic=lambda:1.0,time=lambda:1.0,sleep=lambda _:None)
    fake_path=NS(home=lambda:NS(joinpath=lambda _:NS(glob=lambda _:[])))
    registry=NS(get_instances=lambda **kw:[],get_port=lambda _:1234)
    fn,_=lift(path,'send_command',dict(config=NS(max_retries=0,retry_delay=0,command_total_timeout=90,connection_timeout=1),time=fake_time,Path=fake_path,json=json,contextlib=contextlib,struct=__import__('struct'),stdio_port_registry=registry,random=random,errno=errno))
    sent=[]
    class Sock:
        def sendall(self,payload):sent.append(json.loads(payload))
        def gettimeout(self):return 1.0
        def settimeout(self,value):pass
        def close(self):pass
    conn=NS(instance_id=None,port=1234,sock=Sock(),use_framing=False,_io_lock=threading.Lock(),_ensure_live_connection=lambda:None,_cap_to_deadline=lambda value,*args,**kw:value)
    def connect(*args):conn.sock=Sock();return True
    conn.connect=connect
    def receive(sock):
        if len(sent)==1:raise TimeoutError('Response lost after mutation committed')
        return b'{"status":"success","result":{"created":true}}'
    conn.receive_full_response=receive
    response=fn(conn,'create_object',{'name':'Cube'},max_attempts=1)
    assert len(sent)==2 and sent[0]==sent[1]
    record('unity_legacy_replays_mutation_after_lost_response',dict(dispatches=len(sent),response=response),'Reconcile operation ID before replaying a mutation','Exact legacy sender repeats identical payload after ambiguous receive timeout; fake endpoint represents a committed first mutation.')

    path='blender/addon.py'
    fn,_=lift(path,'_drain_command_queue',dict(queue=queue,json=json,traceback=traceback))
    executions=[]
    class Disconnected:
        def sendall(self,payload):raise BrokenPipeError('client already disconnected')
    q=queue.Queue();q.put(({'type':'execute_code'},Disconnected()))
    server=NS(running=True,command_queue=q,execute_command=lambda cmd:executions.append(cmd) or {'status':'success'})
    interval=fn(server)
    assert len(executions)==1 and interval==0.05
    record('blender_queued_mutation_runs_after_client_disconnect',dict(executions=len(executions),interval=interval),'Explicit queued/running/committed state and cancellation semantics','Disconnecting transport does not cancel queued authored work; execution precedes reply send.')

    path='ufo/ufo/agents/processors/core/processor_framework.py'
    def ProcessingResult(**kw):return NS(**{'success':False,'data':{},'error':None,'execution_time':0,**kw})
    phase=__import__('enum').Enum('Phase',{'FAILED':'failed-phase'}).FAILED
    fn,_=lift(path,'process',dict(time=time,ProcessingResult=ProcessingResult,ProcessingPhase=[phase]))
    async def fail_strategy(*args):return ProcessingResult(success=False,error='controlled phase failure')
    phases={}
    context=NS(set_phase_result=lambda k,v:phases.update({k:v}),update_local=lambda x:None,get_all_phase_results=lambda:phases,get_phase_results_summary=lambda:{k:v.success for k,v in phases.items()})
    processor=NS(middleware_chain=[],strategies={phase:NS(name='failing',execute=fail_strategy)},processing_context=context,agent=None,logger=logging.getLogger('audit'),_validate_strategy_dependencies_runtime=lambda *a:None,_validate_strategy_provides_runtime=lambda *a:None,_finalize_processing_context=lambda *a:None)
    result=await fn(processor)
    assert result.success is True and phases[phase].success is False
    record('ufo_combined_success_survives_failed_strategy',dict(combined=result.success,phase=phases[phase].success),'Aggregate failure accurately','Processor initializes success=true, breaks on unsuccessful phase without copying failure into aggregate; other consumers may inspect phase results, so this is not proof of global false task success.')

asyncio.run(main())
output=ROOT/'probe-results.json'
output.write_text(json.dumps({'method':'Exact AST methods with controlled collaborators; no full applications or paid APIs','results':RESULTS},indent=2)+'\n')
print(json.dumps({'reproductions':len(RESULTS),'results':RESULTS},indent=2))
