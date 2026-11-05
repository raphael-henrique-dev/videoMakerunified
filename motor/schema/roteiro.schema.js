// motor/schema/roteiro.schema.js — Validador do contrato unificado roteiro.json (Motor 2.0)

export function validarRoteiro(roteiro) {
  const erros = [];
  if (!roteiro || typeof roteiro !== "object") {
    return { valido: false, erros: ["O arquivo roteiro.json deve ser um objeto JSON válido."] };
  }
  if (!roteiro.id || typeof roteiro.id !== "string") {
    erros.push("Campo obrigatório ausente: 'id' (string).");
  }
  if (!roteiro.titulo || typeof roteiro.titulo !== "string") {
    erros.push("Campo obrigatório ausente: 'titulo' (string).");
  }
  if (!Array.isArray(roteiro.frames) || roteiro.frames.length === 0) {
    erros.push("Campo obrigatório 'frames' deve ser um array não-vazio de cenas.");
  } else {
    roteiro.frames.forEach((f, idx) => {
      if (!f.id) erros.push(`Frame [${idx}] sem 'id'.`);
      if (!f.arquivo) erros.push(`Frame [${idx}] (${f.id || "?"}) sem 'arquivo' HTML.`);
      if (!Array.isArray(f.frases) || f.frases.length === 0) {
        erros.push(`Frame [${idx}] (${f.id || "?"}) deve conter ao menos uma frase em 'frases'.`);
      } else {
        f.frases.forEach((fr, j) => {
          if (!fr.texto || typeof fr.texto !== "string") {
            erros.push(`Frame '${f.id}', frase [${j}] sem 'texto'.`);
          }
        });
      }
    });
  }
  return {
    valido: erros.length === 0,
    erros,
  };
}
