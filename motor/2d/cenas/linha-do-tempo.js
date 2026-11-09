import { COR, esc, div, f2, entrada, faixa, suave, palco, cabecalho, fonteUi, fonteTitulo, moldura, textoOpcional, exigirTexto, exigirLista } from "./util.js";

export const tipo = "linha-do-tempo";

export function validar(dados = {}) {
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

export function desenhar(dados, perfil, t, duracao) {
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
