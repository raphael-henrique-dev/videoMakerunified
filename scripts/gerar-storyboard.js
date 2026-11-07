// scripts/gerar-storyboard.js — Gera STORYBOARD.md, caption_groups.json, captions.html e sincroniza durações em index.html e frames/*.html

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

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
const roteiroPath = path.join(VIDEO_DIR, "roteiro.json");
const timelinePath = path.join(VIDEO_DIR, "timeline.json");

if (!fs.existsSync(roteiroPath) || !fs.existsSync(timelinePath)) {
  console.error(`[storyboard] Arquivos roteiro.json ou timeline.json não encontrados em: ${VIDEO_DIR}`);
  process.exit(1);
}

const roteiro = JSON.parse(fs.readFileSync(roteiroPath, "utf8"));
const timeline = JSON.parse(fs.readFileSync(timelinePath, "utf8"));

// 1. Constrói grupos de legendas de até 4 palavras para o Karaokê de 3 estados
const gruposLegenda = [];
const MAX_PALAVRAS_GRUPO = 4;

timeline.frases.forEach((fr) => {
  const pals = fr.palavras || [];
  for (let i = 0; i < pals.length; i += MAX_PALAVRAS_GRUPO) {
    const fatia = pals.slice(i, i + MAX_PALAVRAS_GRUPO);
    if (!fatia.length) continue;
    gruposLegenda.push({
      frameId: fr.frameId,
      plano: fr.plano,
      start: Number(fatia[0].inicio.toFixed(3)),
      end: Number((fatia[fatia.length - 1].fim + 0.08).toFixed(3)),
      words: fatia.map((w) => ({
        word: w.exibicao || w.texto,
        start: Number(w.inicio.toFixed(3)),
        end: Number(w.fim.toFixed(3)),
        brand: !!w.chave,
      })),
    });
  }
});

for (let i = 0; i < gruposLegenda.length - 1; i++) {
  if (gruposLegenda[i].end > gruposLegenda[i + 1].start) {
    gruposLegenda[i].end = gruposLegenda[i + 1].start;
  }
}

fs.writeFileSync(
  path.join(VIDEO_DIR, "caption_groups.json"),
  JSON.stringify(gruposLegenda, null, 2),
  "utf8"
);

// 2. Gera compositions/captions.html sincronizado
const htmlCaptions = `<template>
  <style>
    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: 700;
      font-display: swap;
      src: url('assets/fonts/Inter-700.woff2') format('woff2');
    }

    #captions-comp {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
    }

    .caption-bar {
      position: absolute;
      left: 64px;
      right: 64px;
      top: 1350px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .caption-pill {
      display: inline-flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 10px 14px;
      padding: 18px 30px;
      background: rgba(6, 11, 22, 0.88);
      border: 1.5px solid rgba(56, 189, 248, 0.32);
      border-radius: 18px;
      box-shadow: 0 18px 44px rgba(0, 0, 0, 0.65);
      min-height: 76px;
      max-width: 940px;
    }

    .cap-word {
      font-size: 38px;
      font-weight: 700;
      line-height: 1.18;
      letter-spacing: -0.02em;
      color: #94a3b8;
    }

    .cap-word.is-spoken {
      color: #f8fafc;
    }

    .cap-word.is-active {
      color: #38bdf8;
      text-shadow: 0 0 22px rgba(56, 189, 248, 0.55);
    }

    .cap-word.cap-brand.is-spoken {
      color: #fbbf24;
    }

    .cap-word.cap-brand.is-active {
      color: #facc15;
      text-shadow: 0 0 24px rgba(250, 204, 21, 0.65);
    }
  </style>

  <div id="captions-comp" data-composition-id="captions" data-width="1080" data-height="1920" data-start="0" data-duration="${timeline.total.toFixed(2)}">
    <div class="caption-bar">
      <div id="caption-pill" class="caption-pill" style="opacity: 0;"></div>
    </div>
  </div>

  <script>
    (function () {
      var GROUPS = ${JSON.stringify(gruposLegenda)};
      var DURACAO = ${timeline.total.toFixed(2)};
      var pill = document.getElementById('caption-pill');
      var indiceGrupoAtual = -1;
      var spansPalavras = [];

      function montarGrupo(idx) {
        if (idx === indiceGrupoAtual) return;
        indiceGrupoAtual = idx;
        spansPalavras = [];
        if (idx < 0 || idx >= GROUPS.length) {
          pill.style.opacity = '0';
          pill.innerHTML = '';
          return;
        }
        var g = GROUPS[idx];
        pill.innerHTML = '';
        for (var i = 0; i < g.words.length; i++) {
          var w = g.words[i];
          var span = document.createElement('span');
          span.className = 'cap-word' + (w.brand ? ' cap-brand' : '');
          span.textContent = w.word;
          pill.appendChild(span);
          spansPalavras.push(span);
        }
        pill.style.opacity = '1';
      }

      function renderizarLegenda(t) {
        var idx = -1;
        for (var i = 0; i < GROUPS.length; i++) {
          if (t >= GROUPS[i].start && t <= GROUPS[i].end) {
            idx = i;
            break;
          }
        }
        montarGrupo(idx);
        if (idx < 0) return;
        var g = GROUPS[idx];
        for (var j = 0; j < g.words.length; j++) {
          var w = g.words[j];
          var sp = spansPalavras[j];
          if (!sp) continue;
          sp.classList.remove('is-active', 'is-spoken');
          if (t >= w.start && t <= w.end + 0.04) {
            sp.classList.add('is-active');
          } else if (t > w.end + 0.04) {
            sp.classList.add('is-spoken');
          }
        }
      }

      var tl = gsap.timeline({ paused: true });
      var proxy = { t: 0 };
      tl.to(proxy, {
        t: DURACAO,
        duration: DURACAO,
        ease: 'none',
        onUpdate: function () {
          renderizarLegenda(proxy.t);
        }
      }, 0);

      window.__timelines = window.__timelines || {};
      window.__timelines['captions'] = tl;

      window.addEventListener('hf-seek', function (ev) {
        if (ev && ev.detail && typeof ev.detail.time === 'number') {
          renderizarLegenda(ev.detail.time);
        }
      });

      renderizarLegenda(0);
    })();
  </script>
</template>
`;

fs.mkdirSync(path.join(VIDEO_DIR, "compositions"), { recursive: true });
fs.writeFileSync(path.join(VIDEO_DIR, "compositions", "captions.html"), htmlCaptions, "utf8");

// 3. Sincroniza automaticamente as durações e offsets nos arquivos HTML de cada frame e no index.html
timeline.frames.forEach((fm) => {
  const arqFrame = path.join(VIDEO_DIR, fm.arquivo);
  if (fs.existsSync(arqFrame)) {
    let htmlFrame = fs.readFileSync(arqFrame, "utf8");
    htmlFrame = htmlFrame.replace(
      /(data-composition-id="[^"]+"[^>]*?data-duration=")[0-9.]+(")/,
      `$1${fm.duracao.toFixed(2)}$2`
    );
    htmlFrame = htmlFrame.replace(/var\s+DUR\s*=\s*[0-9.]+;/, `var DUR = ${fm.duracao.toFixed(2)};`);
    htmlFrame = htmlFrame.replace(
      /\{\s*duracao:\s*DUR,\s*offsetGlobal:\s*[0-9.]+\s*\}/,
      `{ duracao: DUR, offsetGlobal: ${fm.inicio.toFixed(2)} }`
    );
    fs.writeFileSync(arqFrame, htmlFrame, "utf8");
  }
});

const indexPath = path.join(VIDEO_DIR, "index.html");
if (fs.existsSync(indexPath)) {
  const clipsHtml = timeline.frames
    .map(
      (fm, i) =>
        `    <div id="clip-f${i + 1}" class="clip"\n         data-composition-src="${fm.arquivo}"\n         data-composition-id="${fm.id}"\n         data-start="${fm.inicio.toFixed(2)}" data-duration="${fm.duracao.toFixed(2)}" data-track-index="1"></div>`
    )
    .join("\n\n");

  // Se o master -14 LUFS (com loudnorm + limiter) existe, ele é a ÚNICA faixa de áudio:
  // reproduzir voz + camada ducked separadas entrega o mix pré-master (~5,5 dB abaixo).
  const masterMixRel = "assets/bgm/master_mix_14lufs.wav";
  const temMasterMix = fs.existsSync(path.join(VIDEO_DIR, masterMixRel));

  const audiosHtml = temMasterMix
    ? `    <audio id="audio-master" src="${masterMixRel}" data-start="0" data-duration="${timeline.total.toFixed(2)}" data-track-index="2" data-volume="1.0"></audio>`
    : timeline.frames
        .map(
          (fm, i) =>
            `    <audio id="audio-f${i + 1}" src="${fm.audioSrc}" data-start="${fm.inicio.toFixed(2)}" data-duration="${fm.duracao.toFixed(2)}" data-track-index="2"></audio>`
        )
        .join("\n");

  const cortes = timeline.frames.slice(1).map((fm) => Number(fm.inicio.toFixed(2)));
  const totalStr = timeline.total.toFixed(2);

  // Mapa compacto de palavras faladas para Lip-Sync automático do mascote 3D
  const speechTimeline = [];
  timeline.frases.forEach((fr) => {
    (fr.palavras || []).forEach((w) => {
      const txt = w.texto || "";
      const silabas = Math.max(1, Math.min(5, (txt.match(/[aeiouáéíóúâêôãõàü]+/gi) || [1]).length));
      const abertura = /[aáàâãeééoóò]/i.test(txt) ? 1.15 : 0.88;
      speechTimeline.push({
        s: Number(w.inicio.toFixed(3)),
        e: Number(w.fim.toFixed(3)),
        sil: silabas,
        ab: abertura,
      });
    });
  });
  const estiloGrafico = roteiro.estiloGrafico || "padrao";
  // modo "2d": vídeo 100% vetorial (SVG + GSAP) via Motor2D, sem carregar Three.js/Motor3D.
  const modo2d = roteiro.modo === "2d";
  const scriptsMotor = modo2d
    ? `<script src="assets/vendor/motor2d.global.js"></script>`
    : `<script src="assets/vendor/three.min.js"></script>\n  <script src="assets/vendor/motor3d.global.js"></script>`;

  const novoIndexHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, height=1920">
  <title>Motor 2.0 — ${roteiro.titulo}</title>
  <script>
    window.__MOTOR_ESTILO_GRAFICO__ = ${JSON.stringify(estiloGrafico)};
    window.__SPEECH_TIMELINE__ = ${JSON.stringify(speechTimeline)};
  </script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  ${scriptsMotor}
  <style>
    @font-face {
      font-family: 'EB Garamond';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('./assets/fonts/EBGaramond-400.woff2') format('woff2');
    }
    @font-face {
      font-family: 'EB Garamond';
      font-style: normal;
      font-weight: 700;
      font-display: swap;
      src: url('./assets/fonts/EBGaramond-700.woff2') format('woff2');
    }
    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('./assets/fonts/Inter-400.woff2') format('woff2');
    }
    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: 700;
      font-display: swap;
      src: url('./assets/fonts/Inter-700.woff2') format('woff2');
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      width: 1080px;
      height: 1920px;
      overflow: hidden;
      background-color: #030914;
      font-family: 'Inter', sans-serif;
      color: #f8fafc;
      -webkit-font-smoothing: antialiased;
    }

    #root {
      position: relative;
      width: 1080px;
      height: 1920px;
      overflow: hidden;
      background-color: #030914;
    }

    .clip {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    #clip-captions {
      z-index: 40;
      pointer-events: none;
    }

    #trans-flash {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.35), rgba(3, 9, 20, 0.95));
      opacity: 0;
      pointer-events: none;
      z-index: 50;
    }
  </style>
</head>
<body>
  <div id="root" data-composition-id="main" data-width="1080" data-height="1920" data-start="0" data-duration="${totalStr}">

    <!-- Track 1: Visual 3D + 2D Frames -->
${clipsHtml}

    <!-- Track 2: ${temMasterMix ? "MASTER MIX (-14 LUFS: voz + SFX + BGM com ducking)" : "Per-Frame ElevenLabs Voice Audio"} -->
${audiosHtml}
${temMasterMix ? "" : `
    <!-- Track 3: Sidechain-Ducked BGM + SFX Bed (-14 LUFS Balance) -->
    <audio id="audio-bgm" src="assets/bgm/master_ducked_bgm.wav" data-start="0" data-duration="${totalStr}" data-track-index="3" data-volume="1.0"></audio>
`}
    <!-- Track 4: Word-Level Karaoke Captions -->
    <div id="clip-captions" class="clip"
         data-composition-src="compositions/captions.html"
         data-composition-id="captions"
         data-track-kind="captions"
         data-start="0" data-duration="${totalStr}" data-track-index="4"></div>

    <!-- Optical Transition Flash Layer -->
    <div id="trans-flash"></div>
  </div>

  <script>
    window.__timelines = window.__timelines || {};
    var tl = gsap.timeline({ paused: true });

    var cuts = ${JSON.stringify(cortes)};
    cuts.forEach(function (t) {
      tl.set('#trans-flash', { opacity: 0 }, t - 0.14);
      tl.to('#trans-flash', { opacity: 0.72, duration: 0.12, ease: 'power2.in' }, t - 0.12);
      tl.to('#trans-flash', { opacity: 0, duration: 0.22, ease: 'power2.out' }, t);
    });

    tl.set('#trans-flash', { opacity: 0 }, ${totalStr});
    window.__timelines['main'] = tl;
  </script>
</body>
</html>
`;
  fs.writeFileSync(indexPath, novoIndexHtml, "utf8");
}

// 4. Gera STORYBOARD.md
let md = `# STORYBOARD — ${roteiro.titulo} (\`${roteiro.id}\`)

> **Subtítulo:** ${roteiro.subtitulo || "-"}  
> **Resolução:** ${roteiro.resolucao?.largura || 1080}x${roteiro.resolucao?.altura || 1920} (${roteiro.fps || 30} FPS)  
> **Duração Total:** \`${timeline.total.toFixed(2)}s\`  
> **Voz & Ritmo:** ElevenLabs (\`${roteiro.voz?.id || "padrão"}\`) acelerada em \`${timeline.fatorAceleracaoVoz}x\` (~190 PPM) + Masterização \`-14 LUFS\` com Sidechain Ducking.

---

## Mapa de Cenas (Frames Híbridos 3D + 2D)

| # | Frame ID | Arquivo | Início | Duração | Fim | Métrica HUD |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`;

timeline.frames.forEach((fm) => {
  md += `| **${fm.numero}** | \`${fm.id}\` | \`${fm.arquivo}\` | \`${fm.inicio.toFixed(2)}s\` | \`${fm.duracao.toFixed(2)}s\` | \`${fm.fim.toFixed(2)}s\` | **${fm.metrica?.valor || "-"}** (${fm.metrica?.rotulo || "-"}) |\n`;
});

md += `\n---\n\n## Detalhamento por Frame\n\n`;

timeline.frames.forEach((fm, idx) => {
  const def = roteiro.frames[idx] || {};
  md += `### Frame ${fm.numero} — ${fm.titulo} (\`${fm.inicio.toFixed(2)}s\` → \`${fm.fim.toFixed(2)}s\`)\n\n`;
  md += `- **Kicker Editorial:** \`${fm.kicker || "-"}\`\n`;
  md += `- **Direção 3D (Three.js):** ${def.direcao3D || "-"}\n`;
  md += `- **Direção 2D (HyperFrames HTML/GSAP):** ${def.direcao2D || "-"}\n`;
  md += `- **Áudio do Frame:** \`${fm.audioSrc}\`\n`;
  md += `- **Narração Alinhada:**\n`;
  fm.frases.forEach((fr) => {
    md += `  - **[${fr.inicio.toFixed(2)}s – ${fr.fim.toFixed(2)}s | local ${fr.inicioLocal.toFixed(2)}s – ${fr.fimLocal.toFixed(2)}s]** (${fr.plano}${fr.jogo ? ` / ${fr.jogo}` : ""}): *"${fr.marcado}"*\n`;
  });
  md += `\n`;
});

fs.writeFileSync(path.join(VIDEO_DIR, "STORYBOARD.md"), md, "utf8");
console.log(
  `[storyboard] Sincronizado ${path.relative(ROOT, VIDEO_DIR)}: STORYBOARD.md, index.html, frames/*.html e captions.html (${timeline.total.toFixed(2)}s).`
);
