// tests/test-vlm-critic.js — Testes do Crítico Visual Multimodal VLM
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import {
  resolverProvedorVlm,
  imagemParaBase64,
  chamarGeminiVlm,
  chamarOpenAiCompativelVlm,
  auditarComVlm,
  CONFIG_PROVEDORES,
} from "../motor/audit/vlm-critic.js";
import { dirTemporario, gerarPng } from "./helpers.js";

test("resolverProvedorVlm resolve corretamente com base em variáveis de ambiente", () => {
  // 1. Ordem de prioridade sem preferência explícita
  const envVazio = {};
  assert.equal(resolverProvedorVlm(null, envVazio), null);

  const envGemini = { GEMINI_API_KEY: "chave-gemini" };
  const pGem = resolverProvedorVlm(null, envGemini);
  assert.equal(pGem.id, "gemini");
  assert.equal(pGem.apiKey, "chave-gemini");

  const envGroq = { GROQ_API_KEY: "chave-groq" };
  const pGroq = resolverProvedorVlm(null, envGroq);
  assert.equal(pGroq.id, "groq");
  assert.equal(pGroq.apiKey, "chave-groq");

  const envNvidia = { NVIDIA_API_KEY: "chave-nvidia" };
  const pNvidia = resolverProvedorVlm(null, envNvidia);
  assert.equal(pNvidia.id, "nvidia");
  assert.equal(pNvidia.apiKey, "chave-nvidia");

  const envOpenai = { OPENAI_API_KEY: "chave-openai" };
  const pOpenai = resolverProvedorVlm(null, envOpenai);
  assert.equal(pOpenai.id, "openai");
  assert.equal(pOpenai.apiKey, "chave-openai");

  // 2. Preferência explícita sobrescreve auto-detecção
  const envMisto = {
    GEMINI_API_KEY: "chave-gemini",
    GROQ_API_KEY: "chave-groq",
    NVIDIA_API_KEY: "chave-nvidia",
  };
  assert.equal(resolverProvedorVlm("groq", envMisto).id, "groq");
  assert.equal(resolverProvedorVlm("nvidia", envMisto).id, "nvidia");
  assert.equal(resolverProvedorVlm("gemini", envMisto).id, "gemini");

  // 3. Provedor desconhecido
  assert.equal(resolverProvedorVlm("provedor_inexistente", envMisto), null);
});

test("imagemParaBase64 converte imagem para Data URL e base64 válidos", () => {
  const dir = dirTemporario();
  const imgPath = path.join(dir, "teste.png");
  gerarPng(imgPath, "cena", 1);

  const res = imagemParaBase64(imgPath);
  assert.equal(res.mime, "image/png");
  assert.ok(res.base64.length > 100);
  assert.ok(res.dataUrl.startsWith("data:image/png;base64,"));
});

test("chamarGeminiVlm formata requisição e parseia resposta JSON corretamente", async () => {
  const dir = dirTemporario();
  const imgPath = path.join(dir, "teste.jpg");
  gerarPng(imgPath, "cena", 1);

  const mockResposta = {
    nota_geral: 9.0,
    aprovado: true,
    resumo_critico: "Excelente enquadramento e iluminação.",
    cenas: [{ indice: 1, nota: 9.0, problemas: [] }],
  };

  let chamadaUrl = "";
  let chamadaPayload = null;

  const mockFetch = async (url, options) => {
    chamadaUrl = url;
    chamadaPayload = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(mockResposta) }],
            },
          },
        ],
      }),
    };
  };

  const config = { ...CONFIG_PROVEDORES.gemini, id: "gemini", apiKey: "fake-gemini-key" };
  const resultado = await chamarGeminiVlm(config, imgPath, "Avalie este frame", mockFetch);

  assert.deepEqual(resultado, mockResposta);
  assert.ok(chamadaUrl.includes("gemini-2.5-flash:generateContent?key=fake-gemini-key"));
  assert.ok(chamadaPayload.contents[0].parts.some((p) => p.inline_data));
});

test("chamarOpenAiCompativelVlm suporta Groq, NVIDIA e OpenAI com payload correto e lida com markdown envolto", async () => {
  const dir = dirTemporario();
  const imgPath = path.join(dir, "teste.jpg");
  gerarPng(imgPath, "cena", 1);

  const mockResposta = {
    nota_geral: 8.0,
    aprovado: true,
    resumo_critico: "Cena aprovada com pequenos alertas de luz.",
    cenas: [],
  };

  let headersRecebidos = null;
  let payloadRecebido = null;

  const mockFetch = async (url, options) => {
    headersRecebidos = options.headers;
    payloadRecebido = JSON.parse(options.body);
    // Simula resposta envolta em markdown ```json ... ```
    return {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: `Aqui está a análise técnica:\n\`\`\`json\n${JSON.stringify(mockResposta, null, 2)}\n\`\`\``,
            },
          },
        ],
      }),
    };
  };

  const configGroq = { ...CONFIG_PROVEDORES.groq, id: "groq", apiKey: "gsk-fake-groq" };
  const resultado = await chamarOpenAiCompativelVlm(configGroq, imgPath, "Avalie a imagem", mockFetch);

  assert.deepEqual(resultado, mockResposta);
  assert.equal(headersRecebidos["Authorization"], "Bearer gsk-fake-groq");
  assert.ok(payloadRecebido.messages[1].content.some((c) => c.type === "image_url"));
});

test("auditarComVlm devolve fallback offline limpo quando não há chaves de API", async () => {
  const dir = dirTemporario();
  const imgPath = path.join(dir, "teste.jpg");
  gerarPng(imgPath, "cena", 1);

  const res = await auditarComVlm(imgPath, [{ indice: 1, cena: "cena-01", tempo: 2.0 }], { env: {} });
  assert.equal(res.ativo, false);
  assert.equal(res.provedor, "offline");
  assert.equal(res.nota_geral, null);
  assert.ok(res.aviso.includes("Crítico VLM ignorado"));
});
