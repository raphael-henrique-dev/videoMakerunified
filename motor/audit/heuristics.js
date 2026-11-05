// motor/audit/heuristics.js — Tier 1: Visão Computacional Determinística (0 tokens, offline)
//
// Todas as métricas operam sobre buffers RGB crus reduzidos (padrão 270x480 = 1/4 de 1080x1920),
// produzidos por qualquer motor de motor/audit/engine.js (sharp ou Python/PIL).
//
// Detecções:
//   BLANK_SCREEN         quadro praticamente uniforme (sem conteúdo visível)
//   BLACKOUT             quadro quase todo preto (cena sem luz / WebGL não renderizou)
//   UNDEREXPOSED         cena escura demais para leitura em celular
//   OVEREXPOSED          cena estourada / lavada
//   LOW_CONTRAST         pouca variação tonal (tudo "cinza")
//   ANIMATION_FREEZE     todas as amostras de uma cena são idênticas (animação travou)
//   SAFE_ZONE_VIOLATION  conteúdo de alto detalhe (texto/UI) nas zonas cobertas pela interface
//                        do TikTok / YouTube Shorts / Reels

import { obterMotorImagem } from "./engine.js";

export const RESOLUCAO_ANALISE = { largura: 270, altura: 480 };
export const RESOLUCAO_FONTE = { largura: 1080, altura: 1920 };

/**
 * Zonas de risco 9:16 (coordenadas em 1080x1920). Ficam cobertas pela UI das plataformas.
 * - topo: abas "Seguindo | Para você" (TikTok), busca/câmera (Shorts)
 * - rodape: @usuário, descrição, som/música, barra de progresso
 * - lateral: coluna de curtir / comentar / salvar / compartilhar
 *
 * `limiarMedio` / `limiarAlto` = fração de pixels de borda forte (texto/UI) na zona.
 * Calibrados em 30 quadros reais do canal (3D e 2D): o rodapé separa bem (3D ≈ 0, HUD 2D ≈ 0,09+);
 * topo e lateral sofrem ruído de geometria 3D/kicker, então têm limiares mais altos e
 * severidade máxima limitada — a palavra final semântica fica com o VLM (Tier 2).
 */
export const ZONAS_SEGURANCA = [
  { id: "topo", nome: "Topo (abas/busca)", x: 0, y: 0, w: 1080, h: 160, color: "#f59e0b", limiarMedio: 0.05, limiarAlto: 1.01, severidadeMax: "medio" },
  { id: "rodape", nome: "Rodapé (@/descrição/som)", x: 0, y: 1540, w: 1080, h: 380, color: "#ef4444", limiarMedio: 0.03, limiarAlto: 0.06 },
  { id: "lateral", nome: "Lateral direita (ações)", x: 940, y: 800, w: 140, h: 800, color: "#a855f7", limiarMedio: 0.06, limiarAlto: 0.1 },
];

export const LIMIARES = {
  blankDesvio: 4, // desvio-padrão de luminância abaixo disso = quadro uniforme
  blackoutMedia: 8, // média de luminância (0-255)
  blackoutFracEscura: 0.97, // fração de pixels < 16
  subexpostoMedia: 16, // o canal usa tema escuro (média típica 17-35): só acusa abaixo disso…
  subexpostoP95: 60, // …e se nem os destaques (p95) passam deste valor
  superexpostoMedia: 235,
  superexpostoFracClara: 0.4, // fração de pixels >= 245
  baixoContrasteDesvio: 12,
  freezeDiff: 0.35, // diferença média absoluta (0-255) entre amostras da mesma cena
  movimentoBaixoDiff: 1.0,
  bordaLimiar: 100, // |laplaciano| acima disso = borda forte (texto/UI nítidos, ignora sombreado 3D suave)
};

export const SEVERIDADE_PESO = { critico: 4, alto: 1.5, medio: 0.5, info: 0 };

/** Converte RGB cru em luminância Rec.601 (mesma fórmula do PIL "L"). */
export function paraCinza(rgb, largura, altura) {
  const n = largura * altura;
  const cinza = new Uint8Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 3) {
    cinza[i] = (rgb[j] * 299 + rgb[j + 1] * 587 + rgb[j + 2] * 114 + 500) / 1000;
  }
  return cinza;
}

/** Estatísticas globais de luminância. */
export function estatisticasLuminancia(cinza) {
  const hist = new Uint32Array(256);
  let soma = 0;
  for (let i = 0; i < cinza.length; i++) {
    hist[cinza[i]]++;
    soma += cinza[i];
  }
  const n = cinza.length;
  const media = soma / n;
  let somaQuad = 0;
  for (let v = 0; v < 256; v++) somaQuad += hist[v] * (v - media) * (v - media);
  const desvio = Math.sqrt(somaQuad / n);

  const percentil = (p) => {
    const alvo = p * n;
    let acc = 0;
    for (let v = 0; v < 256; v++) {
      acc += hist[v];
      if (acc >= alvo) return v;
    }
    return 255;
  };
  let escuros = 0;
  let claros = 0;
  for (let v = 0; v < 16; v++) escuros += hist[v];
  for (let v = 245; v < 256; v++) claros += hist[v];

  return {
    media: arred(media),
    desvio: arred(desvio),
    p05: percentil(0.05),
    p50: percentil(0.5),
    p95: percentil(0.95),
    fracEscura: arred(escuros / n, 4),
    fracClara: arred(claros / n, 4),
  };
}

/** Mapa |laplaciano 3x3| (kernel 8-vizinhos), bordas zeradas. */
export function mapaBordas(cinza, largura, altura) {
  const out = new Uint8Array(largura * altura);
  for (let y = 1; y < altura - 1; y++) {
    const o = y * largura;
    for (let x = 1; x < largura - 1; x++) {
      const i = o + x;
      const v =
        8 * cinza[i] -
        cinza[i - largura - 1] -
        cinza[i - largura] -
        cinza[i - largura + 1] -
        cinza[i - 1] -
        cinza[i + 1] -
        cinza[i + largura - 1] -
        cinza[i + largura] -
        cinza[i + largura + 1];
      const a = v < 0 ? -v : v;
      out[i] = a > 255 ? 255 : a;
    }
  }
  return out;
}

/** Densidade de bordas fortes dentro de um retângulo (coordenadas da resolução de análise). */
export function densidadeBordas(bordas, largura, altura, ret, limiar = LIMIARES.bordaLimiar) {
  const x0 = Math.max(1, Math.floor(ret.x));
  const y0 = Math.max(1, Math.floor(ret.y));
  const x1 = Math.min(largura - 1, Math.ceil(ret.x + ret.w));
  const y1 = Math.min(altura - 1, Math.ceil(ret.y + ret.h));
  let fortes = 0;
  let total = 0;
  for (let y = y0; y < y1; y++) {
    const o = y * largura;
    for (let x = x0; x < x1; x++) {
      if (bordas[o + x] > limiar) fortes++;
      total++;
    }
  }
  return total ? fortes / total : 0;
}

/** Diferença média absoluta entre dois quadros em cinza. */
export function diferencaMedia(a, b) {
  if (a.length !== b.length) throw new Error("Quadros com tamanhos diferentes.");
  let soma = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    soma += d < 0 ? -d : d;
  }
  return soma / a.length;
}

function arred(v, casas = 2) {
  const f = 10 ** casas;
  return Math.round(v * f) / f;
}

function escalarZona(z, analise = RESOLUCAO_ANALISE, fonte = RESOLUCAO_FONTE) {
  const ex = analise.largura / fonte.largura;
  const ey = analise.altura / fonte.altura;
  return { x: z.x * ex, y: z.y * ey, w: z.w * ex, h: z.h * ey };
}

/**
 * Analisa um único quadro (buffer RGB cru) e devolve métricas + alertas.
 * @returns {{metricas: object, alertas: Array<{codigo:string,severidade:string,mensagem:string,zona?:string}>, zonasVioladas: string[]}}
 */
export function analisarQuadro(rgb, { largura = RESOLUCAO_ANALISE.largura, altura = RESOLUCAO_ANALISE.altura, zonas = ZONAS_SEGURANCA, limiares = LIMIARES } = {}) {
  const cinza = paraCinza(rgb, largura, altura);
  const lum = estatisticasLuminancia(cinza);
  const bordas = mapaBordas(cinza, largura, altura);
  const alertas = [];

  // Área de conteúdo de referência (miolo seguro) para contextualizar as zonas
  const miolo = escalarZona({ x: 60, y: 200, w: 860, h: 1320 }, { largura, altura });
  const densidadeMiolo = densidadeBordas(bordas, largura, altura, miolo, limiares.bordaLimiar);

  const zonasMetricas = {};
  const zonasVioladas = [];
  const vazio = lum.desvio < limiares.blankDesvio;
  for (const z of zonas) {
    const d = densidadeBordas(bordas, largura, altura, escalarZona(z, { largura, altura }), limiares.bordaLimiar);
    zonasMetricas[z.id] = arred(d, 4);
    if (vazio) continue;
    const limAlto = z.limiarAlto ?? 0.06;
    const limMedio = z.limiarMedio ?? 0.03;
    if (d >= limAlto && z.severidadeMax !== "medio") {
      zonasVioladas.push(z.id);
      alertas.push({
        codigo: "SAFE_ZONE_VIOLATION",
        severidade: "alto",
        zona: z.id,
        mensagem: `Conteúdo de alto detalhe (texto/UI) na zona "${z.nome}" — densidade de bordas ${(d * 100).toFixed(1)}%. Será coberto pela interface do app.`,
      });
    } else if (d >= limMedio) {
      zonasVioladas.push(z.id);
      alertas.push({
        codigo: "SAFE_ZONE_VIOLATION",
        severidade: "medio",
        zona: z.id,
        mensagem: `Possível conteúdo na zona "${z.nome}" — densidade de bordas ${(d * 100).toFixed(1)}%. Verifique se nada importante fica sob a UI.`,
      });
    }
  }

  if (vazio) {
    alertas.push({
      codigo: "BLANK_SCREEN",
      severidade: "critico",
      mensagem: `Quadro praticamente uniforme (desvio ${lum.desvio}) — nada visível na tela.`,
    });
  }
  if (lum.media < limiares.blackoutMedia && lum.fracEscura >= limiares.blackoutFracEscura) {
    alertas.push({
      codigo: "BLACKOUT",
      severidade: "critico",
      mensagem: `Tela preta: ${(lum.fracEscura * 100).toFixed(1)}% dos pixels abaixo de 16/255 (média ${lum.media}). Cena sem luz ou WebGL não renderizou.`,
    });
  } else if (!vazio && lum.media < limiares.subexpostoMedia && lum.p95 < limiares.subexpostoP95) {
    alertas.push({
      codigo: "UNDEREXPOSED",
      severidade: "medio",
      mensagem: `Cena escura demais (média ${lum.media}, p95 ${lum.p95}). Aumente a luz ambiente/direcional ou clareie o fundo.`,
    });
  }
  if (lum.media > limiares.superexpostoMedia || lum.fracClara > limiares.superexpostoFracClara) {
    alertas.push({
      codigo: "OVEREXPOSED",
      severidade: "alto",
      mensagem: `Cena estourada (média ${lum.media}, ${(lum.fracClara * 100).toFixed(1)}% dos pixels ≥ 245). Reduza intensidade de luz/bloom.`,
    });
  }
  if (!vazio && lum.desvio < limiares.baixoContrasteDesvio && !alertas.some((a) => a.codigo === "BLACKOUT")) {
    alertas.push({
      codigo: "LOW_CONTRAST",
      severidade: "medio",
      mensagem: `Contraste tonal baixo (desvio ${lum.desvio}). Separe planos com rim light ou cores mais contrastantes.`,
    });
  }

  return {
    metricas: { luminancia: lum, densidadeBordasMiolo: arred(densidadeMiolo, 4), zonas: zonasMetricas },
    alertas,
    zonasVioladas,
    _cinza: cinza,
  };
}

/**
 * Detecta congelamento comparando as amostras de uma mesma cena.
 * @param {Uint8Array[]} cinzas quadros em cinza da cena, em ordem temporal
 */
export function analisarMovimento(cinzas, limiares = LIMIARES) {
  if (cinzas.length < 2) return { diferencas: [], alertas: [] };
  const diferencas = [];
  for (let i = 1; i < cinzas.length; i++) diferencas.push(arred(diferencaMedia(cinzas[i - 1], cinzas[i]), 3));
  const alertas = [];
  const max = Math.max(...diferencas);
  if (max < limiares.freezeDiff) {
    alertas.push({
      codigo: "ANIMATION_FREEZE",
      severidade: "critico",
      mensagem: `Cena congelada: ${cinzas.length} amostras praticamente idênticas (Δ máx ${max}). A timeline/animação provavelmente travou.`,
    });
  } else if (max < limiares.movimentoBaixoDiff) {
    alertas.push({
      codigo: "LOW_MOTION",
      severidade: "medio",
      mensagem: `Pouco movimento na cena (Δ máx ${max}). Considere animar câmera, mascote ou elementos de UI.`,
    });
  }
  return { diferencas, alertas };
}

/**
 * Executa o Tier 1 completo sobre um conjunto de cenas.
 * @param {Array<{id:string, amostras:Array<{caminho:string, tempo:number}>}>} cenas
 * @param {{preferencia?: string}} [opcoes]
 */
export async function executarHeuristicas(cenas, opcoes = {}) {
  const motor = await obterMotorImagem({ preferencia: opcoes.preferencia });
  const { largura, altura } = RESOLUCAO_ANALISE;
  const inicio = Date.now();

  const caminhos = cenas.flatMap((c) => c.amostras.map((a) => a.caminho));
  const buffers = await motor.decodificar(caminhos, largura, altura);

  let k = 0;
  const resultadoCenas = cenas.map((cena) => {
    const amostras = cena.amostras.map((a) => {
      const r = analisarQuadro(buffers[k++], { largura, altura, zonas: opcoes.zonas, limiares: opcoes.limiares });
      return { ...a, metricas: r.metricas, alertas: r.alertas, zonasVioladas: r.zonasVioladas, _cinza: r._cinza };
    });
    const mov = analisarMovimento(amostras.map((a) => a._cinza), opcoes.limiares);
    for (const a of amostras) delete a._cinza;

    const alertas = [...mov.alertas];
    // agrega alertas das amostras sem repetir o mesmo código/zona
    const vistos = new Set(alertas.map((a) => `${a.codigo}:${a.zona ?? ""}`));
    for (const a of amostras) {
      for (const al of a.alertas) {
        const chave = `${al.codigo}:${al.zona ?? ""}`;
        const existente = alertas.find((x) => `${x.codigo}:${x.zona ?? ""}` === chave);
        if (!vistos.has(chave)) {
          vistos.add(chave);
          alertas.push({ ...al, tempos: [a.tempo] });
        } else if (existente) {
          existente.tempos = [...(existente.tempos ?? []), a.tempo];
          if (SEVERIDADE_PESO[al.severidade] > SEVERIDADE_PESO[existente.severidade]) {
            existente.severidade = al.severidade;
            existente.mensagem = al.mensagem;
          }
        }
      }
    }
    return { id: cena.id, amostras, diferencasMovimento: mov.diferencas, alertas };
  });

  // Pontuação no nível do VÍDEO: cada problema (código + zona) penaliza uma única vez, pela
  // severidade máxima observada — um padrão de layout repetido em todas as cenas não deve
  // derrubar a nota 4x. Problemas críticos (freeze, tela preta) contam por cena.
  const todos = resultadoCenas.flatMap((c) => c.alertas);
  const unicos = new Map();
  for (const a of todos) {
    const chave = a.severidade === "critico" ? `${a.codigo}:${a.zona ?? ""}:${unicos.size}` : `${a.codigo}:${a.zona ?? ""}`;
    const atual = unicos.get(chave);
    if (!atual || SEVERIDADE_PESO[a.severidade] > SEVERIDADE_PESO[atual.severidade]) unicos.set(chave, a);
  }
  const penalidade = [...unicos.values()].reduce((s, a) => s + (SEVERIDADE_PESO[a.severidade] ?? 0), 0);
  const criticos = todos.filter((a) => a.severidade === "critico").length;
  return {
    motor: motor.nome,
    duracaoMs: Date.now() - inicio,
    cenas: resultadoCenas,
    resumo: {
      criticos,
      altos: todos.filter((a) => a.severidade === "alto").length,
      medios: todos.filter((a) => a.severidade === "medio").length,
      nota: Math.max(0, arred(10 - penalidade, 1)),
      aprovado: criticos === 0,
    },
  };
}
