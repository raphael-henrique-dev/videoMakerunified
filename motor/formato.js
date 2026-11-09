// motor/formato.js — Fonte única de verdade dos formatos de vídeo do Motor 2.0
//
// Cada perfil descreve dimensões, legenda, câmera 3D e a geometria usada pela auditoria visual.
// Convenções:
//   - `zonasProibidas` (curto): retângulos cobertos pela interface dos apps (conteúdo NÃO deve ficar neles).
//   - `areaSegura` (horizontal): retângulos onde o conteúdo PODE ficar; o que sobra nas bordas é margem
//     proibida. A auditoria deriva as faixas de margem a partir deles (ver motor/audit/heuristics.js).
//   - `analise`: resolução em que o Tier 1 decodifica os quadros (1/4 da resolução do vídeo).
//
// Os conjuntos de `tiposCena` e `transicoes` listam apenas o que está IMPLEMENTADO hoje.

const PERFIS = {
  curto: Object.freeze({
    id: "curto",
    largura: 1080,
    altura: 1920,
    fps: 30,
    analise: { largura: 270, altura: 480 },
    zonasProibidas: {
      topo: { x: 0, y: 0, largura: 1080, altura: 160 },
      rodape: { x: 0, y: 1540, largura: 1080, altura: 380 },
      lateral: { x: 940, y: 800, largura: 140, altura: 800 },
    },
    miolo: { x: 60, y: 200, largura: 860, altura: 1320 },
    legenda: { posicao: "top: 1350px", larguraMaxima: 940, tamanho: 38 },
    render: { quality: "looks", crf: 16, fps: 30 },
    camera: { fov: 42, z: 6.2 },
    transicoes: ["flash"],
    tiposCena: ["arquivo"],
  }),
  horizontal: Object.freeze({
    id: "horizontal",
    largura: 1920,
    altura: 1080,
    fps: 30,
    analise: { largura: 480, altura: 270 },
    areaSegura: {
      // ~5% de margem para ação e ~10% para títulos (padrão de overscan de TV)
      acao: { x: 96, y: 54, largura: 1728, altura: 972 },
      titulo: { x: 192, y: 108, largura: 1536, altura: 864 },
    },
    miolo: { x: 192, y: 108, largura: 1536, altura: 864 },
    legenda: { posicao: "bottom: 54px", larguraMaxima: 1500, tamanho: 48 },
    // z provisório: ainda não validado por snapshot em 16:9 (FOV vertical fixo de 42°).
    render: { quality: "looks", crf: 16, fps: 30, resolucao4k: "landscape-4k" },
    camera: { fov: 42, z: 8.2 },
    transicoes: ["flash"],
    tiposCena: ["arquivo"],
  }),
};

export function normalizarFormato(valor) {
  if (!valor) return "curto";
  const formato = String(valor).toLowerCase().trim();
  if (formato === "longo") return "horizontal";
  if (!PERFIS[formato]) throw new Error(`Formato inválido: "${valor}". Use curto ou horizontal.`);
  return formato;
}

export function obterPerfil(roteiro = {}) {
  const id = normalizarFormato(roteiro.formato);
  return PERFIS[id];
}

export function validarFormato(roteiro = {}) {
  const erros = [];
  try {
    const perfil = obterPerfil(roteiro);
    if (roteiro.fps !== undefined && roteiro.fps !== perfil.fps) erros.push(`FPS incompatível com o formato ${perfil.id}.`);
    if (roteiro.resolucao) {
      if (roteiro.resolucao.largura !== perfil.largura || roteiro.resolucao.altura !== perfil.altura) {
        erros.push(`Resolução incompatível com o formato ${perfil.id}: esperado ${perfil.largura}x${perfil.altura}.`);
      }
    }
  } catch (err) {
    erros.push(err.message);
  }
  return { valido: erros.length === 0, erros };
}

export function achatarRoteiro(roteiro = {}) {
  if (!Array.isArray(roteiro.capitulos) || roteiro.capitulos.length === 0) return roteiro;
  const frames = [];
  roteiro.capitulos.forEach((capitulo) => {
    (capitulo.frames || []).forEach((frame) => {
      frames.push({ ...frame, capituloId: capitulo.id });
    });
  });
  return { ...roteiro, frames };
}

export function listarPerfis() {
  return Object.values(PERFIS);
}
