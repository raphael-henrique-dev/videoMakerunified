import { COR, esc, div, f2, entrada, palco, cabecalho, fonteUi, moldura, exigirTexto, textoOpcional, exigirLista } from "./util.js";

export const tipo = "lista-animada";

export function validar(dados = {}) {
  const erros = [];
  textoOpcional(erros, dados.titulo, "titulo", 70);
  if (exigirLista(erros, dados.itens, "itens", 2, 7)) dados.itens.forEach((it, i) => exigirTexto(erros, it, `itens[${i}]`, 80));
  return erros;
}

export function desenhar(dados, perfil, t, duracao) {
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
