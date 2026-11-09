// Gerado automaticamente por scripts/build-cenas2d-global.js a partir de motor/2d/cenas/*.js
(function (global) {
  "use strict";
  var __defs = {}, __cache = {};
  function __req(nome) {
    if (__cache[nome]) return __cache[nome];
    var exp = (__cache[nome] = {});
    __defs[nome](exp, __req);
    return exp;
  }

  // --- capitulo-titulo.js ---
  __defs["capitulo-titulo"] = function (__exp, __req) {
const { COR, esc, div, f2, faixa, suave, palco, fonteTitulo, fonteUi, moldura, exigirTexto, textoOpcional } = __req("util");
const tipo = "capitulo-titulo";

function validar(dados = {}) {
  const erros = [];
  exigirTexto(erros, dados.titulo, "titulo", 70);
  textoOpcional(erros, dados.subtitulo, "subtitulo", 110);
  textoOpcional(erros, dados.kicker, "kicker", 40);
  return erros;
}

function desenhar(dados, perfil, t, duracao) {
  const p = palco(perfil);
  const cx = p.x + p.largura / 2;
  const cy = p.y + p.altura / 2 - 40;
  const uK = suave(faixa(t, 0.1, 0.6));
  const uT = suave(faixa(t, 0.3, 1.0));
  const uL = suave(faixa(t, 0.5, 1.3));
  const uS = suave(faixa(t, 0.9, 1.5));
  const saida = 1 - suave(faixa(t, duracao - 0.4, duracao));
  const base = { position: "absolute", left: `${p.x}px`, width: `${p.largura}px`, "text-align": "center" };
  return moldura(
    perfil,
    div({ ...base, top: `${f2(cy - 190)}px`, ...fonteUi, "font-size": "34px", "font-weight": 700, "letter-spacing": "0.2em", color: COR.ciano, opacity: f2(uK * saida) }, esc(dados.kicker || "CAPÍTULO")) +
      div({ ...base, top: `${f2(cy - 130 + (1 - uT) * 30)}px`, ...fonteTitulo, "font-size": "132px", "line-height": 1.05, opacity: f2(uT * saida) }, esc(dados.titulo)) +
      div({ position: "absolute", left: `${f2(cx - 160 * uL)}px`, top: `${f2(cy + 110)}px`, width: `${f2(320 * uL)}px`, height: "6px", background: COR.ciano, "border-radius": "3px", opacity: f2(saida) }) +
      (dados.subtitulo ? div({ ...base, top: `${f2(cy + 150)}px`, ...fonteUi, "font-size": "42px", color: COR.sub, opacity: f2(uS * saida) }, esc(dados.subtitulo)) : "")
  );
}

    __exp.validar = validar;
    __exp.desenhar = desenhar;
    __exp.tipo = tipo;
  };

  // --- comparacao-ab.js ---
  __defs["comparacao-ab"] = function (__exp, __req) {
const { COR, esc, div, f2, entrada, palco, cabecalho, fonteUi, fonteTitulo, moldura, exigirTexto, textoOpcional } = __req("util");
const tipo = "comparacao-ab";

function validarLado(erros, lado, nome) {
  if (!lado || typeof lado !== "object") {
    erros.push(`'${nome}' é obrigatório (objeto com rotulo).`);
    return;
  }
  exigirTexto(erros, lado.rotulo, `${nome}.rotulo`, 40);
  textoOpcional(erros, lado.valor, `${nome}.valor`, 24);
  if (lado.itens !== undefined) {
    if (!Array.isArray(lado.itens) || lado.itens.length > 4) erros.push(`'${nome}.itens' deve ser uma lista de até 4 textos.`);
    else lado.itens.forEach((it, i) => exigirTexto(erros, it, `${nome}.itens[${i}]`, 60));
  }
}

function validar(dados = {}) {
  const erros = [];
  textoOpcional(erros, dados.titulo, "titulo", 70);
  validarLado(erros, dados.a, "a");
  validarLado(erros, dados.b, "b");
  return erros;
}

function painel(lado, x, y, largura, altura, cor, u) {
  const itens = (lado.itens || []).map((it) => `<div style="margin-top:14px">• ${esc(it)}</div>`).join("");
  return div(
    {
      position: "absolute",
      left: `${f2(x)}px`,
      top: `${f2(y + (1 - u) * 40)}px`,
      width: `${f2(largura)}px`,
      height: `${f2(altura)}px`,
      "box-sizing": "border-box",
      padding: "36px 40px",
      background: COR.painel,
      border: `3px solid ${cor}`,
      "border-radius": "22px",
      opacity: f2(u),
      ...fonteUi,
    },
    `<div style="font-size:34px;font-weight:700;letter-spacing:0.12em;color:${cor};text-transform:uppercase">${esc(lado.rotulo)}</div>` +
      (lado.valor ? `<div style="${Object.entries(fonteTitulo).map(([k, v]) => `${k}:${v}`).join(";")};font-size:112px;line-height:1.1;margin-top:18px">${esc(lado.valor)}</div>` : "") +
      `<div style="font-size:36px;color:${COR.sub};margin-top:10px">${itens}</div>`
  );
}

function desenhar(dados, perfil, t, duracao) {
  const p = palco(perfil);
  const cab = cabecalho(dados, perfil, t);
  const topo = p.y + (cab.altura ? 120 : 0);
  const gap = 48;
  const larg = (p.largura - gap) / 2;
  const alt = p.altura - (topo - p.y) - 10;
  const html =
    painel(dados.a, p.x, topo, larg, alt, COR.ciano, entrada(t, 0, 2, duracao)) +
    painel(dados.b, p.x + larg + gap, topo, larg, alt, COR.ambar, entrada(t, 1, 2, duracao)) +
    div({ position: "absolute", left: `${f2(p.x + larg + gap / 2 - 36)}px`, top: `${f2(topo + alt / 2 - 36)}px`, width: "72px", height: "72px", "border-radius": "36px", background: COR.fundo, border: `3px solid ${COR.borda}`, display: "flex", "align-items": "center", "justify-content": "center", ...fonteUi, "font-size": "28px", "font-weight": 700, color: COR.sub, opacity: f2(entrada(t, 1, 2, duracao)) }, "VS");
  return moldura(perfil, cab.html + html);
}

    __exp.validar = validar;
    __exp.desenhar = desenhar;
    __exp.tipo = tipo;
  };

  // --- diagrama-fluxo.js ---
  __defs["diagrama-fluxo"] = function (__exp, __req) {
const { COR, esc, div, f2, entrada, faixa, suave, palco, cabecalho, fonteUi, moldura, textoOpcional, exigirTexto, exigirLista } = __req("util");
const tipo = "diagrama-fluxo";

function validar(dados = {}) {
  const erros = [];
  textoOpcional(erros, dados.titulo, "titulo", 70);
  if (exigirLista(erros, dados.etapas, "etapas", 2, 5)) dados.etapas.forEach((e, i) => exigirTexto(erros, e, `etapas[${i}]`, 28));
  return erros;
}

function desenhar(dados, perfil, t, duracao, ctx = {}) {
  const prefixo = ctx.prefixo || "fluxo";
  const p = palco(perfil);
  const cab = cabecalho(dados, perfil, t);
  const n = dados.etapas.length;
  const yCentro = p.y + (cab.altura ? 130 : 20) + (p.altura - (cab.altura ? 130 : 20)) / 2 - 20;
  const gap = 90;
  const larg = (p.largura - gap * (n - 1)) / n;
  const alt = 190;
  const xs = dados.etapas.map((_, i) => p.x + i * (larg + gap));
  const caixas = dados.etapas
    .map((e, i) => {
      const u = entrada(t, i, n, duracao);
      return div(
        { position: "absolute", left: `${f2(xs[i])}px`, top: `${f2(yCentro - alt / 2 + (1 - u) * 30)}px`, width: `${f2(larg)}px`, height: `${alt}px`, display: "flex", "align-items": "center", "justify-content": "center", "text-align": "center", padding: "0 18px", "box-sizing": "border-box", background: COR.painel, border: `3px solid ${i === n - 1 ? COR.ambar : COR.ciano}`, "border-radius": "20px", ...fonteUi, "font-size": "40px", "font-weight": 700, "line-height": 1.15, opacity: f2(u) },
        esc(e)
      );
    })
    .join("");
  // setas entre as caixas + pulso viajando (função pura de t)
  const ciclo = ((t * 0.8) % 1 + 1) % 1;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${perfil.largura}" height="${perfil.altura}" style="position:absolute;left:0;top:0"><defs><marker id="${prefixo}-seta" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="${COR.ciano}"/></marker></defs>`;
  for (let i = 0; i < n - 1; i++) {
    const u = entrada(t, i + 1, n, duracao);
    const x1 = xs[i] + larg + 10;
    const x2 = xs[i + 1] - 12;
    svg += `<line x1="${f2(x1)}" y1="${f2(yCentro)}" x2="${f2(x1 + (x2 - x1) * u)}" y2="${f2(yCentro)}" stroke="${COR.ciano}" stroke-width="6" marker-end="${u > 0.98 ? `url(#${prefixo}-seta)` : ""}"/>`;
    if (u > 0.98 && t > 1.2) svg += `<circle cx="${f2(x1 + (x2 - x1) * ciclo)}" cy="${f2(yCentro)}" r="10" fill="${COR.ambar}"/>`;
  }
  svg += "</svg>";
  return moldura(perfil, cab.html + svg + caixas);
}

    __exp.validar = validar;
    __exp.desenhar = desenhar;
    __exp.tipo = tipo;
  };

  // --- grafico-barra.js ---
  __defs["grafico-barra"] = function (__exp, __req) {
const { COR, esc, div, f2, entrada, palco, cabecalho, fonteUi, moldura, textoOpcional, exigirTexto, exigirLista } = __req("util");
const tipo = "grafico-barra";

function validar(dados = {}) {
  const erros = [];
  textoOpcional(erros, dados.titulo, "titulo", 70);
  textoOpcional(erros, dados.unidade, "unidade", 12);
  if (exigirLista(erros, dados.barras, "barras", 2, 8)) {
    dados.barras.forEach((b, i) => {
      exigirTexto(erros, b?.rotulo, `barras[${i}].rotulo`, 24);
      if (typeof b?.valor !== "number" || !Number.isFinite(b.valor) || b.valor < 0) erros.push(`'barras[${i}].valor' deve ser um número ≥ 0.`);
    });
  }
  return erros;
}

function desenhar(dados, perfil, t, duracao) {
  const p = palco(perfil);
  const cab = cabecalho(dados, perfil, t);
  const n = dados.barras.length;
  const topo = p.y + (cab.altura ? 130 : 20);
  const base = p.y + p.altura - 70;
  const alturaMax = base - topo - 60;
  const max = Math.max(...dados.barras.map((b) => b.valor), 1e-9);
  const larg = p.largura / n;
  const un = dados.unidade ? ` ${esc(dados.unidade)}` : "";
  const barras = dados.barras
    .map((b, i) => {
      const u = entrada(t, i, n, duracao, 0.4, 0.9);
      const h = (b.valor / max) * alturaMax * u;
      const x = p.x + i * larg + larg * 0.15;
      const w = larg * 0.7;
      const destaque = b.valor === max;
      return (
        div({ position: "absolute", left: `${f2(x)}px`, top: `${f2(base - h)}px`, width: `${f2(w)}px`, height: `${f2(h)}px`, background: destaque ? COR.ambar : COR.ciano, "border-radius": "10px 10px 0 0" }) +
        div({ position: "absolute", left: `${f2(x - 20)}px`, top: `${f2(base - h - 54)}px`, width: `${f2(w + 40)}px`, "text-align": "center", ...fonteUi, "font-size": "40px", "font-weight": 700, opacity: f2(u) }, `${esc(Math.round(b.valor * u * 10) / 10)}${un}`) +
        div({ position: "absolute", left: `${f2(x - 20)}px`, top: `${f2(base + 14)}px`, width: `${f2(w + 40)}px`, "text-align": "center", ...fonteUi, "font-size": "32px", color: COR.sub }, esc(b.rotulo))
      );
    })
    .join("");
  const eixo = div({ position: "absolute", left: `${p.x}px`, top: `${base}px`, width: `${p.largura}px`, height: "4px", background: COR.borda });
  return moldura(perfil, cab.html + eixo + barras);
}

    __exp.validar = validar;
    __exp.desenhar = desenhar;
    __exp.tipo = tipo;
  };

  // --- grafico-linha.js ---
  __defs["grafico-linha"] = function (__exp, __req) {
const { COR, esc, div, f2, faixa, suave, lerp, palco, cabecalho, fonteUi, moldura, textoOpcional, exigirTexto, exigirLista } = __req("util");
const tipo = "grafico-linha";

function validar(dados = {}) {
  const erros = [];
  textoOpcional(erros, dados.titulo, "titulo", 70);
  textoOpcional(erros, dados.unidade, "unidade", 12);
  if (exigirLista(erros, dados.pontos, "pontos", 3, 12)) {
    dados.pontos.forEach((pt, i) => {
      exigirTexto(erros, pt?.rotulo, `pontos[${i}].rotulo`, 16);
      if (typeof pt?.valor !== "number" || !Number.isFinite(pt.valor)) erros.push(`'pontos[${i}].valor' deve ser um número.`);
    });
  }
  return erros;
}

function desenhar(dados, perfil, t, duracao) {
  const p = palco(perfil);
  const cab = cabecalho(dados, perfil, t);
  const n = dados.pontos.length;
  const topo = p.y + (cab.altura ? 150 : 50);
  const base = p.y + p.altura - 70;
  const esq = p.x + 40;
  const larg = p.largura - 120;
  const valores = dados.pontos.map((pt) => pt.valor);
  const min = Math.min(...valores, 0);
  const max = Math.max(...valores);
  const span = max - min || 1;
  const px = (i) => esq + (i / (n - 1)) * larg;
  const py = (v) => base - ((v - min) / span) * (base - topo);
  const prog = suave(faixa(t, 0.4, Math.max(1.5, duracao * 0.7))) * (n - 1);

  // Polilinha até `prog` (interpolando o último segmento) — função pura do tempo
  const coords = [];
  for (let i = 0; i < n; i++) {
    if (i <= Math.floor(prog)) coords.push([px(i), py(valores[i])]);
  }
  const k = Math.floor(prog);
  if (k < n - 1) {
    const fr = prog - k;
    coords.push([lerp(px(k), px(k + 1), fr), lerp(py(valores[k]), py(valores[k + 1]), fr)]);
  }
  const pontos = coords.map(([x, y]) => `${f2(x)},${f2(y)}`).join(" ");
  const ultimo = coords[coords.length - 1];
  const un = dados.unidade ? ` ${esc(dados.unidade)}` : "";
  const rotulos = dados.pontos
    .map((pt, i) => div({ position: "absolute", left: `${f2(px(i) - 60)}px`, top: `${f2(base + 16)}px`, width: "120px", "text-align": "center", ...fonteUi, "font-size": "30px", color: COR.sub, opacity: f2(i <= prog + 0.01 ? 1 : 0.35) }, esc(pt.rotulo)))
    .join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${perfil.largura}" height="${perfil.altura}" style="position:absolute;left:0;top:0">` +
    `<line x1="${esq}" y1="${base}" x2="${f2(esq + larg)}" y2="${base}" stroke="${COR.borda}" stroke-width="4"/>` +
    `<line x1="${esq}" y1="${topo}" x2="${esq}" y2="${base}" stroke="${COR.borda}" stroke-width="4"/>` +
    (coords.length > 1 ? `<polyline points="${pontos}" fill="none" stroke="${COR.ciano}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` : "") +
    `<circle cx="${f2(ultimo[0])}" cy="${f2(ultimo[1])}" r="14" fill="${COR.ambar}"/></svg>`;
  const valorAtual = valores[k] + (k < n - 1 ? (valores[k + 1] - valores[k]) * (prog - k) : 0);
  const rotuloValor = div({ position: "absolute", left: `${f2(Math.min(ultimo[0] + 24, p.x + p.largura - 220))}px`, top: `${f2(ultimo[1] - 70)}px`, ...fonteUi, "font-size": "44px", "font-weight": 700, color: COR.ambar }, `${esc(Math.round(valorAtual * 10) / 10)}${un}`);
  return moldura(perfil, cab.html + svg + rotulos + rotuloValor);
}

    __exp.validar = validar;
    __exp.desenhar = desenhar;
    __exp.tipo = tipo;
  };

  // --- index.js ---
  __defs["index"] = function (__exp, __req) {
// motor/2d/cenas/index.js — Registro das cenas 2D data-driven (frame.cena = { tipo, dados })
const capituloTitulo = __req("capitulo-titulo");
const listaAnimada = __req("lista-animada");
const comparacaoAb = __req("comparacao-ab");
const graficoLinha = __req("grafico-linha");
const graficoBarra = __req("grafico-barra");
const linhaDoTempo = __req("linha-do-tempo");
const numeroGrande = __req("numero-grande");
const diagramaFluxo = __req("diagrama-fluxo");
const mascoteExplica = __req("mascote-explica");
const CENAS = {
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

function listarTiposCena() {
  return Object.keys(CENAS);
}

/** Valida `frame.cena`; devolve lista de mensagens de erro (vazia = ok). */
function validarCena(cena) {
  if (!cena || typeof cena !== "object") return ["'cena' deve ser um objeto { tipo, dados }."];
  const mod = CENAS[cena.tipo];
  if (!mod) return [`Tipo de cena desconhecido: '${cena.tipo}'. Use: ${listarTiposCena().join(", ")}.`];
  return mod.validar(cena.dados || {});
}

/** Desenha a cena no instante local `t`: função pura (mesma entrada → mesma saída). */
function desenharCena(tipo, dados, perfil, t, duracao, ctx = {}) {
  const mod = CENAS[tipo];
  if (!mod) throw new Error(`Tipo de cena desconhecido: '${tipo}'.`);
  return mod.desenhar(dados || {}, perfil, t, duracao, ctx);
}

function cenaUsaMascote(tipo) {
  return Boolean(CENAS[tipo]?.usaMascote);
}

    __exp.listarTiposCena = listarTiposCena;
    __exp.validarCena = validarCena;
    __exp.desenharCena = desenharCena;
    __exp.cenaUsaMascote = cenaUsaMascote;
    __exp.CENAS = CENAS;
  };

  // --- linha-do-tempo.js ---
  __defs["linha-do-tempo"] = function (__exp, __req) {
const { COR, esc, div, f2, entrada, faixa, suave, palco, cabecalho, fonteUi, fonteTitulo, moldura, textoOpcional, exigirTexto, exigirLista } = __req("util");
const tipo = "linha-do-tempo";

function validar(dados = {}) {
  const erros = [];
  textoOpcional(erros, dados.titulo, "titulo", 70);
  if (exigirLista(erros, dados.marcos, "marcos", 2, 6)) {
    dados.marcos.forEach((m, i) => {
      exigirTexto(erros, m?.rotulo, `marcos[${i}].rotulo`, 20);
      textoOpcional(erros, m?.texto, `marcos[${i}].texto`, 70);
    });
  }
  return erros;
}

function desenhar(dados, perfil, t, duracao) {
  const p = palco(perfil);
  const cab = cabecalho(dados, perfil, t);
  const n = dados.marcos.length;
  const yLinha = p.y + (cab.altura ? 130 : 20) + (p.altura - (cab.altura ? 130 : 20)) / 2 - 20;
  const passo = p.largura / n;
  const prog = suave(faixa(t, 0.3, Math.max(1.5, duracao * 0.65)));
  const linha = div({ position: "absolute", left: `${p.x}px`, top: `${f2(yLinha)}px`, width: `${f2(p.largura * prog)}px`, height: "8px", background: COR.ciano, "border-radius": "4px" });
  const marcos = dados.marcos
    .map((m, i) => {
      const cx = p.x + passo * (i + 0.5);
      const u = entrada(t, i, n, duracao);
      const acima = i % 2 === 0;
      return (
        div({ position: "absolute", left: `${f2(cx - 22)}px`, top: `${f2(yLinha - 18)}px`, width: "44px", height: "44px", "border-radius": "22px", background: COR.ambar, border: `6px solid ${COR.fundo}`, "box-sizing": "border-box", transform: `scale(${f2(u)})` }) +
        div(
          { position: "absolute", left: `${f2(cx - passo / 2 + 10)}px`, width: `${f2(passo - 20)}px`, top: `${f2(acima ? yLinha - 190 : yLinha + 50)}px`, "text-align": "center", opacity: f2(u), ...fonteUi },
          `<div style="${Object.entries(fonteTitulo).map(([k, v]) => `${k}:${v}`).join(";")};font-size:62px;color:${COR.ambar}">${esc(m.rotulo)}</div>` +
            (m.texto ? `<div style="font-size:32px;color:${COR.sub};margin-top:6px;line-height:1.25">${esc(m.texto)}</div>` : "")
        )
      );
    })
    .join("");
  return moldura(perfil, cab.html + linha + marcos);
}

    __exp.validar = validar;
    __exp.desenhar = desenhar;
    __exp.tipo = tipo;
  };

  // --- lista-animada.js ---
  __defs["lista-animada"] = function (__exp, __req) {
const { COR, esc, div, f2, entrada, palco, cabecalho, fonteUi, moldura, exigirTexto, textoOpcional, exigirLista } = __req("util");
const tipo = "lista-animada";

function validar(dados = {}) {
  const erros = [];
  textoOpcional(erros, dados.titulo, "titulo", 70);
  if (exigirLista(erros, dados.itens, "itens", 2, 7)) dados.itens.forEach((it, i) => exigirTexto(erros, it, `itens[${i}]`, 80));
  return erros;
}

function desenhar(dados, perfil, t, duracao) {
  const p = palco(perfil);
  const cab = cabecalho(dados, perfil, t);
  const n = dados.itens.length;
  const topo = p.y + (cab.altura ? 130 : 20);
  const alturaLinha = Math.min(104, (p.altura - (topo - p.y) - 10) / n);
  const linhas = dados.itens
    .map((item, i) => {
      const u = entrada(t, i, n, duracao);
      return div(
        {
          position: "absolute",
          left: `${p.x}px`,
          top: `${f2(topo + i * alturaLinha)}px`,
          width: `${p.largura}px`,
          height: `${f2(alturaLinha - 14)}px`,
          display: "flex",
          "align-items": "center",
          gap: "28px",
          padding: "0 32px",
          "box-sizing": "border-box",
          background: COR.painel,
          border: `2px solid ${COR.borda}`,
          "border-left": `8px solid ${COR.ciano}`,
          "border-radius": "16px",
          ...fonteUi,
          "font-size": "44px",
          "font-weight": 700,
          opacity: f2(u),
          transform: `translateX(${f2((1 - u) * -80)}px)`,
        },
        `<span style="color:${COR.ciano};min-width:56px">${String(i + 1).padStart(2, "0")}</span><span>${esc(item)}</span>`
      );
    })
    .join("");
  return moldura(perfil, cab.html + linhas);
}

    __exp.validar = validar;
    __exp.desenhar = desenhar;
    __exp.tipo = tipo;
  };

  // --- mascote-explica.js ---
  __defs["mascote-explica"] = function (__exp, __req) {
const { COR, esc, div, f2, faixa, suave, palco, fonteUi, fonteTitulo, moldura, exigirTexto, textoOpcional } = __req("util");
const tipo = "mascote-explica";
// O mascote vetorial vive no runtime do Motor2D (lip-sync via __SPEECH_TIMELINE__): esta cena desenha o balão
// e reserva o slot `#<prefixo>-mascote`, que a composição preenche com Motor2D.mascote().
const usaMascote = true;

function validar(dados = {}) {
  const erros = [];
  exigirTexto(erros, dados.fala, "fala", 160);
  textoOpcional(erros, dados.destaque, "destaque", 40);
  if (dados.humor !== undefined && !["neutro", "feliz", "surpreso", "bravo", "pensativo"].includes(dados.humor)) erros.push("'humor' inválido (neutro, feliz, surpreso, bravo, pensativo).");
  return erros;
}

function desenhar(dados, perfil, t, duracao, ctx = {}) {
  const prefixo = ctx.prefixo || "mascote";
  const p = palco(perfil);
  const u = suave(faixa(t, 0.3, 0.9));
  const larguraBalao = p.largura - 520;
  const balao = div(
    { position: "absolute", left: `${p.x}px`, top: `${f2(p.y + 80 + (1 - u) * 30)}px`, width: `${larguraBalao}px`, "box-sizing": "border-box", padding: "44px 52px", background: COR.painel, border: `3px solid ${COR.ciano}`, "border-radius": "28px", opacity: f2(u), ...fonteUi },
    (dados.destaque ? `<div style="font-size:30px;font-weight:700;letter-spacing:0.14em;color:${COR.ciano};text-transform:uppercase;margin-bottom:16px">${esc(dados.destaque)}</div>` : "") +
      `<div style="${Object.entries(fonteTitulo).map(([k, v]) => `${k}:${v}`).join(";")};font-size:64px;line-height:1.18">${esc(dados.fala)}</div>`
  );
  const slot = div({ position: "absolute", left: `${f2(p.x + larguraBalao + 60)}px`, top: `${f2(p.y + 20)}px`, width: "420px", height: "590px", opacity: f2(u) }, "", `id="${prefixo}-mascote"`);
  return moldura(perfil, balao + slot);
}

    __exp.validar = validar;
    __exp.desenhar = desenhar;
    __exp.tipo = tipo;
    __exp.usaMascote = usaMascote;
  };

  // --- numero-grande.js ---
  __defs["numero-grande"] = function (__exp, __req) {
const { COR, esc, div, f2, faixa, suave, lerp, palco, fonteUi, fonteTitulo, moldura, exigirTexto, textoOpcional } = __req("util");
const tipo = "numero-grande";

function validar(dados = {}) {
  const erros = [];
  if (typeof dados.valor !== "number" && typeof dados.valor !== "string") erros.push("'valor' é obrigatório (número ou texto).");
  else if (String(dados.valor).length > 14) erros.push("'valor' passa de 14 caracteres.");
  textoOpcional(erros, dados.prefixo, "prefixo", 6);
  textoOpcional(erros, dados.sufixo, "sufixo", 14);
  exigirTexto(erros, dados.rotulo, "rotulo", 80);
  if (dados.de !== undefined && typeof dados.de !== "number") erros.push("'de' deve ser um número.");
  return erros;
}

function desenhar(dados, perfil, t, duracao) {
  const p = palco(perfil);
  const u = suave(faixa(t, 0.3, Math.min(duracao * 0.6, 2.4)));
  const numerico = typeof dados.valor === "number";
  const atual = numerico ? lerp(dados.de ?? 0, dados.valor, u) : dados.valor;
  const casas = numerico && !Number.isInteger(dados.valor) ? 1 : 0;
  const texto = numerico ? atual.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }) : String(atual);
  const uR = suave(faixa(t, 0.8, 1.4));
  const base = { position: "absolute", left: `${p.x}px`, width: `${p.largura}px`, "text-align": "center" };
  const cy = p.y + p.altura / 2;
  return moldura(
    perfil,
    div({ ...base, top: `${f2(cy - 200)}px`, ...fonteTitulo, "font-size": "280px", "line-height": 1, color: COR.ciano, opacity: f2(suave(faixa(t, 0.1, 0.5))) }, `${esc(dados.prefixo || "")}${esc(texto)}${esc(dados.sufixo || "")}`) +
      div({ position: "absolute", left: `${f2(p.x + p.largura / 2 - 220)}px`, top: `${f2(cy + 120)}px`, width: `${f2(440 * uR)}px`, height: "6px", background: COR.ambar, "border-radius": "3px" }) +
      div({ ...base, top: `${f2(cy + 150)}px`, ...fonteUi, "font-size": "48px", color: COR.sub, opacity: f2(uR) }, esc(dados.rotulo))
  );
}

    __exp.validar = validar;
    __exp.desenhar = desenhar;
    __exp.tipo = tipo;
  };

  // --- util.js ---
  __defs["util"] = function (__exp, __req) {
// motor/2d/cenas/util.js — Utilitários das cenas 2D data-driven (funções puras, sem DOM e sem aleatoriedade)

const COR = {
  fundo: "#050a14",
  painel: "#0c192c",
  painelClaro: "#13294a",
  borda: "#1e3a5f",
  texto: "#f8fafc",
  sub: "#cbd5e1",
  ciano: "#38bdf8",
  ambar: "#fbbf24",
  ok: "#4ade80",
  falha: "#f87171",
};

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}
function faixa(t, a, b) {
  return b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a), 0, 1);
}
function suave(x) {
  x = clamp(x, 0, 1);
  return x * x * (3 - 2 * x);
}
function lerp(a, b, u) {
  return a + (b - a) * u;
}
function f2(n) {
  return Math.round(n * 100) / 100;
}

function esc(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Estilo inline a partir de um objeto { "font-size": "40px", ... } */
function estilo(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

function div(st, interno = "", attrs = "") {
  return `<div ${attrs} style="${estilo(st)}">${interno}</div>`;
}

/** Palco útil das cenas: área segura de título do perfil, acima da legenda (que ocupa a base). */
function palco(perfil) {
  const m = perfil.palco || perfil.miolo;
  return { x: m.x, y: m.y, largura: m.largura, altura: m.altura };
}

/** Instante de entrada do item i (escalonado) para n itens numa cena de `duracao` segundos. */
function inicioItem(i, n, duracao, inicio = 0.4) {
  const passo = Math.min(1.1, (duracao * 0.55) / Math.max(1, n));
  return inicio + i * passo;
}

/** Progresso suave 0..1 do item i. */
function entrada(t, i, n, duracao, inicio = 0.4, tempo = 0.5) {
  const a = inicioItem(i, n, duracao, inicio);
  return suave(faixa(t, a, a + tempo));
}

const TEXTO_BASE = { "font-family": "'Inter', sans-serif", color: COR.texto };
const fonteTitulo = { "font-family": "'EB Garamond', serif", "font-weight": 700, color: COR.texto };
const fonteUi = TEXTO_BASE;

/** Cabeçalho comum (título opcional) no topo do palco. Retorna { html, altura }. */
function cabecalho(dados, perfil, t) {
  if (!dados.titulo) return { html: "", altura: 0 };
  const p = palco(perfil);
  const u = suave(faixa(t, 0.05, 0.55));
  const html = div(
    {
      position: "absolute",
      left: `${p.x}px`,
      top: `${p.y}px`,
      width: `${p.largura}px`,
      ...fonteTitulo,
      "font-size": "64px",
      "line-height": 1.1,
      opacity: f2(u),
      transform: `translateY(${f2((1 - u) * -20)}px)`,
    },
    esc(dados.titulo)
  );
  return { html, altura: 96 };
}

/** Moldura base (fundo do palco) com o conteúdo desenhado. */
function moldura(perfil, interno) {
  return div({ position: "absolute", left: 0, top: 0, width: `${perfil.largura}px`, height: `${perfil.altura}px`, overflow: "hidden", background: COR.fundo }, interno);
}

/** Validação simples de campos: devolve lista de mensagens. */
function exigirTexto(erros, valor, nome, max = 90) {
  if (typeof valor !== "string" || !valor.trim()) erros.push(`'${nome}' é obrigatório (texto).`);
  else if (valor.length > max) erros.push(`'${nome}' passa de ${max} caracteres (${valor.length}).`);
}
function textoOpcional(erros, valor, nome, max = 90) {
  if (valor !== undefined && valor !== null) exigirTexto(erros, valor, nome, max);
}
function exigirLista(erros, lista, nome, min, max) {
  if (!Array.isArray(lista)) {
    erros.push(`'${nome}' deve ser uma lista.`);
    return false;
  }
  if (lista.length < min || lista.length > max) {
    erros.push(`'${nome}' deve ter de ${min} a ${max} itens (tem ${lista.length}).`);
    return false;
  }
  return true;
}

/** Razão de contraste WCAG entre duas cores hex (#rrggbb). */
function contraste(fg, bg) {
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

/** Pares texto/fundo usados pelas cenas — verificados em teste (WCAG AA ≥ 4.5). */
const PARES_CONTRASTE = [
  [COR.texto, COR.fundo],
  [COR.texto, COR.painel],
  [COR.texto, COR.painelClaro],
  [COR.sub, COR.fundo],
  [COR.sub, COR.painel],
  [COR.ciano, COR.fundo],
  [COR.ciano, COR.painel],
  [COR.ambar, COR.painel],
  [COR.ok, COR.painel],
  [COR.falha, COR.painel],
  [COR.fundo, COR.ciano],
  [COR.fundo, COR.ambar],
];

    __exp.clamp = clamp;
    __exp.faixa = faixa;
    __exp.suave = suave;
    __exp.lerp = lerp;
    __exp.f2 = f2;
    __exp.esc = esc;
    __exp.estilo = estilo;
    __exp.div = div;
    __exp.palco = palco;
    __exp.inicioItem = inicioItem;
    __exp.entrada = entrada;
    __exp.cabecalho = cabecalho;
    __exp.moldura = moldura;
    __exp.exigirTexto = exigirTexto;
    __exp.textoOpcional = textoOpcional;
    __exp.exigirLista = exigirLista;
    __exp.contraste = contraste;
    __exp.COR = COR;
    __exp.fonteTitulo = fonteTitulo;
    __exp.fonteUi = fonteUi;
    __exp.PARES_CONTRASTE = PARES_CONTRASTE;
  };

  global.Cenas2D = __req("index");
})(typeof window !== "undefined" ? window : globalThis);
