import { test } from "node:test";
import assert from "node:assert/strict";
import { montarArgsRender } from "../motor/cli/render-args.js";
import { obterPerfil } from "../motor/formato.js";

test("curto: flags explícitas do perfil e extras de horizontal ignorados com aviso", () => {
  const r = montarArgsRender(obterPerfil({}), ["--4k", "--resume"]);
  assert.deepEqual(r.args, ["--quality", "looks", "--crf", "16", "--fps", "30"]);
  assert.deepEqual(r.env, {});
  assert.equal(r.avisos.length, 2);
});

test("horizontal: 4k, workers, low-memory e resume", () => {
  const r = montarArgsRender(obterPerfil({ formato: "horizontal" }), ["--4k", "--workers=2", "--low-memory", "--resume", "--crf=20"]);
  assert.deepEqual(r.args, ["--quality", "looks", "--crf", "20", "--fps", "30", "--resolution", "landscape-4k", "--workers", "2", "--low-memory-mode", "--resume"]);
  assert.equal(r.env.HF_SEGMENTED_CAPTURE, "true");
  assert.deepEqual(r.avisos, []);
});
