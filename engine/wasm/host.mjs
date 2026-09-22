export async function loadKernel(bytes) {
  const { instance } = await WebAssembly.instantiate(bytes, {});
  const api = instance.exports;
  if (api.axiom_abi_version() !== 1) throw new Error("AX_WASM_0001: incompatible ABI");
  const id = api.axiom_create();
  if (!id) throw new Error("AX_WASM_0002: world allocation failed");
  let disposed = false;
  return {
    step(delta, trace, aspect) {
      if (disposed) throw new Error("AX_WASM_0003: disposed world");
      if (!Number.isFinite(aspect) || aspect <= 0) throw new Error("AX_WASM_0004: invalid aspect");
      if (typeof trace !== "bigint" || trace < 0n || trace > 0xffffffffffffffffn) {
        throw new Error("AX_WASM_0005: trace must fit u64");
      }
      if (api.axiom_tick(id, delta, trace) !== 0) throw new Error("AX_TIME_0001: invalid kernel tick");
      const vertices = new Float32Array(12);
      for (let index = 0; index < 3; index++) {
        for (let axis = 0; axis < 4; axis++) {
          vertices[index * 4 + axis] = api.axiom_vertex(id, index, axis, aspect);
        }
      }
      return {
        frame: Number(api.axiom_frame(id)),
        trace: api.axiom_trace(id).toString(),
        fixedSteps: api.axiom_fixed_steps(id),
        vertices,
        nullProcessedMeshes: api.axiom_null_render(id, aspect)
      };
    },
    dispose() {
      if (!disposed) api.axiom_destroy(id);
      disposed = true;
    }
  };
}
