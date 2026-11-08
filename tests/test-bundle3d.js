import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import { montarBundle } from "../scripts/build-3d-global.js";

test("bundle 3D é gerado sem import/export e com sintaxe válida", () => {
  const { codigoCombinado } = montarBundle();
  assert.doesNotMatch(codigoCombinado, /^\s*(import|export)\s/m);
  new vm.Script(codigoCombinado);
});

test("bundle commitado em assets/vendor tem sintaxe válida", () => {
  new vm.Script(fs.readFileSync("assets/vendor/motor3d.global.js", "utf8"));
});
