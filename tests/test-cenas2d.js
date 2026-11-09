import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { CENAS, listarTiposCena, validarCena, desenharCena } from "../motor/2d/cenas/index.js";
import { PARES_CONTRASTE, contraste } from "../motor/2d/cenas/util.js";
import { obterPerfil } from "../motor/formato.js";
import { montarBundleCenas } from "../scripts/build-cenas2d-global.js";
import { gerarRoteiroSintetico, timelineEstimada } from "../scripts/gerar-roteiro-sintetico.js";
import { validarRoteiro } from "../motor/schema/roteiro.schema.js";

const perfil = obterPerfil({ formato: "horizontal" });
const ROOT = path.resolve(".");

const EXEMPLOS = {
  "capitulo-titulo": { kicker: "CAPÍTULO 1", titulo: "Como tudo começou", subtitulo: "Uma história rápida" },
  "lista-animada": { titulo: "Três ideias", itens: ["Primeira", "Segunda", "Terceira"] },
  "comparacao-ab": { titulo: "A vs B", a: { rotulo: "A", valor: "10", itens: ["x"] }, b: { rotulo: "B", valor: "20" } },
  "grafico-linha": { titulo: "Curva", unidade: "%", pontos: [{ rotulo: "a", valor: 1 }, { rotulo: "b", valor: 5 }, { rotulo: "c", valor: 3 }] },
  "grafico-barra": { titulo: "Barras", barras: [{ rotulo: "a", valor: 3 }, { rotulo: "b", valor: 9 }] },
  "linha-do-tempo": { titulo: "Tempo", marcos: [{ rotulo: "1900" }, { rotulo: "2000", texto: "Hoje" }] },
  "numero-grande": { valor: 1234, sufixo: " km", rotulo: "Distância" },
  "diagrama-fluxo": { titulo: "Fluxo", etapas: ["Um", "Dois", "Três"] },
  "mascote-explica": { destaque: "Atenção", fala: "O mascote explica o conceito." },
};

test("existem os 9 tipos de cena pedidos", () => {
  assert.deepEqual(listarTiposCena().sort(), Object.keys(EXEMPLOS).sort());
});

for (const [tipo, dados] of Object.entries(EXEMPLOS)) {
  test(`cena ${tipo}: válida, determinística, sem NaN e dentro da tela`, () => {
    assert.deepEqual(CENAS[tipo].validar(dados), []);
    for (const t of [0, 0.5, 2, 6, 11.9]) {
      const a = desenharCena(tipo, dados, perfil, t, 12, { prefixo: "f1" });
      const b = desenharCena(tipo, dados, perfil, t, 12, { prefixo: "f1" });
      assert.equal(a, b, `t=${t}`);
      assert.doesNotMatch(a, /NaN|undefined|Infinity/);
    }
    // a animação realmente depende de t (início ≠ meio)
    assert.notEqual(desenharCena(tipo, dados, perfil, 0, 12), desenharCena(tipo, dados, perfil, 6, 12));
  });

  test(`cena ${tipo}: rejeita dados inválidos`, () => {
    assert.ok(validarCena({ tipo, dados: {} }).length > 0 || tipo === "x");
  });
}

test("tipo desconhecido e dados longos demais são rejeitados com mensagem clara", () => {
  assert.match(validarCena({ tipo: "inexistente" })[0], /desconhecido/);
  assert.ok(validarCena({ tipo: "capitulo-titulo", dados: { titulo: "x".repeat(200) } }).length > 0);
});

test("textos são escapados (sem injeção de HTML)", () => {
  const html = desenharCena("lista-animada", { itens: ["<b>oi</b>", "&"] }, perfil, 6, 12);
  assert.doesNotMatch(html, /<b>oi/);
  assert.match(html, /&lt;b&gt;oi/);
});

test("contraste WCAG AA (≥ 4.5:1) em todos os pares texto/fundo das cenas", () => {
  for (const [fg, bg] of PARES_CONTRASTE) assert.ok(contraste(fg, bg) >= 4.5, `${fg} sobre ${bg}: ${contraste(fg, bg).toFixed(2)}`);
});

test("bundle do browser (window.Cenas2D) gera a mesma saída que o módulo ESM", () => {
  const ctx = { window: {} };
  ctx.globalThis = ctx.window;
  vm.runInNewContext(montarBundleCenas(), ctx);
  const C = ctx.window.Cenas2D;
  for (const [tipo, dados] of Object.entries(EXEMPLOS)) {
    assert.equal(C.desenharCena(tipo, dados, perfil, 3, 12, { prefixo: "f1" }), desenharCena(tipo, dados, perfil, 3, 12, { prefixo: "f1" }), tipo);
  }
});

test("roteiro horizontal com 2 capítulos e ≥5 tipos de cena valida e gera index.html", () => {
  const roteiro = gerarRoteiroSintetico({ slug: "t-cenas", cenas: 16, minutos: 2 });
  assert.equal(roteiro.capitulos.length, 2);
  const tipos = new Set(roteiro.capitulos.flatMap((c) => c.frames.map((f) => f.cena.tipo)));
  assert.ok(tipos.size >= 5, `tipos distintos: ${tipos.size}`);
  assert.equal(validarRoteiro(roteiro).valido, true);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "motor-cenas-"));
  fs.copyFileSync(path.join(ROOT, "motor/templates/horizontal/index.html"), path.join(tmp, "index.html"));
  fs.writeFileSync(path.join(tmp, "roteiro.json"), JSON.stringify(roteiro));
  fs.writeFileSync(path.join(tmp, "timeline.json"), JSON.stringify(timelineEstimada(roteiro)));
  execFileSync("node", ["scripts/gerar-storyboard.js", tmp], { cwd: ROOT, stdio: "ignore" });
  const index = fs.readFileSync(path.join(tmp, "index.html"), "utf8");
  assert.match(index, /cenas2d\.global\.js/);
  assert.match(index, /width=1920, height=1080/);
  assert.doesNotMatch(index, /three\.min\.js/);
  assert.match(index, /clip-f16/);
  const frame = fs.readFileSync(path.join(tmp, "compositions/frames/frame-01.html"), "utf8");
  assert.match(frame, /Cenas2D|C\.desenharCena/);
  assert.match(frame, /window\.__timelines\['frame-01'\]/);
  // transições do horizontal: ao menos uma não-flash, e zoom na troca de capítulo
  assert.match(index, /clipPath|"scale"|"x":/);
});
