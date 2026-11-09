import { COR, esc, div, f2, faixa, suave, palco, fonteUi, fonteTitulo, moldura, exigirTexto, textoOpcional } from "./util.js";

export const tipo = "mascote-explica";
// O mascote vetorial vive no runtime do Motor2D (lip-sync via __SPEECH_TIMELINE__): esta cena desenha o balão
// e reserva o slot `#<prefixo>-mascote`, que a composição preenche com Motor2D.mascote().
export const usaMascote = true;

export function validar(dados = {}) {
  const erros = [];
  exigirTexto(erros, dados.fala, "fala", 160);
  textoOpcional(erros, dados.destaque, "destaque", 40);
  if (dados.humor !== undefined && !["neutro", "feliz", "surpreso", "bravo", "pensativo"].includes(dados.humor)) erros.push("'humor' inválido (neutro, feliz, surpreso, bravo, pensativo).");
  return erros;
}

export function desenhar(dados, perfil, t, duracao, ctx = {}) {
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
