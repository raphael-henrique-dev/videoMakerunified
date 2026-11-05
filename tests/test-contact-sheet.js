// tests/test-contact-sheet.js — pranchas anotada (humana) e limpa (VLM)
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { gerarPranchas, statusDeAlertas, amostraRepresentativa } from "../motor/audit/contact-sheet.js";
import { executarHeuristicas } from "../motor/audit/heuristics.js";
import { dirTemporario, gerarPng } from "./helpers.js";

function dimensoes(caminho) {
  const out = execFileSync("python3", ["-c", "import sys;from PIL import Image;i=Image.open(sys.argv[1]);print(i.width,i.height,i.format)", caminho]);
  const [w, h, fmt] = out.toString().trim().split(" ");
  return { w: Number(w), h: Number(h), fmt };
}

function pixel(caminho, x, y) {
  const out = execFileSync("python3", ["-c", "import sys;from PIL import Image;i=Image.open(sys.argv[1]).convert('RGB');print(*i.getpixel((int(sys.argv[2]),int(sys.argv[3]))))", caminho, String(x), String(y)]);
  return out.toString().trim().split(" ").map(Number);
}

test("statusDeAlertas classifica ok/alerta/critico", () => {
  assert.equal(statusDeAlertas([]), "ok");
  assert.equal(statusDeAlertas([{ severidade: "medio" }]), "alerta");
  assert.equal(statusDeAlertas([{ severidade: "medio" }, { severidade: "critico" }]), "critico");
});

test("amostraRepresentativa pega a amostra central", () => {
  assert.equal(amostraRepresentativa({ amostras: [{ t: 1 }, { t: 2 }, { t: 3 }] }).t, 2);
  assert.equal(amostraRepresentativa({ amostras: [{ t: 1 }] }).t, 1);
});

test("gera prancha anotada e prancha VLM com geometria e status corretos", async () => {
  const dir = dirTemporario();
  const p = (n) => path.join(dir, n);
  gerarPng(p("a.png"), "cena", 1);
  gerarPng(p("a2.png"), "cena-deslocada", 1);
  gerarPng(p("b.png"), "texto-rodape");
  gerarPng(p("b2.png"), "cena-deslocada");
  gerarPng(p("c.png"), "preto");
  gerarPng(p("c2.png"), "preto");

  const tier1 = await executarHeuristicas([
    { id: "cena-ok", amostras: [{ caminho: p("a.png"), tempo: 1 }, { caminho: p("a2.png"), tempo: 1.5 }] },
    { id: "cena-rodape", amostras: [{ caminho: p("b2.png"), tempo: 4 }, { caminho: p("b.png"), tempo: 4.5 }] },
    { id: "cena-preta", amostras: [{ caminho: p("c.png"), tempo: 8 }, { caminho: p("c2.png"), tempo: 8.5 }] },
  ]);
  const r = await gerarPranchas(tier1, { dirSaida: dir, titulo: "Teste" });

  assert.ok(fs.existsSync(r.humana) && fs.existsSync(r.vlm));
  const h = dimensoes(r.humana);
  assert.equal(h.fmt, "JPEG");
  // 3 colunas de 360 + 4 gaps de 12 ; título 54 + (56 + 640) + 2 gaps
  assert.deepEqual([h.w, h.h], [3 * 360 + 4 * 12, 54 + 56 + 640 + 2 * 12]);

  // faixa de status (barra vertical à esquerda do cabeçalho de cada tile)
  const yHeader = 54 + 12 + 20;
  const cor = (x) => pixel(r.humana, x, yHeader);
  const verde = cor(12 + 3);
  const amarelo = cor(12 + 372 + 3);
  const vermelho = cor(12 + 2 * 372 + 3);
  assert.ok(verde[1] > 150 && verde[0] < 100, `verde=${verde}`);
  assert.ok(amarelo[0] > 200 && amarelo[1] > 120 && amarelo[2] < 80, `amarelo=${amarelo}`);
  assert.ok(vermelho[0] > 200 && vermelho[1] < 100, `vermelho=${vermelho}`);

  const v = dimensoes(r.vlm);
  assert.deepEqual([v.w, v.h], [3 * 360 + 4 * 8, 34 + 640 + 2 * 8]);
  assert.deepEqual(r.mapaVlm.map((m) => m.cena), ["cena-ok", "cena-rodape", "cena-preta"]);
  assert.deepEqual(r.mapaVlm.map((m) => m.tempo), [1.5, 4.5, 8.5]);
});
