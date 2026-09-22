import test from "node:test";
import assert from "node:assert/strict";
import { runCargo } from "../scripts/build-editor.mjs";

const missing = () => { throw Object.assign(new Error("missing"), { code: "ENOENT" }); };

test("Windows build finds standard rustup install when Cargo is absent from PATH", () => {
  const calls = [];
  runCargo(["build"], {
    platform: "win32", env: { USERPROFILE: "C:\\Users\\Jack" },
    execute(file, args, options) {
      calls.push(file);
      if (file === "cargo.exe") missing();
      assert.equal(file, "C:\\Users\\Jack\\.cargo\\bin\\cargo.exe");
      assert.deepEqual(args, ["build"]);
      assert.equal(options.shell, undefined);
    }
  });
  assert.equal(calls.length, 2);
});

test("custom Cargo home with spaces is passed as a literal executable path", () => {
  runCargo(["--version"], {
    platform: "win32", env: { CARGO_HOME: "D:\\Rust Tools" },
    execute(file) {
      if (file === "cargo.exe") missing();
      assert.equal(file, "D:\\Rust Tools\\bin\\cargo.exe");
    }
  });
});

test("Cargo compile failures do not fall back to another toolchain", () => {
  const failure = Object.assign(new Error("compile failed"), { status: 101 });
  let calls = 0;
  assert.throws(() => runCargo([], { execute() { calls++; throw failure; } }), error => error === failure);
  assert.equal(calls, 1);
});

test("missing Rust reports an actionable build error", () => {
  assert.throws(() => runCargo([], { env: {}, execute: missing }), /AX_BUILD_0001.*CARGO_HOME/);
});
