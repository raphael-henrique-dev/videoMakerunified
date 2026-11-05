// tests/test-heuristics.js — Tier 1: visão computacional determinística
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  analisarQuadro,
  analisarMovimento,
  executarHeuristicas,
  estatisticasLuminancia,
  paraCinza,
  diferencaMedia,
  RESOLUCAO_ANALISE,
} from "../motor/audit/heuristics.js";
import { obterMotorImagem } from "../motor/audit/engine.js";
import { bufferRgb, dirTemporario, gerarPng } from "./helpers.js";

const { largura: W, altura: H } = RESOLUCAO_ANALISE;
const codigos = (r) => r.alertas.map((a) => `${a.codigo}${a.zona ? ":" + a.zona : ""}`);

// Cena "normal": gradiente escuro + listras suaves no miolo (sem nada nas zonas de risco)
const cenaNormal = (x, y) => {
  const base = 30 + Math.round((y / H) * 60);
  const miolo = y > 60 && y < 370 && x > 20 && x < 220;
  const listra = miolo && Math.floor(y / 6) % 2 === 0 ? 70 : 0;
  return [base + listra, base + 10 + listra, base + 40];
};

test("luminância Rec.601 igual ao PIL 'L'", () => {
  const buf = bufferRgb(2, 1, (x) => (x === 0 ? [255, 0, 0] : [0, 0, 255]));
  assert.deepEqual([...paraCinza(buf, 2, 1)], [76, 29]);
});

test("estatísticas: percentis e frações", () => {
  const cinza = new Uint8Array(100).map((_, i) => (i < 50 ? 0 : 250));
  const s = estatisticasLuminancia(cinza);
  assert.equal(s.media, 125);
  assert.equal(s.fracEscura, 0.5);
  assert.equal(s.fracClara, 0.5);
  assert.equal(s.p95, 250);
});

test("quadro preto -> BLANK_SCREEN + BLACKOUT críticos", () => {
  const r = analisarQuadro(bufferRgb(W, H, () => [2, 2, 3]));
  assert.ok(codigos(r).includes("BLANK_SCREEN"));
  assert.ok(codigos(r).includes("BLACKOUT"));
  assert.ok(r.alertas.every((a) => a.severidade === "critico"));
  assert.deepEqual(r.zonasVioladas, [], "quadro vazio não deve acusar safe-zone");
});

test("quadro uniforme colorido -> BLANK_SCREEN sem BLACKOUT", () => {
  const r = analisarQuadro(bufferRgb(W, H, () => [40, 60, 90]));
  assert.deepEqual(codigos(r), ["BLANK_SCREEN"]);
});

test("cena normal -> nenhum alerta", () => {
  const r = analisarQuadro(bufferRgb(W, H, cenaNormal));
  assert.deepEqual(codigos(r), []);
});

test("cena estourada -> OVEREXPOSED", () => {
  const r = analisarQuadro(bufferRgb(W, H, (x, y) => (y % 9 === 0 ? [180, 180, 180] : [252, 252, 252])));
  assert.ok(codigos(r).includes("OVEREXPOSED"));
});

test("cena escura sem destaques -> UNDEREXPOSED", () => {
  const r = analisarQuadro(bufferRgb(W, H, (x, y) => {
    const v = 2 + ((x * 7 + y * 3) % 26);
    return [v, v, v + 4];
  }));
  assert.ok(codigos(r).includes("UNDEREXPOSED"), codigos(r).join(","));
  assert.ok(!codigos(r).includes("BLACKOUT"));
});

test("texto no rodapé -> SAFE_ZONE_VIOLATION:rodape alto", () => {
  const r = analisarQuadro(
    bufferRgb(W, H, (x, y) => {
      if (y > 395 && y < 470 && x > 10 && x < 260 && (x % 4 < 2) && (y % 5 < 3)) return [255, 255, 255];
      return cenaNormal(x, y);
    })
  );
  const al = r.alertas.find((a) => a.zona === "rodape");
  assert.ok(al, codigos(r).join(","));
  assert.equal(al.severidade, "alto");
  assert.ok(r.zonasVioladas.includes("rodape"));
});

test("zona de topo nunca passa de severidade 'medio'", () => {
  const r = analisarQuadro(
    bufferRgb(W, H, (x, y) => (y < 38 && x % 3 === 0 && y % 3 === 0 ? [255, 255, 255] : cenaNormal(x, y)))
  );
  const al = r.alertas.find((a) => a.zona === "topo");
  assert.ok(al, codigos(r).join(","));
  assert.equal(al.severidade, "medio");
});

test("movimento: amostras idênticas -> ANIMATION_FREEZE; diferentes -> ok", () => {
  const a = paraCinza(bufferRgb(W, H, cenaNormal), W, H);
  const b = paraCinza(bufferRgb(W, H, (x, y) => cenaNormal((x + 25) % W, y)), W, H);
  assert.equal(analisarMovimento([a, a, a]).alertas[0].codigo, "ANIMATION_FREEZE");
  assert.ok(diferencaMedia(a, b) > 1);
  assert.deepEqual(analisarMovimento([a, b]).alertas, []);
  assert.deepEqual(analisarMovimento([a]).alertas, [], "uma amostra só não permite medir movimento");
});

test("executarHeuristicas: pipeline completo com PNGs reais (motor ativo)", async () => {
  const dir = dirTemporario();
  const p = (n) => path.join(dir, n);
  gerarPng(p("a1.png"), "cena", 1);
  gerarPng(p("a2.png"), "cena-deslocada", 2);
  gerarPng(p("b1.png"), "preto");
  gerarPng(p("b2.png"), "preto");
  gerarPng(p("c1.png"), "texto-rodape");
  gerarPng(p("c2.png"), "cena-deslocada");

  const r = await executarHeuristicas([
    { id: "cena-ok", amostras: [{ caminho: p("a1.png"), tempo: 1 }, { caminho: p("a2.png"), tempo: 2 }] },
    { id: "cena-preta", amostras: [{ caminho: p("b1.png"), tempo: 5 }, { caminho: p("b2.png"), tempo: 6 }] },
    { id: "cena-rodape", amostras: [{ caminho: p("c1.png"), tempo: 9 }, { caminho: p("c2.png"), tempo: 10 }] },
  ]);

  const [ok, preta, rodape] = r.cenas;
  assert.deepEqual(ok.alertas, [], JSON.stringify(ok.alertas));
  const cp = preta.alertas.map((a) => a.codigo);
  assert.ok(cp.includes("ANIMATION_FREEZE") && cp.includes("BLACKOUT") && cp.includes("BLANK_SCREEN"), cp.join(","));
  const z = rodape.alertas.find((a) => a.zona === "rodape");
  assert.ok(z, JSON.stringify(rodape.alertas));
  assert.deepEqual(z.tempos, [9]);
  assert.equal(r.resumo.aprovado, false);
  assert.ok(r.resumo.criticos >= 3);
  assert.ok(["sharp", "python-pil"].includes(r.motor));
});

test("motor de imagem: preferência inválida para sharp sem pacote gera erro claro", async () => {
  let temSharp = true;
  try {
    await import("sharp");
  } catch {
    temSharp = false;
  }
  if (temSharp) return; // ambiente com sharp: nada a validar aqui
  await assert.rejects(() => obterMotorImagem({ preferencia: "sharp" }), /npm install sharp/);
  const py = await obterMotorImagem({ preferencia: "python" });
  assert.equal(py.nome, "python-pil");
});
