# Third-party CAD importer

M17 uses the separately installed, replaceable npm module **occt-import-js 0.0.23**,
by Viktor Kovacs and contributors, under LGPL-2.1. It contains Open CASCADE Technology
7.6.1 compiled with Emscripten 3.1.69. Axiom's Apache-2.0 license does not replace
these dependency licenses. The source release does not vendor its JavaScript/Wasm
binary; `npm ci` installs the exact package and integrity from package-lock.json.

- Corresponding upstream source and build scripts: https://github.com/kovacsv/occt-import-js/tree/0.0.23
- Source archive: https://github.com/kovacsv/occt-import-js/archive/refs/tags/0.0.23.zip
- OCCT source: https://github.com/Open-Cascade-SAS/OCCT/tree/V7_6_1
- Package: https://www.npmjs.com/package/occt-import-js/v/0.0.23
- Included license copies: `docs/licenses/occt-import-js-LGPL-2.1.txt` and
  `docs/licenses/occt-LGPL-2.1.txt`; installed npm package also carries its notices.

Rebuild upstream using its README/CMakeLists and `tools/setup_emscripten_win.bat`
then `tools/build_wasm_win_release.bat`, with its OCCT submodule/source dependencies.
The import boundary is a normal Node module loaded in a separate worker. Users may
replace/rebuild `node_modules/occt-import-js/dist/occt-import-js.js` and its adjacent
Wasm without changing Axiom. No signature check prohibits replacing that library.

**Axiom modification:** `engine/assets/cad.mjs::capWasmMemory` changes only the defined
Wasm memory maximum in memory immediately before instantiation (4096 64-KiB pages).
The npm-distributed binary on disk is unchanged. The complete source of that
transformation is included under Apache-2.0 in this release and is sufficient to
reproduce the change with any compatible rebuilt upstream module.

Fixture provenance: `tests/fixtures/cad/cube.step` comes from upstream
`test/testfiles/simple-basic-cube/cube.stp`; `cube.iges` comes from
`test/testfiles/cube-10x10mm/Cube10x10.igs`. They were retrieved from the upstream
repository's main branch on 2026-10-08; they retain upstream attribution/license.
The synthetic OBJ/STL fixtures and demo C# scripts are Axiom's own examples.
