// motor/audit/vlm-critic.js — Tier 2: Crítico Visual Multimodal Universal (VLM)
//
// Suporta:
//   - Google Gemini (gemini-2.5-flash / gemini-2.0-flash)
//   - Groq Cloud (OpenAI-compatible: llama-3.2 / llama-4 vision)
//   - NVIDIA NIM (OpenAI-compatible: meta/llama-3.2-11b-vision-instruct)
//   - OpenAI (gpt-4o / gpt-4o-mini)
//   - Ollama / Local (OpenAI-compatible: llama3.2-vision em http://localhost:11434/v1)
//
// Recebe a prancha de contato limpa (vlm-sheet.jpg) ou imagens individuais de frames,
// codifica em Base64 e envia com prompt de Diretor de Arte 3D/2D e Inspetor de QA.
// Retorna JSON estruturado com nota 1-10, diagnóstico por cena e correções de código.

import fs from "node:fs";
import path from "node:path";

export const CONFIG_PROVEDORES = {
  gemini: {
    nome: "Google Gemini",
    tipo: "gemini",
    endpointPadrao: "https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent",
    modeloPadrao: "gemini-2.5-flash",
    envKey: "GEMINI_API_KEY",
  },
  groq: {
    nome: "Groq Cloud",
    tipo: "openai-compatible",
    endpointPadrao: "https://api.groq.com/openai/v1/chat/completions",
    modeloPadrao: process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct",
    envKey: "GROQ_API_KEY",
  },
  nvidia: {
    nome: "NVIDIA NIM",
    tipo: "openai-compatible",
    endpointPadrao: "https://integrate.api.nvidia.com/v1/chat/completions",
    modeloPadrao: process.env.NVIDIA_VISION_MODEL || "meta/llama-3.2-90b-vision-instruct",
    envKey: "NVIDIA_API_KEY",
  },
  openai: {
    nome: "OpenAI",
    tipo: "openai-compatible",
    endpointPadrao: "https://api.openai.com/v1/chat/completions",
    modeloPadrao: "gpt-4o",
    envKey: "OPENAI_API_KEY",
  },
  ollama: {
    nome: "Ollama Local",
    tipo: "openai-compatible",
    endpointPadrao: process.env.OLLAMA_HOST
      ? `${process.env.OLLAMA_HOST.replace(/\/+$/, "")}/v1/chat/completions`
      : "http://localhost:11434/v1/chat/completions",
    modeloPadrao: process.env.OLLAMA_VISION_MODEL || "llama3.2-vision",
    envKey: null, // não exige chave de autenticação
  },
};

export const PROMPT_SISTEMA_CRITICO = `Você é o Diretor de Arte e Inspetor Chefe de QA Visual do canal "Curiorisando" (vídeos técnicos 3D/2D estilo videogame editorial para YouTube Shorts, TikTok e Instagram Reels, resolução 1080x1920 vertical 9:16).

Sua missão é auditar a prancha de contato visual fornecida (vlm-sheet.jpg) que contém os frames-chave numerados das cenas do vídeo.

Critérios de Avaliação Estrita:
1. Enquadramento e Clipping 9:16:
   - Os modelos 3D ou elementos 2D principais estão cortados nas bordas laterais ou superiores?
   - A câmera precisa recuar (aumentar camera.position.z) ou reposicionar?
2. Iluminação, Materiais e Sombras 3D:
   - A cena parece escura, apagada, cinzenta ou lavada/estourada?
   - Há contraste claro entre o primeiro plano (modelo/mascote) e o fundo?
3. Safe-Zones Verticais Móveis:
   - O rodapé (área y > 1540px) e o topo (y < 160px) estão livres de títulos principais e textos essenciais que possam ser cobertos pelos botões de curtir/comentar ou pelas legendas do TikTok/Shorts?
4. Legibilidade e Tipografia:
   - Textos e dados em cards são legíveis em tela de celular (fontes nítidas, bom contraste)?
5. Sugestões de Correção Acionáveis:
   - Para qualquer defeito encontrado, proponha a correção exata de código (ex: alterar camera.position.z, luzes, padding ou posicionamento CSS).

Responda ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "nota_geral": 8.5,
  "aprovado": true,
  "resumo_critico": "Resumo executivo de 2 a 3 frases sobre a qualidade visual geral.",
  "cenas": [
    {
      "indice": 1,
      "identificador": "nome-da-cena",
      "timestamp": 2.4,
      "nota": 9.0,
      "enquadramento": "ok|alerta|critico",
      "iluminacao": "ok|alerta|critico",
      "legibilidade": "ok|alerta|critico",
      "problemas": ["descrição do problema 1"],
      "sugestoes_correcao": [
        {
          "alvo": "camera | light | css | layout",
          "acao": "descrição da ação corretiva",
          "codigo_sugerido": "ex: camera.position.z = 7.5;"
        }
      ]
    }
  ],
  "sugestoes_gerais": ["sugestão estética 1"]
}`;

/** Variante 16:9 (vídeos longos/horizontais): mesmos critérios e schema, com a geometria do formato. */
const PROMPT_SISTEMA_CRITICO_HORIZONTAL = PROMPT_SISTEMA_CRITICO
  .replace(
    "para YouTube Shorts, TikTok e Instagram Reels, resolução 1080x1920 vertical 9:16",
    "para YouTube (vídeos longos), resolução 1920x1080 horizontal 16:9"
  )
  .replace("Enquadramento e Clipping 9:16:", "Enquadramento e Clipping 16:9:")
  .replace("Safe-Zones Verticais Móveis:", "Margens de Segurança de TV (16:9):")
  .replace(
    "O rodapé (área y > 1540px) e o topo (y < 160px) estão livres de títulos principais e textos essenciais que possam ser cobertos pelos botões de curtir/comentar ou pelas legendas do TikTok/Shorts?",
    "Há títulos ou textos essenciais a menos de ~10% da borda (192px nas laterais, 108px no topo) ou qualquer elemento a menos de ~5% (96px laterais, 54px topo e base) que possa ser cortado em TVs? A legenda fica na base, dentro da margem de ação."
  )
  .replace("em tela de celular", "em tela de TV e de celular");

/** Prompt de sistema do crítico visual conforme o formato ("curto" por padrão). */
export function promptSistemaCritico(formato = "curto") {
  return formato === "horizontal" ? PROMPT_SISTEMA_CRITICO_HORIZONTAL : PROMPT_SISTEMA_CRITICO;
}

/**
 * Resolve o provedor VLM a ser utilizado com base em preferência explícita ou chaves presentes no ambiente.
 */
export function resolverProvedorVlm(preferencia = null, env = process.env) {
  const pref = preferencia ? String(preferencia).toLowerCase().trim() : null;

  // Se preferência explícita (e não "auto"), honra apenas o provedor solicitado
  if (pref && pref !== "auto") {
    if (!CONFIG_PROVEDORES[pref]) return null;
    const prov = CONFIG_PROVEDORES[pref];
    const apiKey = prov.envKey ? env[prov.envKey] : "local";
    return { id: pref, ...prov, apiKey: apiKey || null };
  }

  // Ordem de auto-detecção: NVIDIA NIM (ativo padrão) -> Gemini -> Groq -> OpenAI -> Ollama (se explícito)
  const candidatos = ["nvidia", "gemini", "groq", "openai"];
  for (const id of candidatos) {
    const prov = CONFIG_PROVEDORES[id];
    if (prov.envKey && env[prov.envKey]) {
      return { id, ...prov, apiKey: env[prov.envKey] };
    }
  }

  // Se OLLAMA_HOST configurado explicitamente
  if (env.OLLAMA_HOST) {
    return { id: "ollama", ...CONFIG_PROVEDORES.ollama, apiKey: "local" };
  }

  return null; // Offline / Nenhum provedor disponível
}

/**
 * Converte arquivo de imagem local em string Base64 Data URL.
 */
export function imagemParaBase64(caminhoImagem) {
  const dados = fs.readFileSync(caminhoImagem);
  const ext = path.extname(caminhoImagem).toLowerCase();
  const mime = ext === ".png" ? "image/png" : "image/jpeg";
  return {
    mime,
    base64: dados.toString("base64"),
    dataUrl: `data:${mime};base64,${dados.toString("base64")}`,
  };
}

/**
 * Dispara requisição para o Google Gemini REST API.
 */
export async function chamarGeminiVlm(config, caminhoImagem, promptUsuario, fetchFn = globalThis.fetch, promptSistema = PROMPT_SISTEMA_CRITICO) {
  const imgInfo = imagemParaBase64(caminhoImagem);
  const modelo = config.modelo || config.modeloPadrao;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${config.apiKey}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: `${promptSistema}\n\n---\n\n${promptUsuario}` },
          {
            inline_data: {
              mime_type: imgInfo.mime,
              data: imgInfo.base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  };

  const res = await fetchFn(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erro Gemini VLM (${res.status}): ${errText}`);
  }

  const json = await res.json();
  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("Gemini VLM retornou resposta vazia.");
  return JSON.parse(rawText);
}

/**
 * Dispara requisição para APIs compatíveis com OpenAI (Groq, NVIDIA NIM, OpenAI, Ollama).
 */
export async function chamarOpenAiCompativelVlm(config, caminhoImagem, promptUsuario, fetchFn = globalThis.fetch, promptSistema = PROMPT_SISTEMA_CRITICO) {
  const imgInfo = imagemParaBase64(caminhoImagem);
  const modelo = config.modelo || config.modeloPadrao;
  const url = config.endpoint || config.endpointPadrao;

  const headers = {
    "Content-Type": "application/json",
  };
  if (config.apiKey && config.apiKey !== "local") {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  const payload = {
    model: modelo,
    messages: [
      { role: "system", content: promptSistema },
      {
        role: "user",
        content: [
          { type: "text", text: promptUsuario },
          {
            type: "image_url",
            image_url: {
              url: imgInfo.dataUrl,
            },
          },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 2048,
  };

  // Se o provedor suportar response_format json_object (OpenAI, Groq)
  if (config.id === "openai" || config.id === "groq") {
    payload.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeoutMs = Number(process.env.VLM_TIMEOUT_MS) || 120000; // 120s padrão; configurável para modelos 90B lentos
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetchFn(url, {
      method: "POST",
      signal: controller.signal,
      headers,
      body: JSON.stringify(payload),
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erro VLM ${config.nome} (${res.status}): ${errText}`);
  }

  const json = await res.json();
  const rawContent = json.choices?.[0]?.message?.content;
  if (!rawContent) throw new Error(`${config.nome} retornou resposta vazia.`);

  // 1. Tenta parsear JSON completo
  const matchJson = rawContent.match(/\{[\s\S]*\}/);
  if (matchJson) {
    try {
      return JSON.parse(matchJson[0]);
    } catch {}
  }

  // 2. Fallback resiliente: extrai campos mesmo se o JSON foi truncado ou veio em texto livre
  const mNota =
    rawContent.match(/"?nota_geral"?\s*:\s*([0-9]+(?:[.,][0-9]+)?)/i) ||
    rawContent.match(/Nota(?:\s*Geral)?:\s*([0-9]+(?:[.,][0-9]+)?)/i);
  const mAprov =
    rawContent.match(/"?aprovado"?\s*:\s*(true|false|"true"|"false")/i) ||
    rawContent.match(/Aprovado:\s*(Sim|Não|True|False)/i);
  const mResumo =
    rawContent.match(/"?resumo_critico"?\s*:\s*"([^"]+)"?/i) ||
    rawContent.match(/Resumo(?:\s*Cr[íi]tico)?:\s*([^\n\r]+)/i);

  if (mNota) {
    const nota = parseFloat(mNota[1].replace(",", "."));
    const aprov = mAprov ? /true|sim/i.test(mAprov[1]) : nota >= 8.0;
    return {
      nota_geral: nota,
      aprovado: aprov,
      resumo_critico: mResumo ? mResumo[1].trim() : "Auditoria visual semântica concluída.",
      cenas: [],
      sugestoes_gerais: [],
    };
  }

  throw new Error(`Não foi possível parsear JSON na resposta de ${config.nome}: ${rawContent.slice(0, 120)}...`);
}

/**
 * Função principal de auditoria visual semântica via VLM.
 *
 * @param {string} caminhoImagem - Caminho para a prancha de contato vlm-sheet.jpg
 * @param {Array<{indice:number, cena:string, tempo:number}>} mapaCenas - Metadados das cenas na prancha
 * @param {object} [opcoes]
 * @returns {Promise<object>} Resultado da auditoria visual estruturada
 */
export async function auditarComVlm(caminhoImagem, mapaCenas = [], opcoes = {}) {
  const prov = resolverProvedorVlm(opcoes.provedor, opcoes.env || process.env);

  if (!prov || !prov.apiKey) {
    return {
      ativo: false,
      provedor: "offline",
      modelo: null,
      nota_geral: null,
      aprovado: null,
      aviso: "Crítico VLM ignorado: nenhuma chave de API configurada (GEMINI_API_KEY, GROQ_API_KEY, NVIDIA_API_KEY, OPENAI_API_KEY ou OLLAMA_HOST).",
      cenas: [],
      sugestoes_gerais: [],
    };
  }

  const horizontal = opcoes.formato === "horizontal";
  const promptSistema = promptSistemaCritico(opcoes.formato);
  const foco = horizontal ? "enquadramento 16:9, iluminação, legibilidade em TV e celular" : "enquadramento 9:16, iluminação, legibilidade móvel";
  const promptUsuario = `Analise a prancha de contato fornecida (vlm-sheet.jpg).
As cenas apresentadas na prancha correspondem a:
${mapaCenas.map((m) => `- Quadro #${m.indice}: Cena "${m.cena}" no timestamp ${m.tempo.toFixed(2)}s`).join("\n")}

Avalie rigorosamente ${foco} e clipping. Emita as notas e correções em JSON.
IMPORTANTE: Sua resposta inteira DEVE ser um único objeto JSON válido, iniciando imediatamente com "{" e terminando com "}". Não escreva nada antes ou depois do JSON.`;

  const fetchFn = opcoes.fetch || globalThis.fetch;
  let resposta = null;

  if (prov.tipo === "gemini") {
    resposta = await chamarGeminiVlm(prov, caminhoImagem, promptUsuario, fetchFn, promptSistema);
  } else {
    resposta = await chamarOpenAiCompativelVlm(prov, caminhoImagem, promptUsuario, fetchFn, promptSistema);
  }

  const notaGeral = Number(resposta.nota_geral) || 7.0;
  const aprovado = typeof resposta.aprovado === "boolean" ? resposta.aprovado : notaGeral >= 8.0;

  return {
    ativo: true,
    provedor: prov.id,
    provedorNome: prov.nome,
    modelo: prov.modelo || prov.modeloPadrao,
    nota_geral: notaGeral,
    aprovado,
    resumo_critico: resposta.resumo_critico || "Auditoria visual semântica concluída.",
    cenas: resposta.cenas || [],
    sugestoes_gerais: resposta.sugestoes_gerais || [],
  };
}

/** Agrega resultados de lotes: nota = média ponderada pelo nº de cenas; aprovado só se todos aprovarem. */
export function agregarResultadosVlm(resultados) {
  const ativos = resultados.filter((r) => r?.ativo);
  if (!ativos.length) return resultados[0] || null;
  const pesos = ativos.map((r) => Math.max(1, r.qtdCenas || 1));
  const soma = pesos.reduce((a, b) => a + b, 0);
  const nota = ativos.reduce((acc, r, i) => acc + r.nota_geral * pesos[i], 0) / soma;
  return {
    ...ativos[0],
    nota_geral: Math.round(nota * 10) / 10,
    aprovado: ativos.every((r) => r.aprovado),
    resumo_critico: ativos.map((r, i) => (ativos.length > 1 ? `Lote ${i + 1}: ` : "") + r.resumo_critico).join(" "),
    cenas: ativos.flatMap((r) => r.cenas || []),
    sugestoes_gerais: [...new Set(ativos.flatMap((r) => r.sugestoes_gerais || []))],
    lotes: ativos.length,
    lotesFalhos: resultados.length - ativos.length,
  };
}

/**
 * Audita várias pranchas (lotes de cenas) com timeout por lote. Falha de um lote não derruba os demais.
 * @param {Array<{caminho:string, mapa:Array}>} lotes
 * @param {object} opcoes mesmas de auditarComVlm + { timeoutMs }
 */
export async function auditarComVlmEmLotes(lotes, opcoes = {}) {
  const timeoutMs = opcoes.timeoutMs ?? 90000;
  const baseFetch = opcoes.fetch || globalThis.fetch;
  const fetchComTimeout = (url, init = {}) => baseFetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  const resultados = [];
  for (const lote of lotes) {
    try {
      const r = await auditarComVlm(lote.caminho, lote.mapa, { ...opcoes, fetch: fetchComTimeout });
      resultados.push({ ...r, qtdCenas: lote.mapa.length });
    } catch (err) {
      resultados.push({ ativo: false, provedor: "erro", aviso: `Lote falhou: ${err.message}`, nota_geral: null, qtdCenas: lote.mapa.length });
    }
  }
  const agregado = agregarResultadosVlm(resultados);
  if (agregado && !agregado.ativo && resultados.some((r) => r.provedor === "erro")) {
    return { ...agregado, aviso: resultados.map((r) => r.aviso).filter(Boolean).join(" | ") };
  }
  return agregado;
}
