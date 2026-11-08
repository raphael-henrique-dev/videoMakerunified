import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { auditarComVlmEmLotes, agregarResultadosVlm } from "../motor/audit/vlm-critic.js";
import { dividirEmLotes } from "../motor/audit/contact-sheet.js";
import { dirTemporario, gerarPng } from "./helpers.js";

test("dividirEmLotes preserva a ordem e o tamanho máximo", () => {
  const lotes = dividirEmLotes([1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
  assert.deepEqual(lotes, [[1, 2, 3, 4], [5, 6, 7, 8], [9]]);
});

test("agregarResultadosVlm: média ponderada e aprovação exige todos os lotes", () => {
  const r = agregarResultadosVlm([
    { ativo: true, nota_geral: 9, aprovado: true, qtdCenas: 6, resumo_critico: "a", cenas: [], sugestoes_gerais: ["x"] },
    { ativo: true, nota_geral: 6, aprovado: false, qtdCenas: 2, resumo_critico: "b", cenas: [], sugestoes_gerais: ["x", "y"] },
  ]);
  assert.equal(r.nota_geral, 8.3);
  assert.equal(r.aprovado, false);
  assert.deepEqual(r.sugestoes_gerais, ["x", "y"]);
});

test("auditarComVlmEmLotes: um lote por prancha; falha de um lote não derruba os outros", async () => {
  const dir = dirTemporario();
  const img = path.join(dir, "a.jpg");
  gerarPng(img, "cena", 1);
  let chamadas = 0;
  const mockFetch = async () => {
    chamadas++;
    if (chamadas === 2) throw new Error("timeout simulado");
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ nota_geral: 8.5, aprovado: true, resumo_critico: "ok", cenas: [], sugestoes_gerais: [] }) } }] }) };
  };
  const lotes = [0, 1, 2].map((i) => ({ caminho: img, mapa: [{ indice: i + 1, cena: `c${i}`, tempo: 1 }] }));
  const r = await auditarComVlmEmLotes(lotes, { provedor: "groq", env: { GROQ_API_KEY: "k" }, fetch: mockFetch, formato: "horizontal" });
  assert.equal(chamadas, 3);
  assert.equal(r.ativo, true);
  assert.equal(r.lotes, 2);
  assert.equal(r.lotesFalhos, 1);
  assert.equal(r.nota_geral, 8.5);
});
