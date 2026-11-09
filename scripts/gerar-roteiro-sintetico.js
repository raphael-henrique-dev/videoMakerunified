#!/usr/bin/env node
// scripts/gerar-roteiro-sintetico.js — Roteiro horizontal sintético para teste de carga (~10 min, ~40 cenas)
//
// Uso:
//   node scripts/gerar-roteiro-sintetico.js [slug] [--cenas=40] [--minutos=10] [--sem-audio]
//
// Cria videos/<slug>/ (via `video:novo --formato=horizontal`) com um roteiro que usa as cenas data-driven.
// Sem --sem-audio: rode `npm run video:audio -- <slug>` (usa espeak-ng quando não há ELEVENLABS_API_KEY).
// Com --sem-audio: grava um timeline.json estimado (sem áudio), útil para testar o gerador e o render sem TTS.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PALAVRAS_POR_SEGUNDO = 3.1;

const TIPOS_ROTATIVOS = ["lista-animada", "comparacao-ab", "grafico-barra", "grafico-linha", "linha-do-tempo", "numero-grande", "diagrama-fluxo", "mascote-explica"];

function dadosDaCena(tipo, n) {
  switch (tipo) {
    case "capitulo-titulo":
      return { kicker: `CAPÍTULO ${String(n).padStart(2, "0")}`, titulo: `Tema número ${n}`, subtitulo: "Texto sintético de teste" };
    case "lista-animada":
      return { titulo: `Três pontos sobre o tema ${n}`, itens: ["Primeiro ponto importante", "Segundo ponto importante", "Terceiro ponto importante"] };
    case "comparacao-ab":
      return { titulo: "Antes e depois", a: { rotulo: "Antes", valor: "10", itens: ["Lento", "Caro"] }, b: { rotulo: "Depois", valor: "90", itens: ["Rápido", "Barato"] } };
    case "grafico-barra":
      return { titulo: "Comparação", unidade: "%", barras: [{ rotulo: "A", valor: 20 }, { rotulo: "B", valor: 55 }, { rotulo: "C", valor: 80 }, { rotulo: "D", valor: 35 }] };
    case "grafico-linha":
      return { titulo: "Evolução", unidade: "pts", pontos: [10, 25, 20, 45, 60, 80].map((valor, i) => ({ rotulo: `T${i + 1}`, valor })) };
    case "linha-do-tempo":
      return { titulo: "Linha do tempo", marcos: [{ rotulo: "1950", texto: "Começo" }, { rotulo: "1990", texto: "Virada" }, { rotulo: "2020", texto: "Hoje" }] };
    case "numero-grande":
      return { valor: 1000 + n * 37, sufixo: " km", rotulo: "Distância percorrida no teste" };
    case "diagrama-fluxo":
      return { titulo: "Como funciona", etapas: ["Entrada", "Processo", "Saída"] };
    case "mascote-explica":
      return { destaque: "Veja só", fala: `No trecho ${n}, o mascote explica a ideia principal em poucas palavras.`, humor: "feliz" };
    default:
      return {};
  }
}

function frasesSinteticas(n, palavrasAlvo) {
  const base = `Este é o trecho sintético ${n} do teste de carga do motor, falando sobre um assunto qualquer para medir tempo e memória`.split(" ");
  const palavras = [];
  while (palavras.length < palavrasAlvo) palavras.push(...base);
  const texto = palavras.slice(0, palavrasAlvo);
  const frases = [];
  for (let i = 0; i < texto.length; i += 14) frases.push({ texto: texto.slice(i, i + 14).join(" ") + ".", plano: i === 0 ? "gancho" : "explicacao" });
  return frases;
}

/** Gera o objeto roteiro horizontal sintético (puro). */
export function gerarRoteiroSintetico({ slug = "sintetico-horizontal", cenas = 40, minutos = 10 } = {}) {
  const porCapitulo = 8;
  const palavrasPorCena = Math.max(8, Math.round((minutos * 60 * PALAVRAS_POR_SEGUNDO) / cenas));
  const capitulos = [];
  let n = 0;
  while (n < cenas) {
    const idx = capitulos.length + 1;
    const frames = [];
    for (let k = 0; k < porCapitulo && n < cenas; k++, n++) {
      const tipo = k === 0 ? "capitulo-titulo" : TIPOS_ROTATIVOS[(n + k) % TIPOS_ROTATIVOS.length];
      frames.push({
        id: `frame-${String(n + 1).padStart(2, "0")}`,
        numero: String(n + 1).padStart(2, "0"),
        titulo: k === 0 ? `Capítulo ${idx}` : `Cena ${n + 1}`,
        cena: { tipo, dados: dadosDaCena(tipo, n + 1) },
        frases: frasesSinteticas(n + 1, palavrasPorCena),
      });
    }
    capitulos.push({ id: `cap-${idx}`, titulo: `Capítulo ${idx}`, frames });
  }
  return {
    id: slug,
    formato: "horizontal",
    titulo: "Roteiro Sintético de Teste de Carga",
    subtitulo: "Gerado por scripts/gerar-roteiro-sintetico.js",
    fps: 30,
    resolucao: { largura: 1920, altura: 1080 },
    voz: { motor: "local" },
    capitulos,
  };
}

/** Timeline estimada (sem áudio) no mesmo formato que o pipeline de áudio grava em timeline.json. */
export function timelineEstimada(roteiro) {
  const frames = [];
  const todasFrases = [];
  let cursor = 0;
  const r3 = (n) => Number(n.toFixed(3));
  roteiro.capitulos.forEach((cap) =>
    cap.frames.forEach((f) => {
      const inicioFrame = cursor;
      const frasesFrame = [];
      f.frases.forEach((fr) => {
        const textos = fr.texto.split(/\s+/).filter(Boolean);
        const dur = textos.length / PALAVRAS_POR_SEGUNDO;
        const iniLocal = cursor - inicioFrame;
        const item = {
          frameId: f.id,
          frameNumero: f.numero,
          plano: fr.plano,
          jogo: null,
          gancho: false,
          texto: fr.texto,
          marcado: fr.texto,
          inicioLocal: r3(iniLocal),
          fimLocal: r3(iniLocal + dur),
          inicio: r3(cursor),
          fim: r3(cursor + dur),
          palavras: textos.map((w, i) => ({
            texto: w.replace(/[.,!?;:…]+$/, ""),
            exibicao: w,
            chave: false,
            inicioLocal: r3(iniLocal + (i / textos.length) * dur),
            fimLocal: r3(iniLocal + ((i + 1) / textos.length) * dur),
            inicio: r3(cursor + (i / textos.length) * dur),
            fim: r3(cursor + ((i + 1) / textos.length) * dur),
          })),
        };
        frasesFrame.push(item);
        todasFrases.push(item);
        cursor += dur + 0.12;
      });
      cursor += 0.22;
      frames.push({
        id: f.id,
        numero: f.numero,
        titulo: f.titulo,
        arquivo: `compositions/frames/${f.id}.html`,
        capituloId: cap.id,
        audioSrc: `assets/voice/${f.id}.wav`,
        inicio: Number(inicioFrame.toFixed(2)),
        duracao: r3(cursor - inicioFrame),
        fim: Number(cursor.toFixed(2)),
        frases: frasesFrame,
      });
    })
  );
  return { id: roteiro.id, titulo: roteiro.titulo, fps: 30, total: r3(cursor), fatorAceleracaoVoz: 1, frames, frases: todasFrases, sons: [] };
}

function principal() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith("--")) || "sintetico-horizontal";
  const num = (nome, padrao) => Number(args.find((a) => a.startsWith(`--${nome}=`))?.split("=")[1]) || padrao;
  const cenas = num("cenas", 40);
  const minutos = num("minutos", 10);
  const dir = path.join(ROOT, "videos", slug);

  if (!fs.existsSync(dir)) {
    execFileSync("node", [path.join(ROOT, "motor/cli/orchestrator.js"), "novo", slug, "Roteiro Sintético", "--formato=horizontal"], { stdio: "inherit" });
  }
  // remove a composição de exemplo do template (o roteiro sintético usa só cenas data-driven)
  fs.rmSync(path.join(dir, "compositions", "frames", "01-abertura.html"), { force: true });
  const roteiro = gerarRoteiroSintetico({ slug, cenas, minutos });
  fs.writeFileSync(path.join(dir, "roteiro.json"), JSON.stringify(roteiro, null, 2), "utf8");
  console.log(`[sintetico] roteiro com ${cenas} cenas em ${roteiro.capitulos.length} capítulos (~${minutos} min) em videos/${slug}/roteiro.json`);

  if (args.includes("--sem-audio")) {
    fs.writeFileSync(path.join(dir, "timeline.json"), JSON.stringify(timelineEstimada(roteiro), null, 2), "utf8");
    console.log("[sintetico] timeline.json estimado gravado (sem áudio).");
  }
  console.log(`Próximos passos: ${args.includes("--sem-audio") ? "" : `npm run video:audio -- ${slug} && `}npm run video:storyboard -- ${slug} && npm run video:check -- ${slug}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) principal();
