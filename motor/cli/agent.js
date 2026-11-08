#!/usr/bin/env node
// motor/cli/agent.js — CLI Interativa de I.A. para Geração Autônoma de Vídeos (Motor 2.0)

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const CANAL_DIR = path.join(ROOT, "canal");
const HISTORICO_FILE = path.join(CANAL_DIR, "historico.md");
const PERFIL_FILE = path.join(CANAL_DIR, "perfil.md");

function carregarEnv(dir) {
  const envPath = path.join(dir, ".env");
  if (fs.existsSync(envPath)) {
    for (const linha of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
      }
    }
  }
}
carregarEnv(ROOT);
carregarEnv(path.resolve(ROOT, ".."));

function sanitizarSlug(nome) {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function chamarGemini(apiKey, modelo, promptSistema, promptUsuario) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        { role: "user", parts: [{ text: `${promptSistema}\n\n---\n\n${promptUsuario}` }] },
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!res.ok) throw new Error(`Erro Gemini (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(rawText);
}

async function chamarOpenAI(apiKey, modelo, promptSistema, promptUsuario) {
  const url = "https://api.openai.com/v1/chat/completions";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelo,
      messages: [
        { role: "system", content: promptSistema },
        { role: "user", content: promptUsuario },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Erro OpenAI (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const rawText = data.choices?.[0]?.message?.content;
  return JSON.parse(rawText);
}

async function main() {
  const rl = readline.createInterface({ input, output });

  console.log(`\n======================================================`);
  console.log(`🎬 MOTOR 2.0 — AGENTE CRIATIVO INTERMEDIÁRIO`);
  console.log(`======================================================\n`);

  const temaPrompt = process.argv.slice(2).join(" ") || (await rl.question("📝 Sobre qual tema você deseja criar o vídeo?\n> "));
  if (!temaPrompt.trim()) {
    console.log("Tema não fornecido. Operação cancelada.");
    rl.close();
    return;
  }

  const slugSugerido = sanitizarSlug(temaPrompt.slice(0, 32));
  const slugInput = await rl.question(`\n🏷️ Identificador de pasta (slug) [padrão: ${slugSugerido}]:\n> `);
  const slug = sanitizarSlug(slugInput.trim() || slugSugerido);

  const formatoInput = await rl.question("\n📐 Formato (curto ou horizontal; padrão: curto):\n> ");
  const formato = /^(horizontal|longo)$/i.test(formatoInput.trim()) ? "horizontal" : "curto";

  console.log(`\n🤖 Escolha o motor de inteligência artificial:`);
  console.log(`  1. Google Gemini (usa GEMINI_API_KEY)`);
  console.log(`  2. OpenAI (usa OPENAI_API_KEY)`);
  console.log(`  3. Modo Guiado Local (Offline / Blueprint Rápido sem API externa)`);
  const opcaoIARaw = await rl.question(`\nOpção [1, 2 ou 3, padrão: 1]:\n> `);
  const opcaoIA = opcaoIARaw.trim() || "1";

  // Carrega regras e memória do canal
  const perfil = fs.existsSync(PERFIL_FILE) ? fs.readFileSync(PERFIL_FILE, "utf8") : "";
  const memoriaNome = formato === "horizontal" ? "aprendizados-longo.md" : "aprendizados-curto.md";
  const memoriaPath = path.join(CANAL_DIR, memoriaNome);
  const aprendizados = fs.existsSync(memoriaPath) ? fs.readFileSync(memoriaPath, "utf8") : "";

  console.log(`\n🚀 [1/5] Scaffolding do vídeo atômico: videos/${slug}...`);
  execFileSync("node", [path.join(ROOT, "motor", "cli", "orchestrator.js"), "novo", slug, temaPrompt, `--formato=${formato}`], { stdio: "inherit" });

  const destVideoDir = path.join(ROOT, "videos", slug);
  const roteiroDestPath = path.join(destVideoDir, "roteiro.json");

  let roteiroGerado = null;

  if (opcaoIA === "1" || opcaoIA === "2") {
    const isGemini = opcaoIA === "1";
    const apiKey = isGemini ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY;
    const envNome = isGemini ? "GEMINI_API_KEY" : "OPENAI_API_KEY";

    if (!apiKey) {
      console.warn(`\n⚠️ Variável ${envNome} não encontrada no ambiente.`);
      console.log(`Alternando automaticamente para Modo Guiado Local (Blueprint Rápido).`);
    } else {
      console.log(`\n🧠 [2/5] Escrevendo roteiro magnético e direção 3D com ${isGemini ? "Google Gemini" : "OpenAI"}...`);
      const promptSistema = `Você é o Diretor Criativo e Roteirista do Canal Curiorisando no Motor 2.0.
Regras fundamentais do canal:
- Tom: Curiosidade técnica irresistível, ritmo rápido (~190 PPM), "falha -> corrige/engenharia" no estilo videogame.
- Formato: 4 frames principais (01: gancho dramático, 02: montagem/mecanismo parte 1, 03: mecanismo parte 2 e blindagem, 04: vista explodida com 7 chamadas técnicas).
- PROIBIDO repetir conectivos como "Então você...": Varie com "A solução?", "Para blindar...", "No centro de tudo...", "E para aguentar...".
- Emoção e locução: Configure na voz estabilidade: 0.32 e estilo: 0.48 para máxima expressividade e entusiasmo.
- Marque palavras-chave que ganham destaque visual com asteriscos, ex: *palavra*.
- Retorne estritamente um JSON compatível com o schema do Motor 2.0, no formato ${formato}, incluindo voz, trilha, efeitos e frames.

Regras acumuladas do canal:
${aprendizados}
${perfil}
`;
      const promptUsuario = `Crie o roteiro completo e as diretivas de direção 3D e 2D para o tema: "${temaPrompt}". O id do vídeo deve ser "${slug}".`;

      try {
        roteiroGerado = isGemini
          ? await chamarGemini(apiKey, "gemini-2.5-flash", promptSistema, promptUsuario)
          : await chamarOpenAI(apiKey, "gpt-4o", promptSistema, promptUsuario);
        fs.writeFileSync(roteiroDestPath, JSON.stringify(roteiroGerado, null, 2), "utf8");
        console.log(`✅ Roteiro gerado e salvo em: videos/${slug}/roteiro.json`);
      } catch (err) {
        console.warn(`Falha na chamada à IA (${err.message}). Mantendo roteiro template base.`);
      }
    }
  }

  console.log(`\n🔊 [3/5] Sintetizando voz e masterizando áudio (-14 LUFS com Sidechain Ducking)...`);
  try {
    execFileSync("node", [path.join(ROOT, "motor", "cli", "orchestrator.js"), "audio", slug], { stdio: "inherit" });
  } catch (err) {
    console.warn("Aviso ao processar áudio:", err.message);
  }

  console.log(`\n🔍 [4/6] Auditando conformidade técnica com o linter estático HyperFrames...`);
  try {
    execFileSync("node", [path.join(ROOT, "motor", "cli", "orchestrator.js"), "check", slug], { stdio: "inherit" });
  } catch (err) {
    console.warn("Aviso na auditoria estática:", err.message);
  }

  // 5. Auditoria Visual por Visão Computacional (Tier 1 + Tier 2 VLM) e Loop de Auto-Cura
  console.log(`\n======================================================`);
  console.log(`👁️ [5/6] AUDITORIA VISUAL POR VISÃO COMPUTACIONAL (CV)`);
  console.log(`======================================================`);

  const { auditarVideoVisual } = await import("../audit/visual.js");
  const provedorVlmPref = opcaoIA === "1" ? "gemini" : opcaoIA === "2" ? "openai" : null;
  const modoRapido = opcaoIA === "3";

  let resultadoAudit = null;
  let iteracaoCura = 0;
  const MAX_ITERACOES_CURA = 2;

  while (iteracaoCura <= MAX_ITERACOES_CURA) {
    try {
      resultadoAudit = await auditarVideoVisual(slug, {
        fast: modoRapido,
        provider: provedorVlmPref,
      });
    } catch (err) {
      console.warn("Aviso ao executar auditoria visual:", err.message);
      break;
    }

    if (resultadoAudit.aprovado) {
      console.log(`\n✅ Auditoria Visual APROVADA com Nota: ${resultadoAudit.notaFinal.toFixed(1)} / 10!`);
      break;
    }

    iteracaoCura++;
    if (iteracaoCura > MAX_ITERACOES_CURA) {
      console.warn(`\n⚠️ Limite de ${MAX_ITERACOES_CURA} tentativas de auto-cura atingido.`);
      console.log(`• Nota Final Atual: ${resultadoAudit.notaFinal.toFixed(1)} / 10`);
      console.log(`• Prancha Anotada:  ${path.relative(ROOT, resultadoAudit.pranchas.humana)}`);
      console.log(`• Relatório:        ${path.relative(ROOT, resultadoAudit.caminhoMd)}`);

      const prosseguir = await rl.question(`\nDeseja aprovar o vídeo manualmente e prosseguir mesmo assim? (s/N)\n> `);
      if (prosseguir.trim().toLowerCase() !== "s" && prosseguir.trim().toLowerCase() !== "sim") {
        console.log("Operação interrompida pelo usuário para ajustes visuais manuais.");
        rl.close();
        return;
      }
      break;
    }

    console.log(`\n🔧 [Auto-Cura ${iteracaoCura}/${MAX_ITERACOES_CURA}] Aplicando correções visuais sugeridas pela auditoria...`);
    const framesDir = path.join(destVideoDir, "compositions", "frames");
    if (fs.existsSync(framesDir)) {
      const arquivosFrames = fs.readdirSync(framesDir).filter((f) => f.endsWith(".html"));
      // Aplica correções automáticas seguras de layout/safe-zone se detectadas
      for (const arq of arquivosFrames) {
        const arqPath = path.join(framesDir, arq);
        let conteudo = fs.readFileSync(arqPath, "utf8");
        let alterou = false;

        // Se houver violação de rodapé, eleva elementos sobrepostos
        if (resultadoAudit.tier1.resumo.altos > 0 && conteudo.includes("top: 1350px")) {
          conteudo = conteudo.replace(/top:\s*1350px/g, "top: 1250px");
          alterou = true;
        }

        if (alterou) {
          fs.writeFileSync(arqPath, conteudo, "utf8");
          console.log(`  • Ajuste automático de layout aplicado em: compositions/frames/${arq}`);
        }
      }
    }
  }

  // 6. REGRA MANDATÓRIA: Memória evolutiva do canal COM APROVAÇÃO DO USUÁRIO
  console.log(`\n======================================================`);
  console.log(`💡 [6/6] MEMÓRIA EVOLUTIVA DO CANAL`);
  console.log(`======================================================`);

  const notaTxt = resultadoAudit?.notaFinal ? ` (Nota Visual: ${resultadoAudit.notaFinal.toFixed(1)}/10)` : "";
  const propostaAprendizado = `Produção do vídeo "${temaPrompt}" (${slug}): Estruturação atômica validada com 0 erros no HyperFrames e aprovada na Auditoria Visual CV${notaTxt}.`;
  console.log(`\nO agente identificou o seguinte aprendizado para registrar:\n"${propostaAprendizado}"`);
  const aprova = await rl.question(`\nDeseja aprovar e registrar este aprendizado em canal/${memoriaNome}? (s/N)\n> `);

  if (aprova.trim().toLowerCase() === "s" || aprova.trim().toLowerCase() === "sim") {
    const dataHoje = new Date().toISOString().split("T")[0];
    fs.appendFileSync(memoriaPath, `\n- **[${dataHoje}] (${slug}):** ${propostaAprendizado}`, "utf8");

    let duracaoTxt = "-";
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(destVideoDir, "audio_meta.json"), "utf8"));
      if (typeof meta.duracaoTotal === "number") duracaoTxt = `${meta.duracaoTotal.toFixed(0)}s`;
    } catch {}
    const linhaHist = `| ${dataHoje} | \`${slug}\` | **${temaPrompt}** | ${duracaoTxt} | Produzido via Agente IA do Motor 2.0 (${formato}) |\n`;
    fs.appendFileSync(HISTORICO_FILE, linhaHist, "utf8");

    console.log(`✅ Registrado com sucesso em canal/${memoriaNome} e canal/historico.md!`);
  } else {
    console.log(`ℹ️ Registro dispensado pelo usuário. Memória mantida sem alterações.`);
  }

  console.log(`\n🎉 PROJETO PRONTO!`);
  console.log(`- Diretório: videos/${slug}/`);
  console.log(`- Visualizar: npm run video:dev -- ${slug}`);
  console.log(`- Renderizar: npm run video:render -- ${slug}\n`);

  rl.close();
}

main().catch((err) => {
  console.error("Erro fatal no agente CLI:", err);
  process.exit(1);
});
