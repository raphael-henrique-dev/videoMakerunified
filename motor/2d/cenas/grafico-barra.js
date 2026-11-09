import { COR, esc, div, f2, entrada, palco, cabecalho, fonteUi, moldura, textoOpcional, exigirTexto, exigirLista } from "./util.js";

export const tipo = "grafico-barra";

export function validar(dados = {}) {
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

export function desenhar(dados, perfil, t, duracao) {
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
