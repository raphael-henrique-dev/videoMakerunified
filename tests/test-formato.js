import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizarFormato, obterPerfil, validarFormato, achatarRoteiro } from "../motor/formato.js";

test("formato padrão é curto e 'longo' vira horizontal", () => {
  assert.equal(normalizarFormato(undefined), "curto");
  assert.equal(normalizarFormato("longo"), "horizontal");
  assert.throws(() => normalizarFormato("quadrado"));
});

test("perfis têm dimensões esperadas", () => {
  assert.equal(obterPerfil({}).largura, 1080);
  assert.equal(obterPerfil({ formato: "horizontal" }).largura, 1920);
});

test("validarFormato detecta resolução incompatível", () => {
  assert.equal(validarFormato({ formato: "horizontal", resolucao: { largura: 1080, altura: 1920 } }).valido, false);
});

test("achatarRoteiro propaga capituloId", () => {
  const r = achatarRoteiro({ capitulos: [{ id: "c1", frames: [{ id: "a" }] }] });
  assert.equal(r.frames[0].capituloId, "c1");
});

import { palavrasParaMinutos } from "../motor/formato.js";
import { validarRoteiro } from "../motor/schema/roteiro.schema.js";

test("horizontal tem duração padrão de 10 minutos e o curto não tem", () => {
  assert.equal(obterPerfil({ formato: "horizontal" }).duracaoPadraoMin, 10);
  assert.equal(obterPerfil({}).duracaoPadraoMin, undefined);
  assert.equal(palavrasParaMinutos(10), 1860);
});

test("schema: duracaoAlvoMin válida, fora de faixa e ignorada no curto", () => {
  const base = { id: "x", titulo: "X", frames: [{ id: "f", arquivo: "a.html", frases: [{ texto: "oi" }] }] };
  assert.equal(validarRoteiro({ ...base, formato: "horizontal", duracaoAlvoMin: 10 }).valido, true);
  assert.equal(validarRoteiro({ ...base, formato: "horizontal", duracaoAlvoMin: 90 }).valido, false);
  const curto = validarRoteiro({ ...base, duracaoAlvoMin: 10 });
  assert.equal(curto.valido, true);
  assert.equal(curto.avisos.length, 1);
});
