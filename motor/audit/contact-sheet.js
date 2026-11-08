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
import { SEVERIDADE_PESO, zonasDoPerfil } from "./heuristics.js";
import { obterPerfil } from "../formato.js";

/** Geometria dos quadros nas pranchas: respeita a proporção do formato (sem achatar o 16:9). */
export function geometriaPranchas(perfil, quantidadeCenas) {
  const n = Math.max(1, quantidadeCenas);
  if (perfil.largura > perfil.altura) {
    const colunas = Math.min(3, n);
    return {
      humana: { tileWidth: 640, tileHeight: 360, columns: colunas },
      vlm: { tileWidth: 480, tileHeight: 270, columns: colunas },
    };
  }
  return {
    humana: { tileWidth: 360, tileHeight: 640, columns: Math.min(4, n) },
    vlm: { tileWidth: 360, tileHeight: 640, columns: colunasPara(n) },
  };
}

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

/** Divide uma lista em lotes de até `tamanho` itens, preservando a ordem. */
export function dividirEmLotes(lista, tamanho) {
  const n = Math.max(1, Math.floor(tamanho) || 1);
  const lotes = [];
  for (let i = 0; i < lista.length; i += n) lotes.push(lista.slice(i, i + n));
  return lotes.length ? lotes : [[]];
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
export async function gerarPranchas(tier1, { dirSaida, titulo = "Auditoria Visual", preferencia, perfil, tamanhoLote } = {}) {
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

  const perfilAtivo = perfil || obterPerfil({});
  const zonas = zonasDoPerfil(perfilAtivo);
  const fonte = { largura: perfilAtivo.largura, altura: perfilAtivo.altura };
  const geo = geometriaPranchas(perfilAtivo, cenas.length);
  const humana = path.join(dirSaida, "contact-sheet-anotada.jpg");
  await motor.montarPrancha({
    output: humana,
    title: titulo,
    titleHeight: 54,
    ...geo.humana,
    headerHeight: 56,
    gap: 12,
    sourceWidth: fonte.largura,
    sourceHeight: fonte.altura,
    zones: zonas,
    tiles: tilesHumanos,
    quality: 86,
  });

  // Prancha(s) do VLM: por padrão o curto mantém 1 prancha única; o horizontal divide em lotes de 8 cenas.
  const porLote = tamanhoLote || (perfilAtivo.largura > perfilAtivo.altura ? 8 : Math.max(1, cenas.length));
  const lotesCenas = dividirEmLotes(cenas, porLote);
  const lotesVlm = [];
  for (let l = 0; l < lotesCenas.length; l++) {
    const grupo = lotesCenas[l];
    const geoLote = geometriaPranchas(perfilAtivo, grupo.length);
    const arquivo = path.join(dirSaida, lotesCenas.length === 1 ? "vlm-sheet.jpg" : `vlm-sheet-${String(l + 1).padStart(2, "0")}.jpg`);
    const deslocamento = l * porLote;
    await motor.montarPrancha({
      output: arquivo,
      titleHeight: 0,
      ...geoLote.vlm,
      headerHeight: 34,
      gap: 8,
      zones: [],
      tiles: grupo.map((cena, i) => ({
        path: amostraRepresentativa(cena).caminho,
        label: `#${deslocamento + i + 1}  ${amostraRepresentativa(cena).tempo.toFixed(1)}s`,
        sublabel: "",
        statusColor: "#64748b",
      })),
      quality: 88,
    });
    lotesVlm.push({
      caminho: arquivo,
      mapa: grupo.map((cena, i) => ({ indice: deslocamento + i + 1, cena: cena.id, tempo: amostraRepresentativa(cena).tempo })),
    });
  }

  const vlm = lotesVlm[0].caminho;
  const mapaVlm = lotesVlm.flatMap((x) => x.mapa);
  return { humana, vlm, mapaVlm, lotesVlm };
}
