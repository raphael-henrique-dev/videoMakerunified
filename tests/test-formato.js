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
