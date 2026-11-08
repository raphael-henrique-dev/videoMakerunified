import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(".");
const FIXTURE = path.join(ROOT, "tests/fixtures/curto-minimo");

function normalizarIndex(texto) {
  return texto.replace(/<script src="(?:https:\/\/cdn\.jsdelivr\.net\/npm\/gsap@3\.14\.2\/dist\/gsap\.min\.js|assets\/vendor\/gsap\.min\.js)"><\/script>\s*/g, "");
}

test("gerador preserva o golden mínimo do formato curto", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "motor-golden-"));
  fs.cpSync(FIXTURE, tmp, { recursive: true });
  execFileSync("node", ["scripts/gerar-storyboard.js", tmp], { cwd: ROOT, stdio: "ignore" });
  for (const [atual, golden] of [
    ["index.html", "index.golden.html"],
    ["compositions/captions.html", "captions.golden.html"],
    ["caption_groups.json", "caption_groups.golden.json"],
    ["STORYBOARD.md", "STORYBOARD.golden.md"],
  ]) {
    const obtido = fs.readFileSync(path.join(tmp, atual), "utf8");
    const esperado = fs.readFileSync(path.join(FIXTURE, golden), "utf8");
    assert.equal(atual === "index.html" ? normalizarIndex(obtido) : obtido, atual === "index.html" ? normalizarIndex(esperado) : esperado, atual);
  }
});
