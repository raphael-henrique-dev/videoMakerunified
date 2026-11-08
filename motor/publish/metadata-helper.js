// motor/publish/metadata-helper.js — Gerador e Formatador de Metadados de Publicação (YouTube + TikTok)
import fs from "node:fs";
import path from "node:path";
import { obterPerfil, achatarRoteiro } from "../formato.js";

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
    capitulos = (timeline.frames || []).map((frame) => ({
      tempo: frame.inicio,
      titulo: frame.titulo || frame.id,
    })).filter((capitulo, i, todos) => i === 0 || capitulo.tempo - todos[i - 1].tempo >= 10);
    if (capitulos.length < 3 && Array.isArray(timeline.frames) && timeline.frames.length >= 3) {
      capitulos = timeline.frames.slice(0, 3).map((frame) => ({ tempo: frame.inicio, titulo: frame.titulo || frame.id }));
    }
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
