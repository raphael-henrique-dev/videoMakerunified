// motor/2d/cenas/index.js — Registro das cenas 2D data-driven (frame.cena = { tipo, dados })
import * as capituloTitulo from "./capitulo-titulo.js";
import * as listaAnimada from "./lista-animada.js";
import * as comparacaoAb from "./comparacao-ab.js";
import * as graficoLinha from "./grafico-linha.js";
import * as graficoBarra from "./grafico-barra.js";
import * as linhaDoTempo from "./linha-do-tempo.js";
import * as numeroGrande from "./numero-grande.js";
import * as diagramaFluxo from "./diagrama-fluxo.js";
import * as mascoteExplica from "./mascote-explica.js";
import { fundoAnimado } from "./util.js";

export const CENAS = {
  "capitulo-titulo": capituloTitulo,
  "lista-animada": listaAnimada,
  "comparacao-ab": comparacaoAb,
  "grafico-linha": graficoLinha,
  "grafico-barra": graficoBarra,
  "linha-do-tempo": linhaDoTempo,
  "numero-grande": numeroGrande,
  "diagrama-fluxo": diagramaFluxo,
  "mascote-explica": mascoteExplica,
};

export function listarTiposCena() {
  return Object.keys(CENAS);
}

/** Valida `frame.cena`; devolve lista de mensagens de erro (vazia = ok). */
export function validarCena(cena) {
  if (!cena || typeof cena !== "object") return ["'cena' deve ser um objeto { tipo, dados }."];
  const mod = CENAS[cena.tipo];
  if (!mod) return [`Tipo de cena desconhecido: '${cena.tipo}'. Use: ${listarTiposCena().join(", ")}.`];
  return mod.validar(cena.dados || {});
}

/** Desenha a cena no instante local `t`: função pura (mesma entrada → mesma saída). */
export function desenharCena(tipo, dados, perfil, t, duracao, ctx = {}) {
  const mod = CENAS[tipo];
  if (!mod) throw new Error(`Tipo de cena desconhecido: '${tipo}'.`);
  const html = mod.desenhar(dados || {}, perfil, t, duracao, ctx);
  // Injeta o fundo animado como primeira camada da moldura (atrás do conteúdo).
  const corte = html.indexOf(">");
  if (corte === -1) return html;
  return html.slice(0, corte + 1) + fundoAnimado(perfil, t) + html.slice(corte + 1);
}

export function cenaUsaMascote(tipo) {
  return Boolean(CENAS[tipo]?.usaMascote);
}
