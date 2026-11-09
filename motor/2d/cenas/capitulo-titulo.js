import { COR, esc, div, f2, faixa, suave, palco, fonteTitulo, fonteUi, moldura, exigirTexto, textoOpcional } from "./util.js";

export const tipo = "capitulo-titulo";

export function validar(dados = {}) {
  const erros = [];
  exigirTexto(erros, dados.titulo, "titulo", 70);
  textoOpcional(erros, dados.subtitulo, "subtitulo", 110);
  textoOpcional(erros, dados.kicker, "kicker", 40);
  return erros;
}

export function desenhar(dados, perfil, t, duracao) {
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
