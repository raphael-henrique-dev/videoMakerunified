import { COR, esc, div, f2, faixa, suave, lerp, palco, fonteUi, fonteTitulo, moldura, exigirTexto, textoOpcional } from "./util.js";

export const tipo = "numero-grande";

export function validar(dados = {}) {
  const erros = [];
  if (typeof dados.valor !== "number" && typeof dados.valor !== "string") erros.push("'valor' é obrigatório (número ou texto).");
  else if (String(dados.valor).length > 14) erros.push("'valor' passa de 14 caracteres.");
  textoOpcional(erros, dados.prefixo, "prefixo", 6);
  textoOpcional(erros, dados.sufixo, "sufixo", 14);
  exigirTexto(erros, dados.rotulo, "rotulo", 80);
  if (dados.de !== undefined && typeof dados.de !== "number") erros.push("'de' deve ser um número.");
  return erros;
}

export function desenhar(dados, perfil, t, duracao) {
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
