import { COR, esc, div, f2, entrada, faixa, suave, palco, cabecalho, fonteUi, moldura, textoOpcional, exigirTexto, exigirLista } from "./util.js";

export const tipo = "diagrama-fluxo";

export function validar(dados = {}) {
  const erros = [];
  textoOpcional(erros, dados.titulo, "titulo", 70);
  if (exigirLista(erros, dados.etapas, "etapas", 2, 5)) dados.etapas.forEach((e, i) => exigirTexto(erros, e, `etapas[${i}]`, 28));
  return erros;
}

export function desenhar(dados, perfil, t, duracao, ctx = {}) {
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
