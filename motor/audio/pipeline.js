// motor/audio/pipeline.js — Pipeline Unificado de Áudio Multi-Vídeo (ElevenLabs Cache SHA-1 + Fallback Local + Sidechain Ducking -14 LUFS)

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validarRoteiro } from "../schema/roteiro.schema.js";
import { achatarRoteiro, obterPerfil } from "../formato.js";
import { fetchComRetry, mapComConcorrencia } from "./elevenlabs.js";
import { ALVO_LUFS, parsearMedicaoLoudnorm, filtroMedicaoLoudnorm, filtroAplicacaoLoudnorm } from "./loudnorm.js";
import { CROSSFADE_TRILHA_S, intervalosCapitulos, planejarSegmentosTrilha, agruparSonsPorIntervalo } from "./capitulos.js";

const CONCORRENCIA_TTS = 3;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const GLOBAL_SFX_DIR = path.join(ROOT, "assets", "sfx");
const GLOBAL_NARRACAO_CACHE = path.join(ROOT, "assets", "narracao-cache");

// Carrega .env do motor-v2 ou da raiz do workspace
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

// Resolve a pasta do vídeo alvo: process.argv[2] (ex: "videos/cabo-submarino" ou "cabo-submarino")
function resolverDiretorioVideo() {
  const arg = process.argv[2];
  if (!arg) {
    if (fs.existsSync(path.join(process.cwd(), "roteiro.json"))) {
      return process.cwd();
    }
    return path.join(ROOT, "videos", "cabo-submarino");
  }
  if (path.isAbsolute(arg)) return arg;
  if (arg.startsWith("videos/")) return path.join(ROOT, arg);
  const emVideos = path.join(ROOT, "videos", arg);
  if (fs.existsSync(emVideos)) return emVideos;
  return path.resolve(process.cwd(), arg);
}

const VIDEO_DIR = resolverDiretorioVideo();
const NARRACAO_DIR = path.join(VIDEO_DIR, "narracao");
const VOICE_OUT_DIR = path.join(VIDEO_DIR, "assets", "voice");
const BGM_OUT_DIR = path.join(VIDEO_DIR, "assets", "bgm");

fs.mkdirSync(NARRACAO_DIR, { recursive: true });
fs.mkdirSync(VOICE_OUT_DIR, { recursive: true });
fs.mkdirSync(BGM_OUT_DIR, { recursive: true });
fs.mkdirSync(GLOBAL_NARRACAO_CACHE, { recursive: true });

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "motor-v2-audio-"));

function resolverBinario(nome) {
  try {
    return execFileSync("which", [nome]).toString().trim();
  } catch {
    return nome;
  }
}

const FFMPEG = resolverBinario("ffmpeg");
const FFPROBE = resolverBinario("ffprobe");

function duracaoAudio(arq) {
  const out = execFileSync(FFPROBE, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "csv=p=0",
    arq,
  ]).toString();
  return parseFloat(out.trim());
}

function rodarFfmpeg(args) {
  execFileSync(FFMPEG, ["-y", "-hide_banner", "-loglevel", "error", ...args], {
    stdio: ["ignore", "ignore", "inherit"],
  });
}

function extrairTokens(marcado) {
  let dentro = false;
  return marcado
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => {
      const abre = tok.startsWith("*");
      if (abre) dentro = true;
      const chave = dentro;
      if (tok.slice(abre ? 1 : 0).includes("*")) dentro = false;
      const textoExibicao = tok.replace(/\*/g, "");
      const textoLimpo = textoExibicao.replace(/[.,!?;:…]+$/, "");
      return { texto: textoLimpo, exibicao: textoExibicao, chave };
    });
}

const limparMarcacao = (marcado) => marcado.replace(/\*/g, "");

function hashFraseElevenLabs(vozCfg, textoLimpo) {
  const cfg = {
    id: vozCfg.id || "TX3LPaxmHKxFdv7VOQHJ",
    modelo: vozCfg.modelo || "eleven_multilingual_v2",
    estabilidade: vozCfg.estabilidade ?? 0.38,
    similaridade: vozCfg.similaridade ?? 0.80,
    estilo: vozCfg.estilo ?? 0.40,
    velocidade: vozCfg.velocidade ?? 1.08,
  };
  const hash = crypto
    .createHash("sha1")
    .update(JSON.stringify([cfg, textoLimpo]))
    .digest("hex")
    .slice(0, 16);
  return { cfg, hash };
}

async function obterAudioFrase(vozCfg, textoMarcado, anteriorLimpo, proximoLimpo, idx) {
  const textoLimpo = limparMarcacao(textoMarcado);
  const { cfg, hash } = hashFraseElevenLabs(vozCfg, textoLimpo);
  const mp3Local = path.join(NARRACAO_DIR, `${hash}.mp3`);
  const jsonLocal = path.join(NARRACAO_DIR, `${hash}.json`);
  const mp3Global = path.join(GLOBAL_NARRACAO_CACHE, `${hash}.mp3`);
  const jsonGlobal = path.join(GLOBAL_NARRACAO_CACHE, `${hash}.json`);

  // 1. Verifica cache local do vídeo ou global da máquina
  const mp3Cache = fs.existsSync(mp3Local) ? mp3Local : fs.existsSync(mp3Global) ? mp3Global : null;
  const jsonCache = fs.existsSync(jsonLocal) ? jsonLocal : fs.existsSync(jsonGlobal) ? jsonGlobal : null;

  if (mp3Cache && jsonCache) {
    if (!fs.existsSync(mp3Local)) fs.copyFileSync(mp3Cache, mp3Local);
    if (!fs.existsSync(jsonLocal)) fs.copyFileSync(jsonCache, jsonLocal);
    const al = JSON.parse(fs.readFileSync(jsonLocal, "utf8"));
    return { modo: "elevenlabs-cache", hash, mp3: mp3Local, al, textoMarcado, textoLimpo };
  }

  // 2. Se tiver ELEVENLABS_API_KEY, requisita à API
  if (vozCfg.motor === "elevenlabs" && process.env.ELEVENLABS_API_KEY) {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${cfg.id}/with-timestamps?output_format=mp3_44100_128`;
    const res = await fetchComRetry(fetch, url, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: textoLimpo,
        model_id: cfg.modelo,
        previous_text: anteriorLimpo || undefined,
        next_text: proximoLimpo || undefined,
        voice_settings: {
          stability: cfg.estabilidade,
          similarity_boost: cfg.similaridade,
          style: cfg.estilo,
          speed: cfg.velocidade,
          use_speaker_boost: true,
        },
      }),
    }, { tentativas: 5, log: console.warn });
    const dados = await res.json();
    fs.writeFileSync(mp3Local, Buffer.from(dados.audio_base64, "base64"));
    fs.writeFileSync(jsonLocal, JSON.stringify(dados.alignment), "utf8");
    fs.writeFileSync(mp3Global, Buffer.from(dados.audio_base64, "base64"));
    fs.writeFileSync(jsonGlobal, JSON.stringify(dados.alignment), "utf8");
    return { modo: "elevenlabs-api", hash, mp3: mp3Local, al: dados.alignment, textoMarcado, textoLimpo };
  }

  // 3. Fallback local determinístico via espeak-ng
  const wavBruto = path.join(tmpDir, `espeak-bruto-${idx}.wav`);
  execFileSync("espeak-ng", ["-v", "pt-br", "-s", "180", "-w", wavBruto, textoLimpo]);
  return { modo: "local-espeak", hash, wavBruto, textoMarcado, textoLimpo };
}

function alinharFrase(item, idx) {
  const tk = extrairTokens(item.textoMarcado);

  if (item.al) {
    const ch = item.al.characters;
    const ini = item.al.character_start_times_seconds;
    const fim = item.al.character_end_times_seconds;
    const pal = [];
    let atual = null;
    ch.forEach((c, k) => {
      if (/\s/.test(c)) {
        atual = null;
        return;
      }
      if (!atual) {
        atual = { inicio: ini[k], fim: fim[k] };
        pal.push(atual);
      }
      atual.fim = fim[k];
    });
    const durBruta = duracaoAudio(item.mp3);
    const s0 = Math.max(0, (pal[0]?.inicio ?? 0) - 0.03);
    const e0 = Math.min(durBruta, (pal[pal.length - 1]?.fim ?? durBruta) + 0.1);
    return {
      modo: item.modo,
      hash: item.hash,
      arqOrigem: item.mp3,
      s0,
      e0,
      palavras: pal.map((p, j) => ({
        ...(tk[j] || { texto: "", exibicao: "", chave: false }),
        inicio: Math.max(0, p.inicio - s0),
        fim: Math.max(0.02, p.fim - s0),
      })),
    };
  }

  const dur = duracaoAudio(item.wavBruto);
  const pesos = tk.map((w) => (w.texto.match(/[aeiouáéíóúâêôãõà]+/gi) || [""]).length + 0.35);
  const somaPesos = pesos.reduce((a, b) => a + b, 0);
  let cursor = 0;
  const palavras = tk.map((w, j) => {
    const d = (pesos[j] / somaPesos) * dur * 0.94;
    const p = { ...w, inicio: cursor, fim: cursor + d };
    cursor += d;
    return p;
  });
  return {
    modo: item.modo,
    hash: item.hash,
    arqOrigem: item.wavBruto,
    s0: 0,
    e0: dur,
    palavras,
  };
}

function resolverArquivoSom(nome, instante = 0) {
  const dirSfx = fs.existsSync(path.join(VIDEO_DIR, "assets", "sfx"))
    ? path.join(VIDEO_DIR, "assets", "sfx")
    : GLOBAL_SFX_DIR;

  if (!fs.existsSync(dirSfx)) return null;
  const arqs = fs.readdirSync(dirSfx).filter((f) => /\.(wav|ogg|mp3)$/.test(f));
  const candidatos = arqs
    .filter((f) => f.replace(/\.\w+$/, "").replace(/-\d+$/, "") === nome)
    .sort();
  if (!candidatos.length) return null;
  const idx = Math.floor(Math.abs(instante) * 7.31) % candidatos.length;
  return path.join(dirSfx, candidatos[idx]);
}

/** Gera um barramento estéreo de SFX com `duracao` segundos a partir de sons com tempo `em` relativo ao barramento. */
function gerarBusSfx(sons, duracao, saida, nomeScript) {
  if (sons.length === 0) {
    rodarFfmpeg(["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", duracao.toFixed(3), saida]);
    return;
  }
  const inSfx = [];
  sons.forEach((s) => inSfx.push("-i", s.arq));
  const filtrosSfx = sons.map((s, i) => {
    const corte = s.dur ? `atrim=0:${s.dur},afade=t=out:st=${Math.max(0, s.dur - 0.25)}:d=0.25,` : "";
    return `[${i}]aformat=sample_rates=48000:channel_layouts=stereo,${corte}volume=${s.ganho},adelay=delays=${Math.round(s.em * 1000)}:all=1[e${i}]`;
  });
  filtrosSfx.push(
    `${sons.map((_, i) => `[e${i}]`).join("")}amix=inputs=${sons.length}:normalize=0,apad=whole_dur=${duracao.toFixed(3)}[out]`
  );
  const scriptSfx = path.join(tmpDir, nomeScript);
  fs.writeFileSync(scriptSfx, filtrosSfx.join(";"), "utf8");
  rodarFfmpeg([...inSfx, "-filter_complex_script", scriptSfx, "-map", "[out]", "-ar", "48000", "-ac", "2", "-t", duracao.toFixed(3), saida]);
}

/** Mede a loudness integrada (LUFS) de um arquivo com o filtro loudnorm em modo de medição. */
function medirLoudness(arquivo, filtro = filtroMedicaoLoudnorm()) {
  const r = spawnSync(FFMPEG, ["-hide_banner", "-nostats", "-i", arquivo, "-af", filtro, "-f", "null", "-"], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`Falha ao medir loudness: ${r.stderr}`);
  return parsearMedicaoLoudnorm(r.stderr);
}

/**
 * Monta uma trilha contínua com a música de cada capítulo (loop dentro do capítulo, crossfade de 1,5 s entre trilhas).
 * Retorna o caminho do WAV estéreo com a duração total, ou null se nenhum trecho tem música.
 */
function gerarTrilhaPorCapitulo(segmentos, duracaoTotal, saida) {
  if (!segmentos.some((sg) => sg.arquivo)) return null;
  const resolvidos = segmentos.map((sg) => {
    const arq = sg.arquivo ? resolverArquivoSom(sg.arquivo, 0) : null;
    if (sg.arquivo && !arq) console.warn(`[audio] Aviso: trilha '${sg.arquivo}' não encontrada; capítulo ficará sem música.`);
    return { ...sg, arq };
  });
  if (!resolvidos.some((sg) => sg.arq)) return null;
  const dur = resolvidos.map((sg) => sg.fim - sg.inicio);
  const xf = resolvidos.slice(0, -1).map((_, i) => Math.min(CROSSFADE_TRILHA_S, dur[i] / 2, dur[i + 1] / 2));
  const wavs = resolvidos.map((sg, i) => {
    const wav = path.join(tmpDir, `trilha_seg_${i}.wav`);
    const comprimento = (dur[i] + (xf[i] ?? 0)).toFixed(3);
    if (sg.arq) {
      rodarFfmpeg(["-stream_loop", "-1", "-i", sg.arq, "-t", comprimento, "-af", "aformat=sample_rates=48000:channel_layouts=stereo", wav]);
    } else {
      rodarFfmpeg(["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", comprimento, wav]);
    }
    return wav;
  });
  if (wavs.length === 1) return wavs[0];
  let filtro = "";
  let anterior = "[0:a]";
  for (let i = 1; i < wavs.length; i++) {
    const rotulo = i === wavs.length - 1 ? "[out]" : `[x${i}]`;
    filtro += `${anterior}[${i}:a]acrossfade=d=${xf[i - 1].toFixed(3)}:c1=tri:c2=tri${rotulo};`;
    anterior = rotulo;
  }
  rodarFfmpeg([...wavs.flatMap((w) => ["-i", w]), "-filter_complex", filtro.slice(0, -1), "-map", "[out]", "-ar", "48000", "-ac", "2", "-t", duracaoTotal.toFixed(3), saida]);
  return saida;
}

async function executarPipeline() {
  const roteiroPath = path.join(VIDEO_DIR, "roteiro.json");
  if (!fs.existsSync(roteiroPath)) {
    throw new Error(`Arquivo roteiro.json não encontrado em: ${VIDEO_DIR}`);
  }
  const roteiroOriginal = JSON.parse(fs.readFileSync(roteiroPath, "utf8"));
  const roteiro = achatarRoteiro(roteiroOriginal);
  const validacao = validarRoteiro(roteiroOriginal, { videoDir: VIDEO_DIR });
  if (!validacao.valido) {
    throw new Error(`roteiro.json inválido em ${VIDEO_DIR}:\n- ${validacao.erros.join("\n- ")}`);
  }

  (validacao.avisos || []).forEach((a) => console.warn(`[audio] Aviso: ${a}`));

  console.log(`[audio] Processando áudio para: ${path.relative(ROOT, VIDEO_DIR)} ("${roteiro.titulo}")`);

  const listaPlana = [];
  roteiro.frames.forEach((frame, fIdx) => {
    frame.frases.forEach((fr, pIdx) => {
      listaPlana.push({
        frameIdx: fIdx,
        frameId: frame.id,
        fraseIdxNoFrame: pIdx,
        ...fr,
      });
    });
  });

  const vozCfg = roteiro.voz || { motor: "elevenlabs" };
  let concluidas = 0;
  const brutos = await mapComConcorrencia(listaPlana, CONCORRENCIA_TTS, async (item, i) => {
    const ant = i > 0 ? limparMarcacao(listaPlana[i - 1].texto) : undefined;
    const prox = i < listaPlana.length - 1 ? limparMarcacao(listaPlana[i + 1].texto) : undefined;
    const r = await obterAudioFrase(vozCfg, item.texto, ant, prox, i);
    concluidas++;
    if (listaPlana.length > 10 && (concluidas % 10 === 0 || concluidas === listaPlana.length)) {
      console.log(`[audio] Narração: ${concluidas}/${listaPlana.length} frases (${r.modo})`);
    }
    return r;
  });

  const fatias = brutos.map((b, i) => alinharFrase(b, i));
  const PAUSA_ENTRE_FRASES = 0.12;
  const PAUSA_FIM_FRAME = 0.22;

  const totalPalavras = fatias.reduce((acc, f) => acc + f.palavras.length, 0);
  const durNatural = fatias.reduce((acc, f) => acc + (f.e0 - f.s0) + PAUSA_ENTRE_FRASES, 0);
  const ppmNatural = totalPalavras / (durNatural / 60);
  const alvoPpm = roteiro.alvoPpm || 190;
  const fatorAceleracao =
    vozCfg.acelerar && vozCfg.acelerar !== "auto"
      ? Number(vozCfg.acelerar)
      : Math.min(1.32, Math.max(1.0, alvoPpm / ppmNatural));

  console.log(
    `[audio] Modos: ${[...new Set(fatias.map((f) => f.modo))].join(", ")} | ` +
      `PPM natural: ${ppmNatural.toFixed(0)} -> Fator: ${fatorAceleracao.toFixed(2)}x (${(ppmNatural * fatorAceleracao).toFixed(0)} PPM)`
  );

  const frasesProcessadas = fatias.map((f, i) => {
    const wavFrase = path.join(tmpDir, `frase-${i}.wav`);
    rodarFfmpeg([
      "-i",
      f.arqOrigem,
      "-af",
      `atrim=${f.s0.toFixed(3)}:${f.e0.toFixed(3)},asetpts=PTS-STARTPTS,atempo=${fatorAceleracao.toFixed(4)}`,
      "-ar",
      "48000",
      "-ac",
      "1",
      wavFrase,
    ]);
    const dur = duracaoAudio(wavFrase);
    return {
      ...listaPlana[i],
      hash: f.hash,
      modo: f.modo,
      wav: wavFrase,
      dur,
      palavras: f.palavras.map((p) => ({
        ...p,
        inicio: p.inicio / fatorAceleracao,
        fim: p.fim / fatorAceleracao,
      })),
    };
  });

  let cursorGlobal = 0;
  const framesMeta = [];
  const todasFrasesTimeline = [];
  const todosSonsAgendados = [];

  for (let fIdx = 0; fIdx < roteiro.frames.length; fIdx++) {
    const frameDef = roteiro.frames[fIdx];
    const frasesDoFrame = frasesProcessadas.filter((fp) => fp.frameIdx === fIdx);
    const inicioFrame = cursorGlobal;

    let cursorLocal = 0.12;
    const entradasFfmpeg = [];
    const filtrosDelay = [];
    const frasesFrameTimeline = [];

    frasesDoFrame.forEach((fp, j) => {
      entradasFfmpeg.push("-i", fp.wav);
      const inicioFraseLocal = cursorLocal;
      const inicioFraseGlobal = inicioFrame + inicioFraseLocal;
      const fimFraseLocal = inicioFraseLocal + fp.dur;
      const fimFraseGlobal = inicioFrame + fimFraseLocal;

      filtrosDelay.push(
        `[${j}]adelay=delays=${Math.round(inicioFraseLocal * 1000)}:all=1[v${j}]`
      );

      const palavrasGlobais = fp.palavras.map((p) => ({
        texto: p.texto,
        exibicao: p.exibicao,
        chave: p.chave,
        inicioLocal: Number((inicioFraseLocal + p.inicio).toFixed(3)),
        fimLocal: Number((inicioFraseLocal + p.fim).toFixed(3)),
        inicio: Number((inicioFraseGlobal + p.inicio).toFixed(3)),
        fim: Number((inicioFraseGlobal + p.fim).toFixed(3)),
      }));

      const itemTimeline = {
        frameId: frameDef.id,
        frameNumero: frameDef.numero,
        plano: fp.plano,
        jogo: fp.jogo || null,
        gancho: !!fp.gancho,
        texto: limparMarcacao(fp.texto),
        marcado: fp.texto,
        hashCache: fp.hash,
        modoVoz: fp.modo,
        inicioLocal: Number(inicioFraseLocal.toFixed(3)),
        fimLocal: Number(fimFraseLocal.toFixed(3)),
        inicio: Number(inicioFraseGlobal.toFixed(3)),
        fim: Number(fimFraseGlobal.toFixed(3)),
        palavras: palavrasGlobais,
      };

      frasesFrameTimeline.push(itemTimeline);
      todasFrasesTimeline.push(itemTimeline);

      cursorLocal = fimFraseLocal + PAUSA_ENTRE_FRASES;
    });

    const caudaExtra = frameDef.cauda || 0;
    const duracaoFrame = Number((cursorLocal + PAUSA_FIM_FRAME + caudaExtra).toFixed(2));
    const nomeWavFrame = `frame-${frameDef.numero}.wav`;
    const caminhoWavFrame = path.join(VOICE_OUT_DIR, nomeWavFrame);

    const mixInputs = frasesDoFrame.map((_, j) => `[v${j}]`).join("");
    const filtroFrame =
      filtrosDelay.join(";") +
      `;${mixInputs}amix=inputs=${frasesDoFrame.length}:normalize=0,apad=whole_dur=${duracaoFrame.toFixed(3)}[out]`;

    rodarFfmpeg([
      ...entradasFfmpeg,
      "-filter_complex",
      filtroFrame,
      "-map",
      "[out]",
      "-ar",
      "48000",
      "-ac",
      "1",
      "-t",
      duracaoFrame.toFixed(3),
      caminhoWavFrame,
    ]);

    (frameDef.sons || []).forEach((s) => {
      todosSonsAgendados.push({
        nome: s.nome,
        em: Number((inicioFrame + (s.offset || 0)).toFixed(3)),
        dur: s.dur || null,
        ganho: s.ganho ?? 0.55,
      });
    });

    framesMeta.push({
      id: frameDef.id,
      numero: frameDef.numero,
      titulo: frameDef.titulo,
      arquivo: frameDef.arquivo,
      capituloId: frameDef.capituloId,
      kicker: frameDef.kicker,
      metrica: frameDef.metrica,
      audioSrc: `assets/voice/${nomeWavFrame}`,
      inicio: Number(inicioFrame.toFixed(2)),
      duracao: duracaoFrame,
      fim: Number((inicioFrame + duracaoFrame).toFixed(2)),
      frases: frasesFrameTimeline,
    });

    cursorGlobal = Number((inicioFrame + duracaoFrame).toFixed(2));
  }

  const duracaoTotal = cursorGlobal;

  const masterVoiceWav = path.join(VOICE_OUT_DIR, "master_voice.wav");
  const inputsConcat = [];
  framesMeta.forEach((fm) => inputsConcat.push("-i", path.join(VIDEO_DIR, fm.audioSrc)));
  const concatLabels = framesMeta.map((_, i) => `[${i}:a]`).join("");
  rodarFfmpeg([
    ...inputsConcat,
    "-filter_complex",
    `${concatLabels}concat=n=${framesMeta.length}:v=0:a=1[out]`,
    "-map",
    "[out]",
    "-ar",
    "48000",
    "-ac",
    "1",
    masterVoiceWav,
  ]);

  const sfxValidos = todosSonsAgendados
    .map((s) => ({ ...s, arq: resolverArquivoSom(s.nome, s.em) }))
    .filter((s) => s.arq && s.em < duracaoTotal);

  const sfxBusWav = path.join(tmpDir, "sfx_bus.wav");
  const horizontal = obterPerfil(roteiroOriginal).id === "horizontal";
  if (horizontal && roteiroOriginal.duracaoAlvoMin) {
    const alvoS = roteiroOriginal.duracaoAlvoMin * 60;
    if (Math.abs(duracaoTotal - alvoS) / alvoS > 0.25) {
      console.warn(`[audio] Aviso: duração ${(duracaoTotal / 60).toFixed(1)} min difere mais de 25% do alvo (${roteiroOriginal.duracaoAlvoMin} min). Ajuste o roteiro (~${Math.round(alvoS * 3.1)} palavras para o alvo).`);
    }
  }
  const intervalos = intervalosCapitulos(framesMeta, duracaoTotal);

  if (horizontal && intervalos.length > 1) {
    // Horizontal: um barramento por capítulo, depois concatenado (evita um filter_complex com centenas de entradas)
    const grupos = agruparSonsPorIntervalo(sfxValidos, intervalos);
    const wavsCap = intervalos.map((iv, i) => {
      const wav = path.join(tmpDir, `sfx_cap_${i}.wav`);
      gerarBusSfx(grupos[i].map((s) => ({ ...s, em: s.emRelativo })), iv.fim - iv.inicio, wav, `sfx_filter_${i}.txt`);
      return wav;
    });
    rodarFfmpeg([
      ...wavsCap.flatMap((w) => ["-i", w]),
      "-filter_complex",
      `${wavsCap.map((_, i) => `[${i}:a]`).join("")}concat=n=${wavsCap.length}:v=0:a=1[out]`,
      "-map", "[out]", "-ar", "48000", "-ac", "2", "-t", duracaoTotal.toFixed(3),
      sfxBusWav,
    ]);
  } else {
    gerarBusSfx(sfxValidos, duracaoTotal, sfxBusWav, "sfx_filter.txt");
  }

  const temMusicaPorCapitulo = horizontal && (roteiro.capitulos || []).some((c) => c.musica);
  let arqTrilha = roteiro.trilha ? resolverArquivoSom(roteiro.trilha.arquivo, 0) : null;
  if (temMusicaPorCapitulo) {
    const segmentos = planejarSegmentosTrilha(intervalos, roteiro.capitulos, roteiro.trilha?.arquivo || null);
    arqTrilha = gerarTrilhaPorCapitulo(segmentos, duracaoTotal, path.join(tmpDir, "trilha_capitulos.wav"));
  }
  const masterDuckedBgmWav = path.join(BGM_OUT_DIR, "master_ducked_bgm.wav");
  const masterMix14LufsWav = path.join(BGM_OUT_DIR, "master_mix_14lufs.wav");
  const masterPreLoudnormWav = path.join(tmpDir, "master_pre_loudnorm.wav");
  let lufsFinal = null;

  const ganhoEf = roteiro.efeitos?.ganho ?? 1.15;
  const ganhoTrilha = roteiro.trilha?.ganho ?? 0.24;

  if (arqTrilha) {
    const filtroBed =
      `[0]aformat=channel_layouts=stereo,asplit=2[scTr][scEf];` +
      `[1]volume=${ganhoEf},acompressor=threshold=0.06:ratio=4:attack=5:release=150,alimiter=limit=0.22:attack=3:release=80:level=false[efc];` +
      `[efc][scEf]sidechaincompress=threshold=0.012:ratio=3:attack=8:release=350[ef];` +
      `[2]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${duracaoTotal.toFixed(3)},volume=${ganhoTrilha},` +
      `afade=t=in:d=0.6,afade=t=out:st=${Math.max(0, duracaoTotal - 1.5).toFixed(3)}:d=1.5[tr];` +
      `[tr][scTr]sidechaincompress=threshold=0.035:ratio=3.2:attack=25:release=400[trd];` +
      `[ef][trd]amix=inputs=2:normalize=0,aresample=48000[out]`;

    rodarFfmpeg([
      "-i",
      masterVoiceWav,
      "-i",
      sfxBusWav,
      "-stream_loop",
      "-1",
      "-i",
      arqTrilha,
      "-filter_complex",
      filtroBed,
      "-map",
      "[out]",
      "-ar",
      "48000",
      "-ac",
      "2",
      masterDuckedBgmWav,
    ]);

    const filtroMaster =
      `[0]aformat=channel_layouts=stereo,asplit=3[voz][scTr][scEf];` +
      `[1]volume=${ganhoEf},acompressor=threshold=0.06:ratio=4:attack=5:release=150,alimiter=limit=0.22:attack=3:release=80:level=false[efc];` +
      `[efc][scEf]sidechaincompress=threshold=0.012:ratio=3:attack=8:release=350[ef];` +
      `[2]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${duracaoTotal.toFixed(3)},volume=${ganhoTrilha},` +
      `afade=t=in:d=0.6,afade=t=out:st=${Math.max(0, duracaoTotal - 1.5).toFixed(3)}:d=1.5[tr];` +
      `[tr][scTr]sidechaincompress=threshold=0.035:ratio=3.2:attack=25:release=400[trd];` +
      `[voz][ef][trd]amix=inputs=3:normalize=0,aresample=48000[out]`;

    rodarFfmpeg([
      "-i",
      masterVoiceWav,
      "-i",
      sfxBusWav,
      "-stream_loop",
      "-1",
      "-i",
      arqTrilha,
      "-filter_complex",
      filtroMaster,
      "-map",
      "[out]",
      "-ar",
      "48000",
      "-ac",
      "2",
      masterPreLoudnormWav,
    ]);

    // loudnorm em 2 passadas: mede o mix e aplica com os valores medidos (linear=true)
    const medido = medirLoudness(masterPreLoudnormWav);
    rodarFfmpeg([
      "-i",
      masterPreLoudnormWav,
      "-af",
      `${filtroAplicacaoLoudnorm(medido)},aresample=48000,alimiter=limit=0.82:level=false:attack=1`,
      "-ar",
      "48000",
      "-ac",
      "2",
      masterMix14LufsWav,
    ]);
    lufsFinal = medirLoudness(masterMix14LufsWav).input_i;
    console.log(`[audio] Loudness: mix ${medido.input_i} LUFS -> master ${lufsFinal} LUFS (alvo ${ALVO_LUFS})`);
  }

  const timelineData = {
    id: roteiro.id,
    titulo: roteiro.titulo,
    subtitulo: roteiro.subtitulo,
    fps: roteiro.fps || 30,
    total: duracaoTotal,
    fatorAceleracaoVoz: Number(fatorAceleracao.toFixed(3)),
    frames: framesMeta,
    frases: todasFrasesTimeline,
    sons: sfxValidos.map((s) => ({ nome: s.nome, em: s.em, ganho: s.ganho })),
  };

  fs.writeFileSync(path.join(VIDEO_DIR, "timeline.json"), JSON.stringify(timelineData, null, 2), "utf8");
  fs.writeFileSync(
    path.join(VIDEO_DIR, "audio_meta.json"),
    JSON.stringify(
      {
        videoDir: path.relative(ROOT, VIDEO_DIR),
        geradoEm: new Date().toISOString(),
        duracaoTotal,
        lufsFinal,
        totalFrases: todasFrasesTimeline.length,
        totalPalavras,
        ppmFinal: Math.round(ppmNatural * fatorAceleracao),
        arquivos: {
          vozPorFrame: framesMeta.map((f) => f.audioSrc),
          vozMestre: "assets/voice/master_voice.wav",
          bgmComDucking: "assets/bgm/master_ducked_bgm.wav",
          master14Lufs: "assets/bgm/master_mix_14lufs.wav",
        },
      },
      null,
      2
    ),
    "utf8"
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(
    `[audio] Concluído em ${path.relative(ROOT, VIDEO_DIR)}! Duração total: ${duracaoTotal.toFixed(2)}s | ${framesMeta.length} frames | Master -14 LUFS gerado.`
  );
}

executarPipeline().catch((err) => {
  console.error("[audio] Falha no pipeline:", err);
  process.exit(1);
});
