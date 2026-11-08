#!/usr/bin/env node
// motor/audit/visual.js — Orquestrador Central da Auditoria Visual (Motor 2.0)
//
// Integra:
//   1. Extração inteligente de snapshots via HyperFrames snapshot
//   2. Tier 1: Visão computacional determinística (heuristics.js)
//   3. Pranchas de contato anotadas (contact-sheet.js)
//   4. Tier 2: Crítico multimodal VLM universal (vlm-critic.js)
//   5. Emissão de relatório estruturado em Markdown e JSON (reporter.js)

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { executarHeuristicas } from "./heuristics.js";
import { obterPerfil } from "../formato.js";
import { HYPERFRAMES_VERSION } from "../config.js";
import { gerarPranchas } from "./contact-sheet.js";
import { auditarComVlm } from "./vlm-critic.js";
import { formatarRelatorioMarkdown, salvarRelatorio } from "./reporter.js";
import { carregarEnv } from "../publish/env-helper.js";

carregarEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const VIDEOS_DIR = path.join(ROOT, "videos");

export function resolverVideoDir(slug) {
  if (!slug) throw new Error("Slug do vídeo não informado.");
  const limpo = slug.replace(/^videos\//, "");
  const dir = path.join(VIDEOS_DIR, limpo);
  if (!fs.existsSync(dir)) {
    throw new Error(`Pasta do vídeo não encontrada: ${dir}`);
  }
  return dir;
}

/**
 * Calcula timestamps inteligentes de amostragem por cena a partir do roteiro e index.html.
 */
export function calcularTimestampsCenas(vDir) {
  const indexHtml = path.join(vDir, "index.html");
  const roteiroJson = path.join(vDir, "roteiro.json");

  let framesInfo = [];

  // 1. Tenta extrair timings do index.html (fonte oficial do HyperFrames)
  if (fs.existsSync(indexHtml)) {
    const html = fs.readFileSync(indexHtml, "utf8");
    const re = /data-composition-id="([^"]+)"[\s\S]*?data-start="([^"]+)"[\s\S]*?data-duration="([^"]+)"/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const id = m[1];
      if (id === "main" || id === "captions") continue;
      const start = parseFloat(m[2]);
      const duration = parseFloat(m[3]);
      if (!isNaN(start) && !isNaN(duration)) {
        framesInfo.push({ id, start, duration });
      }
    }
  }

  // 2. Se não encontrou no index.html, tenta pelo roteiro.json
  if (framesInfo.length === 0 && fs.existsSync(roteiroJson)) {
    try {
      const rot = JSON.parse(fs.readFileSync(roteiroJson, "utf8"));
      const durEstimada = 8.0;
      framesInfo = (rot.frames || []).map((f, i) => ({
        id: f.id || `frame-${String(i + 1).padStart(2, "0")}`,
        start: i * durEstimada,
        duration: durEstimada,
      }));
    } catch {}
  }

  // Fallback padrão se nada encontrado
  if (framesInfo.length === 0) {
    framesInfo = [
      { id: "frame-01", start: 0, duration: 8 },
      { id: "frame-02", start: 8, duration: 8 },
      { id: "frame-03", start: 16, duration: 8 },
      { id: "frame-04", start: 24, duration: 8 },
    ];
  }

  // Para cada cena, amostra 2 pontos: 30% e 75% da duração
  const cenas = [];
  const todosTimestamps = [];

  for (const f of framesInfo) {
    const t1 = Math.round((f.start + f.duration * 0.3) * 100) / 100;
    const t2 = Math.round((f.start + f.duration * 0.75) * 100) / 100;
    cenas.push({
      id: f.id,
      start: f.start,
      duration: f.duration,
      timestamps: [t1, t2],
    });
    todosTimestamps.push(t1, t2);
  }

  return { cenas, todosTimestamps };
}

/**
 * Orquestrador principal da auditoria visual.
 *
 * @param {string} slug - Identificador da pasta do vídeo
 * @param {object} [opcoes]
 * @param {boolean} [opcoes.fast=false] - Pula Tier 2 (roda apenas Tier 1 determinístico)
 * @param {string} [opcoes.provider] - Provedor VLM explícito (groq, nvidia, gemini, openai, ollama)
 * @param {string} [opcoes.engine] - Motor de imagem (auto, sharp, python)
 * @param {boolean} [opcoes.reuseSnapshots=false] - Reutiliza snapshots existentes em vez de recapturar
 * @returns {Promise<object>}
 */
export async function auditarVideoVisual(slug, opcoes = {}) {
  const inicioTotal = Date.now();
  const vDir = resolverVideoDir(slug);
  const auditDir = path.join(vDir, "renders", "audit");
  const snapDir = path.join(auditDir, "snapshots");
  fs.mkdirSync(snapDir, { recursive: true });

  let titulo = slug;
  let roteiro = {};
  try {
    const rotPath = path.join(vDir, "roteiro.json");
    if (fs.existsSync(rotPath)) {
      roteiro = JSON.parse(fs.readFileSync(rotPath, "utf8"));
      titulo = roteiro.titulo || slug;
    }
  } catch {}

  // 1. Extração / Amostragem Inteligente de Snapshots
  const { cenas: specCenas, todosTimestamps } = calcularTimestampsCenas(vDir);
  const timestampsStr = todosTimestamps.join(",");

  if (!opcoes.reuseSnapshots) {
    execFileSync(
      "npx",
      [
        "--yes",
        `hyperframes@${HYPERFRAMES_VERSION}`,
        "snapshot",
        path.relative(ROOT, vDir),
        "--at",
        timestampsStr,
        "--no-end",
        "--describe",
        "false",
        "-o",
        snapDir,
      ],
      { stdio: "inherit", cwd: ROOT }
    );
  }

  // 2. Mapeamento de arquivos capturados para as cenas
  const pngsSalvos = fs
    .readdirSync(snapDir)
    .filter((f) => f.endsWith(".png"))
    .sort()
    .map((f) => path.join(snapDir, f));

  let pngIdx = 0;
  const cenasParaAnalise = specCenas.map((c) => {
    const amostras = c.timestamps.map((t) => {
      const caminho = pngsSalvos[pngIdx++];
      return { caminho: caminho || pngsSalvos[pngsSalvos.length - 1], tempo: t };
    });
    return { id: c.id, amostras };
  });

  // 3. Execução do Tier 1 Determinístico Local
  const perfil = obterPerfil(roteiro);
  const tier1 = await executarHeuristicas(cenasParaAnalise, {
    preferencia: opcoes.engine || process.env.MOTOR_CV_ENGINE || "auto",
    perfil,
  });

  // 4. Geração de Pranchas de Contato (Humana e VLM)
  const pranchas = await gerarPranchas(tier1, {
    dirSaida: auditDir,
    titulo: `Auditoria Visual: ${titulo}`,
    preferencia: opcoes.engine || process.env.MOTOR_CV_ENGINE || "auto",
    perfil,
  });

  // 5. Execução do Tier 2 Crítico VLM (se habilitado)
  let tier2 = null;
  if (!opcoes.fast) {
    try {
      tier2 = await auditarComVlm(pranchas.vlm, pranchas.mapaVlm, {
        provedor: opcoes.provider,
        env: process.env,
        formato: perfil.id,
      });
    } catch (err) {
      console.warn(`[visual-audit] Aviso no Tier 2 VLM: ${err.message}. Prosseguindo com fallback.`);
      tier2 = {
        ativo: false,
        provedor: "erro",
        aviso: `Falha ao consultar VLM: ${err.message}`,
        nota_geral: null,
      };
    }
  } else {
    tier2 = {
      ativo: false,
      provedor: "offline",
      aviso: "Modo rápido (--fast): Tier 2 VLM ignorado intencionalmente.",
      nota_geral: null,
    };
  }

  // 6. Consolidação de Notas e Status
  const notaTier1 = tier1.resumo.nota;
  let notaFinal = notaTier1;
  let aprovado = tier1.resumo.aprovado;

  if (tier2?.ativo && typeof tier2.nota_geral === "number") {
    // Ponderação: 40% Tier 1 (conformidade mecânica/safe-zone) + 60% Tier 2 (estética/arte)
    notaFinal = Math.round((notaTier1 * 0.4 + tier2.nota_geral * 0.6) * 10) / 10;
    aprovado = tier1.resumo.aprovado && tier2.aprovado && notaFinal >= 8.0;
  } else {
    aprovado = tier1.resumo.aprovado && notaFinal >= 8.0;
  }

  const duracaoTotalMs = Date.now() - inicioTotal;

  // 7. Geração do Relatório Markdown e JSON
  const dadosResultado = {
    slug,
    titulo,
    formato: perfil.id,
    aprovado,
    notaFinal,
    duracaoTotalMs,
    tier1,
    tier2,
    pranchas,
    specCenas,
  };

  const relatorioMd = formatarRelatorioMarkdown(dadosResultado);
  const caminhoMd = salvarRelatorio(auditDir, relatorioMd, slug);
  const caminhoJson = path.join(auditDir, "audit-result.json");
  fs.writeFileSync(caminhoJson, JSON.stringify(dadosResultado, null, 2), "utf8");

  return {
    ...dadosResultado,
    caminhoMd,
    caminhoJson,
  };
}

// Execução via CLI direta
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Uso: node motor/audit/visual.js <slug-do-video> [--fast] [--provider=gemini|groq|nvidia|openai]");
    process.exit(1);
  }

  const fast = process.argv.includes("--fast");
  const reuseSnaps = process.argv.includes("--reuse-snapshots");
  const providerArg = process.argv.find((a) => a.startsWith("--provider="))?.split("=")[1];

  console.log(`\n🔍 Iniciando auditoria visual por visão computacional para: videos/${slug}...`);

  auditarVideoVisual(slug, { fast, provider: providerArg, reuseSnapshots: reuseSnaps })
    .then((r) => {
      console.log(`\n======================================================`);
      console.log(`📊 RESULTADO DA AUDITORIA VISUAL: ${r.slug.toUpperCase()}`);
      console.log(`======================================================`);
      console.log(`• Status:     ${r.aprovado ? "🟢 APROVADO" : "🔴 REPROVADO"}`);
      console.log(`• Nota Final: ${r.notaFinal.toFixed(1)} / 10`);
      console.log(`• Tier 1:     ${r.tier1.motor} (${r.tier1.duracaoMs}ms, ${r.tier1.resumo.criticos} críticos, ${r.tier1.resumo.altos} altos)`);
      console.log(`• Tier 2 VLM: ${r.tier2.ativo ? `${r.tier2.provedorNome} (${r.tier2.nota_geral?.toFixed(1)}/10)` : "Inativo"}`);
      console.log(`• Prancha:    ${path.relative(ROOT, r.pranchas.humana)}`);
      console.log(`• Relatório:  ${path.relative(ROOT, r.caminhoMd)}`);
      console.log(`======================================================\n`);
      if (!r.aprovado) process.exitCode = 2;
    })
    .catch((err) => {
      console.error("\n❌ Erro fatal na auditoria visual:", err.message);
      process.exit(1);
    });
}
