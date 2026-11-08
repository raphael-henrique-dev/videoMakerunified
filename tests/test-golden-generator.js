import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(".");
const FIXTURE = path.join(ROOT, "tests/fixtures/curto-minimo");

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
    assert.equal(obtido, esperado, atual);
  }
});

test("todo script/CSS local referenciado pelo index existe em assets/vendor e assets/css", () => {
  const index = fs.readFileSync(path.join(FIXTURE, "index.golden.html"), "utf8");
  for (const m of index.matchAll(/(?:src|href)="(assets\/(?:vendor|css)\/[^"]+)"/g)) {
    assert.ok(fs.existsSync(path.join(ROOT, m[1])), `${m[1]} não existe`);
  }
});

function gerarHorizontal() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "motor-horiz-"));
  fs.cpSync(FIXTURE, tmp, { recursive: true });
  const rot = JSON.parse(fs.readFileSync(path.join(tmp, "roteiro.json"), "utf8"));
  rot.formato = "horizontal";
  fs.writeFileSync(path.join(tmp, "roteiro.json"), JSON.stringify(rot));
  const tl = JSON.parse(fs.readFileSync(path.join(tmp, "timeline.json"), "utf8"));
  const pal = tl.frases?.[0]?.palavras?.[0];
  if (pal) pal.texto = pal.exibicao = "Olá, mundo";
  fs.writeFileSync(path.join(tmp, "timeline.json"), JSON.stringify(tl));
  execFileSync("node", ["scripts/gerar-storyboard.js", tmp], { cwd: ROOT, stdio: "ignore" });
  return tmp;
}

test("horizontal: viewport 1920x1080, legenda embaixo, identidade.css, VTT preserva vírgulas do texto", () => {
  const tmp = gerarHorizontal();
  const index = fs.readFileSync(path.join(tmp, "index.html"), "utf8");
  assert.match(index, /width=1920, height=1080/);
  assert.match(index, /assets\/css\/identidade\.css/);
  const cap = fs.readFileSync(path.join(tmp, "compositions/captions.html"), "utf8");
  assert.match(cap, /bottom: 54px/);
  const vtt = fs.readFileSync(path.join(tmp, "legendas.vtt"), "utf8");
  const srt = fs.readFileSync(path.join(tmp, "legendas.srt"), "utf8");
  assert.match(srt, /Olá, mundo/);
  assert.match(vtt, /Olá, mundo/);
  assert.match(vtt, /\d{2}:\d{2}:\d{2}\.\d{3} --> /);
});
