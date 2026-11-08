// motor/formato.js — Fonte única de verdade dos formatos de vídeo do Motor 2.0

const PERFIS = {
  curto: Object.freeze({
    id: "curto",
    largura: 1080,
    altura: 1920,
    fps: 30,
    safeZones: {
      topo: { x: 0, y: 0, largura: 1080, altura: 160 },
      rodape: { x: 0, y: 1540, largura: 1080, altura: 380 },
      lateral: { x: 940, y: 800, largura: 140, altura: 800 },
    },
    legenda: { posicao: "top: 1350px", larguraMaxima: 940, tamanho: 38, linhas: 3 },
    camera: { fov: 42, z: 6.2 },
    transicoes: ["flash"],
    tiposCena: ["arquivo"],
    flagsRender: { resolution: "portrait", fps: 30 },
  }),
  horizontal: Object.freeze({
    id: "horizontal",
    largura: 1920,
    altura: 1080,
    fps: 30,
    safeZones: {
      titulo: { x: 192, y: 108, largura: 1536, altura: 864 },
      acao: { x: 96, y: 54, largura: 1728, altura: 972 },
    },
    legenda: { posicao: "bottom: 54px", larguraMaxima: 1500, tamanho: 48, linhas: 2 },
    camera: { fov: 42, z: 8.2 },
    transicoes: ["flash", "fade", "wipe", "push", "zoom"],
    tiposCena: [
      "arquivo",
      "capitulo-titulo",
      "lista-animada",
      "comparacao-ab",
      "grafico-linha",
      "grafico-barra",
      "linha-do-tempo",
      "numero-grande",
      "diagrama-fluxo",
      "mascote-explica",
    ],
    flagsRender: { resolution: "landscape", fps: 30 },
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
