import { COR, esc, div, f2, faixa, suave, lerp, palco, cabecalho, fonteUi, moldura, textoOpcional, exigirTexto, exigirLista } from "./util.js";

export const tipo = "grafico-linha";

export function validar(dados = {}) {
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

export function desenhar(dados, perfil, t, duracao) {
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
