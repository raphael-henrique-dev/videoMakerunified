// motor/audit/contact-sheet.js — Pranchas de contato da auditoria visual
//
// Gera duas imagens a partir do resultado do Tier 1:
//   1. contact-sheet-anotada.jpg — para humanos: quadro representativo de cada cena com as
//      zonas de risco 9:16 sobrepostas (realçadas quando violadas) e badge de status.
//   2. vlm-sheet.jpg — para o crítico VLM: os mesmos quadros, limpos (sem máscara colorida,
//      que poderia distorcer a avaliação de cor/luz), numa grade quase quadrada — formato que
//      funciona bem em todos os provedores (Llama Vision redimensiona para ~1120px).

import path from "node:path";
import { obterMotorImagem } from "./engine.js";
import { ZONAS_SEGURANCA, SEVERIDADE_PESO, obterZonasSeguranca } from "./heuristics.js";

export const CORES_STATUS = { ok: "#22c55e", alerta: "#f59e0b", critico: "#ef4444" };

/** Classifica uma lista de alertas em ok / alerta / critico. */
export function statusDeAlertas(alertas = []) {
  if (alertas.some((a) => a.severidade === "critico")) return "critico";
  if (alertas.some((a) => SEVERIDADE_PESO[a.severidade] > 0)) return "alerta";
  return "ok";
}

/** Escolhe a amostra central de cada cena (a mais representativa da composição). */
export function amostraRepresentativa(cena) {
  return cena.amostras[Math.floor(cena.amostras.length / 2)];
}

function resumoAlertas(alertas) {
  if (!alertas.length) return "OK";
  const ordenados = [...alertas].sort((a, b) => SEVERIDADE_PESO[b.severidade] - SEVERIDADE_PESO[a.severidade]);
  const rotulo = (a) => (a.zona ? `${a.codigo.replace("SAFE_ZONE_VIOLATION", "ZONA")}:${a.zona}` : a.codigo);
  const txt = ordenados.slice(0, 2).map(rotulo).join(" · ");
  return ordenados.length > 2 ? `${txt} +${ordenados.length - 2}` : txt;
}

function colunasPara(n) {
  if (n <= 3) return Math.max(1, n);
  if (n <= 6) return 3;
  return 4;
}

/**
 * @param {{cenas: Array}} tier1 resultado de executarHeuristicas()
 * @param {{dirSaida: string, titulo?: string, preferencia?: string}} opcoes
 * @returns {Promise<{humana: string, vlm: string, mapaVlm: Array<{indice:number, cena:string, tempo:number}>}>}
 */
export async function gerarPranchas(tier1, { dirSaida, titulo = "Auditoria Visual", preferencia, perfil } = {}) {
  const motor = await obterMotorImagem({ preferencia });
  const cenas = tier1.cenas;

  const tilesHumanos = cenas.map((cena, i) => {
    const amostra = amostraRepresentativa(cena);
    const status = statusDeAlertas(cena.alertas);
    return {
      path: amostra.caminho,
      label: `${String(i + 1).padStart(2, "0")} · ${cena.id} · ${amostra.tempo.toFixed(2)}s`,
      sublabel: resumoAlertas(cena.alertas),
      statusColor: CORES_STATUS[status],
      violatedZones: [...new Set(cena.alertas.filter((a) => a.zona).map((a) => a.zona))],
    };
  });

  const zonas = perfil ? obterZonasSeguranca({ formato: perfil.id }) : ZONAS_SEGURANCA;
  const fonte = perfil ? { largura: perfil.largura, altura: perfil.altura } : { largura: 1080, altura: 1920 };
  const humana = path.join(dirSaida, "contact-sheet-anotada.jpg");
  await motor.montarPrancha({
    output: humana,
    title: titulo,
    titleHeight: 54,
    tileWidth: 360,
    tileHeight: 640,
    headerHeight: 56,
    columns: Math.min(4, Math.max(1, cenas.length)),
    gap: 12,
    sourceWidth: fonte.largura,
    sourceHeight: fonte.altura,
    zones: zonas,
    tiles: tilesHumanos,
    quality: 86,
  });

  const mapaVlm = cenas.map((cena, i) => ({ indice: i + 1, cena: cena.id, tempo: amostraRepresentativa(cena).tempo }));
  const vlm = path.join(dirSaida, "vlm-sheet.jpg");
  await motor.montarPrancha({
    output: vlm,
    titleHeight: 0,
    tileWidth: 360,
    tileHeight: 640,
    headerHeight: 34,
    columns: colunasPara(cenas.length),
    gap: 8,
    zones: [],
    tiles: cenas.map((cena, i) => ({
      path: amostraRepresentativa(cena).caminho,
      label: `#${i + 1}  ${amostraRepresentativa(cena).tempo.toFixed(1)}s`,
      sublabel: "",
      statusColor: "#64748b",
    })),
    quality: 88,
  });

  return { humana, vlm, mapaVlm };
}
