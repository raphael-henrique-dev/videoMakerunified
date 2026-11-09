import { COR, esc, div, f2, entrada, palco, cabecalho, fonteUi, fonteTitulo, moldura, exigirTexto, textoOpcional } from "./util.js";

export const tipo = "comparacao-ab";

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

export function validar(dados = {}) {
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

export function desenhar(dados, perfil, t, duracao) {
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
