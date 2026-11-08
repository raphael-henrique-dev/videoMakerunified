import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularCapitulos } from "../motor/publish/metadata-helper.js";

const frames = (inicios, total) =>
  inicios.map((inicio, i) => ({ id: `f${i}`, titulo: `T${i}`, inicio, fim: inicios[i + 1] ?? total }));

test("capítulos: mantém só os com >= 10s e primeiro em 0", () => {
  const caps = calcularCapitulos(frames([0, 5, 12, 14, 30], 45), undefined, 45);
  assert.deepEqual(caps.map((c) => c.tempo), [0, 12, 30]);
});

test("capítulos: sem 3 capítulos válidos, omite a lista", () => {
  assert.deepEqual(calcularCapitulos(frames([0, 5, 8], 20), undefined, 20), []);
});

test("capítulos: último capítulo precisa de >= 10s até o fim", () => {
  const caps = calcularCapitulos(frames([0, 12, 24, 40], 45), undefined, 45);
  assert.deepEqual(caps.map((c) => c.tempo), [0, 12, 24]);
});

test("capítulos: usa títulos de roteiro.capitulos via capituloId", () => {
  const fr = [0, 10, 20, 30, 40].map((inicio, i) => ({ id: `f${i}`, capituloId: i < 2 ? "a" : i < 4 ? "b" : "c", inicio, fim: inicio + 10 }));
  const caps = calcularCapitulos(fr, [{ id: "a", titulo: "Intro" }, { id: "b", titulo: "Meio" }, { id: "c", titulo: "Fim" }], 50);
  assert.deepEqual(caps, [{ tempo: 0, titulo: "Intro" }, { tempo: 20, titulo: "Meio" }, { tempo: 40, titulo: "Fim" }]);
});
