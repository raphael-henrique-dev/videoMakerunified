import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchComRetry, mapComConcorrencia, interpretarRetryAfter } from "../motor/audio/elevenlabs.js";
import { parsearMedicaoLoudnorm, filtroAplicacaoLoudnorm } from "../motor/audio/loudnorm.js";
import { intervalosCapitulos, planejarSegmentosTrilha, agruparSonsPorIntervalo } from "../motor/audio/capitulos.js";

const resp = (status, headers = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => `status ${status}`,
  json: async () => ({}),
  headers: { get: (k) => headers[k.toLowerCase()] ?? null },
});

test("retry: 429 e 5xx são repetidos com backoff exponencial e respeitam Retry-After", async () => {
  const esperas = [];
  const respostas = [resp(429, { "retry-after": "7" }), resp(503), resp(200)];
  const r = await fetchComRetry(async () => respostas.shift(), "u", {}, { baseMs: 1000, dormir: async (ms) => esperas.push(ms) });
  assert.equal(r.ok, true);
  assert.deepEqual(esperas, [7000, 2000]);
});

test("retry: desiste após 5 tentativas e 4xx (exceto 429) falha de imediato", async () => {
  let n = 0;
  await assert.rejects(fetchComRetry(async () => (n++, resp(500)), "u", {}, { dormir: async () => {} }), /500/);
  assert.equal(n, 5);
  n = 0;
  await assert.rejects(fetchComRetry(async () => (n++, resp(401)), "u", {}, { dormir: async () => {} }), /401/);
  assert.equal(n, 1);
});

test("retry: erro de rede também é repetido", async () => {
  let n = 0;
  const r = await fetchComRetry(async () => { if (n++ < 2) throw new Error("ECONNRESET"); return resp(200); }, "u", {}, { dormir: async () => {} });
  assert.equal(r.ok, true);
  assert.equal(n, 3);
});

test("Retry-After aceita segundos e data", () => {
  assert.equal(interpretarRetryAfter("3"), 3000);
  assert.equal(interpretarRetryAfter(new Date(10000).toUTCString(), 4000), 6000);
  assert.equal(interpretarRetryAfter(null), null);
});

test("concorrência limitada a 3 e ordem preservada", async () => {
  let ativos = 0, pico = 0;
  const out = await mapComConcorrencia([5, 4, 3, 2, 1, 0], 3, async (x) => {
    ativos++; pico = Math.max(pico, ativos);
    await new Promise((r) => setTimeout(r, x * 5));
    ativos--;
    return x * 2;
  });
  assert.deepEqual(out, [10, 8, 6, 4, 2, 0]);
  assert.ok(pico <= 3 && pico > 1);
});

test("loudnorm: parseia a medição do stderr e monta a 2ª passada linear", () => {
  const stderr = `ruído\n[Parsed_loudnorm_0 @ 0x1] \n{\n\t"input_i" : "-20.31",\n\t"input_tp" : "-3.10",\n\t"input_lra" : "5.20",\n\t"input_thresh" : "-30.90",\n\t"output_i" : "-14.0",\n\t"target_offset" : "0.12"\n}\n`;
  const m = parsearMedicaoLoudnorm(stderr);
  assert.equal(m.input_i, -20.31);
  const f = filtroAplicacaoLoudnorm(m);
  assert.match(f, /measured_I=-20.31/);
  assert.match(f, /linear=true/);
  assert.match(f, /I=-14:TP=-1.5/);
  assert.throws(() => parsearMedicaoLoudnorm("nada"));
});

const frames = [
  { id: "a", capituloId: "c1", inicio: 0, fim: 10 },
  { id: "b", capituloId: "c1", inicio: 10, fim: 20 },
  { id: "c", capituloId: "c2", inicio: 20, fim: 35 },
  { id: "d", capituloId: "c3", inicio: 35, fim: 50 },
];

test("capítulos: intervalos, trilha por capítulo com fallback e SFX relativos", () => {
  const iv = intervalosCapitulos(frames, 50);
  assert.deepEqual(iv.map((i) => [i.id, i.inicio, i.fim]), [["c1", 0, 20], ["c2", 20, 35], ["c3", 35, 50]]);
  const seg = planejarSegmentosTrilha(iv, [{ id: "c1", musica: "m1" }, { id: "c2" }, { id: "c3" }], "unica");
  assert.deepEqual(seg.map((s) => s.arquivo), ["m1", "unica"]);
  assert.equal(seg[1].inicio, 20);
  assert.deepEqual(planejarSegmentosTrilha(iv, [], null).map((s) => s.arquivo), [null]);
  const grupos = agruparSonsPorIntervalo([{ em: 5 }, { em: 22.5 }, { em: 40 }], iv);
  assert.deepEqual(grupos.map((g) => g.map((s) => s.emRelativo)), [[5], [2.5], [5]]);
});
