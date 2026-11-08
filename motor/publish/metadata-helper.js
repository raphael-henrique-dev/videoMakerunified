// motor/publish/metadata-helper.js — Gerador e Formatador de Metadados de Publicação (YouTube + TikTok)
import fs from "node:fs";
import path from "node:path";
import { obterPerfil, achatarRoteiro } from "../formato.js";

const MIN_CAPITULO_S = 10;

/**
 * Capítulos do YouTube: precisa de >= 3, o primeiro em 0:00 e cada um com >= 10s.
 * Com `roteiro.capitulos`, usa os títulos dos capítulos (via `capituloId` dos frames); senão, um por frame.
 * Retorna [] quando as regras não podem ser cumpridas (o YouTube ignora a lista inválida).
 */
export function calcularCapitulos(framesTimeline, capitulosRoteiro, duracaoTotal) {
  if (!framesTimeline.length) return [];
  const titulos = new Map((capitulosRoteiro || []).map((c) => [c.id, c.titulo || c.id]));
  let candidatos = framesTimeline.map((f) => ({
    tempo: f.inicio,
    fim: f.fim ?? f.inicio + (f.duracao || 0),
    chave: f.capituloId ?? f.id,
    titulo: (f.capituloId && titulos.get(f.capituloId)) || f.titulo || f.id,
  }));
  if (titulos.size) {
    candidatos = candidatos.filter((c, i, todos) => i === 0 || c.chave !== todos[i - 1].chave);
  }
  const fimVideo = duracaoTotal ?? framesTimeline[framesTimeline.length - 1].fim ?? 0;
  const mantidos = [];
  for (const c of candidatos) {
    if (!mantidos.length) {
      mantidos.push({ tempo: 0, titulo: c.titulo });
    } else if (c.tempo - mantidos[mantidos.length - 1].tempo >= MIN_CAPITULO_S) {
      mantidos.push({ tempo: c.tempo, titulo: c.titulo });
    }
  }
  // O último capítulo também precisa ter >= 10s até o fim do vídeo
  while (mantidos.length && fimVideo && fimVideo - mantidos[mantidos.length - 1].tempo < MIN_CAPITULO_S) mantidos.pop();
  return mantidos.length >= 3 ? mantidos : [];
}

/**
 * Prepara metadados formatados para YouTube Shorts e TikTok a partir do roteiro.json.
 * @param {string} videoDir - Caminho da pasta do vídeo (ex: videos/por-que-a-bateria-despenca)
 * @returns {object} Metadados estruturados
 */
export function prepararMetadados(videoDir) {
  const roteiroPath = path.join(videoDir, "roteiro.json");
  if (!fs.existsSync(roteiroPath)) {
    throw new Error(`Arquivo roteiro.json não encontrado em: ${videoDir}`);
  }

  const roteiro = JSON.parse(fs.readFileSync(roteiroPath, "utf8"));
  const perfil = obterPerfil(roteiro);
  const roteiroPlano = achatarRoteiro(roteiro);
  const pub = roteiro.publicacao || {};
  const horizontal = perfil.id === "horizontal";

  // 1. Título do YouTube Shorts (máx. 100 caracteres)
  let tituloYt = pub.titulo || `${roteiro.tema || roteiro.titulo || "Vídeo Curioso"}${horizontal ? "" : " #shorts"}`;
  if (horizontal) tituloYt = tituloYt.replace(/\s*#shorts\b/gi, "").trim();
  if (tituloYt.length > 100) {
    tituloYt = tituloYt.slice(0, 96).trim() + "...";
  }

  // 2. Descrição do YouTube
  let resumoCenas = "";
  if (Array.isArray(roteiro.frames)) {
    const pontos = roteiro.frames
      .slice(0, 4)
      .map((f, i) => `• ${f.titulo || f.id || `Ponto ${i + 1}`}`)
      .join("\n");
    if (pontos) {
      resumoCenas = `Neste vídeo:\n${pontos}\n\n`;
    }
  }

  let capitulos = [];
  const timelinePath = path.join(videoDir, "timeline.json");
  if (horizontal && fs.existsSync(timelinePath)) {
    const timeline = JSON.parse(fs.readFileSync(timelinePath, "utf8"));
    capitulos = calcularCapitulos(timeline.frames || [], roteiro.capitulos, timeline.total ?? timeline.duracaoTotal);
  }
  const linhasCapitulos = capitulos.map((c) => {
    const total = Math.max(0, Math.floor(c.tempo));
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")} ${c.titulo}`;
  }).join("\n");
  const descricaoPadrao = `${roteiro.tema || roteiro.titulo}\n\n${horizontal && linhasCapitulos ? `Capítulos:\n${linhasCapitulos}\n\n` : resumoCenas}Por fora, parece simples. Por dentro, o mundo é mais curioso do que parece!\n\n🔔 Se você é curioso, inscreva-se no canal para não perder os próximos vídeos!\n\n${horizontal ? "#curiosidades #ciencia #engenharia #tecnologia #curiorisando" : "#shorts #curiosidades #ciencia #engenharia #tecnologia #curiorisando"}`;
  const descricaoYt = pub.descricao || descricaoPadrao;

  // 3. Tags do YouTube
  const tagsPadrao = [
    ...(horizontal ? [] : ["shorts"]),
    "curiosidades",
    "ciência",
    "tecnologia",
    "engenharia",
    "fatos curiosos",
    "você sabia",
    "curiorisando",
  ];
  const tagsYt = Array.isArray(pub.tags) && pub.tags.length > 0 ? pub.tags : tagsPadrao;

  // 4. Caption / Legenda do TikTok (limite 2200 caracteres)
  const temaLimpo = (roteiro.tema || roteiro.titulo || "Curiosidade").replace(/#/g, "");
  const tiktokCaption =
    pub.tiktok_caption ||
    `${temaLimpo} 🤯 Você sabia que funciona assim?\n\nConta aí nos comentários se já aconteceu com você! 👇\n\n#curiosidades #cienciatododia #engenharia #vocesabia ${horizontal ? "" : "#shorts "}#foryou #fyp #curiorisando`;

  return {
    slug: path.basename(videoDir),
    formato: perfil.id,
    capitulos,
    tema: roteiro.tema || roteiro.titulo,
    youtube: {
      titulo: tituloYt,
      descricao: descricaoYt,
      tags: tagsYt,
      categoryId: pub.youtube_category_id || "28", // 28 = Science & Technology
      formato: perfil.id,
    },
    tiktok: {
      caption: tiktokCaption.slice(0, 2200),
      privacy_level: pub.tiktok_privacy || "SELF_ONLY",
      allow_comments: pub.allow_comments !== false,
      allow_duet: pub.allow_duet !== false,
      allow_stitch: pub.allow_stitch !== false,
    },
  };
}
