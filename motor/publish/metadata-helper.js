// motor/publish/metadata-helper.js — Gerador e Formatador de Metadados de Publicação (YouTube + TikTok)
import fs from "node:fs";
import path from "node:path";

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
  const pub = roteiro.publicacao || {};

  // 1. Título do YouTube Shorts (máx. 100 caracteres)
  let tituloYt = pub.titulo || `${roteiro.tema || roteiro.titulo || "Vídeo Curioso"} #shorts`;
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

  const descricaoPadrao = `${roteiro.tema || roteiro.titulo}\n\n${resumoCenas}Gostou do conteúdo? Inscreva-se no canal para não perder os próximos vídeos!\n\n#shorts #curiosidades #ciencia #engenharia #tecnologia`;
  const descricaoYt = pub.descricao || descricaoPadrao;

  // 3. Tags do YouTube
  const tagsPadrao = [
    "shorts",
    "curiosidades",
    "ciência",
    "tecnologia",
    "engenharia",
    "fatos curiosos",
    "você sabia",
  ];
  const tagsYt = Array.isArray(pub.tags) && pub.tags.length > 0 ? pub.tags : tagsPadrao;

  // 4. Caption / Legenda do TikTok (limite 2200 caracteres)
  const temaLimpo = (roteiro.tema || roteiro.titulo || "Curiosidade").replace(/#/g, "");
  const tiktokCaption =
    pub.tiktok_caption ||
    `${temaLimpo} 🤯 Você sabia que funciona assim?\n\nConta aí nos comentários! 👇\n\n#curiosidades #cienciatododia #engenharia #vocesabia #shorts #foryou #fyp`;

  return {
    slug: path.basename(videoDir),
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
