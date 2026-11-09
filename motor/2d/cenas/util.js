// motor/2d/cenas/util.js — Utilitários das cenas 2D data-driven (funções puras, sem DOM e sem aleatoriedade)

export const COR = {
  fundo: "#050a14",
  painel: "#0c192c",
  painelClaro: "#13294a",
  borda: "#1e3a5f",
  texto: "#f8fafc",
  sub: "#cbd5e1",
  ciano: "#38bdf8",
  ambar: "#fbbf24",
  ok: "#4ade80",
  falha: "#f87171",
};

export function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}
export function faixa(t, a, b) {
  return b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a), 0, 1);
}
export function suave(x) {
  x = clamp(x, 0, 1);
  return x * x * (3 - 2 * x);
}
export function lerp(a, b, u) {
  return a + (b - a) * u;
}
export function f2(n) {
  return Math.round(n * 100) / 100;
}

export function esc(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Estilo inline a partir de um objeto { "font-size": "40px", ... } */
export function estilo(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

export function div(st, interno = "", attrs = "") {
  return `<div ${attrs} style="${estilo(st)}">${interno}</div>`;
}

/** Palco útil das cenas: área segura de título do perfil, acima da legenda (que ocupa a base). */
export function palco(perfil) {
  const m = perfil.palco || perfil.miolo;
  return { x: m.x, y: m.y, largura: m.largura, altura: m.altura };
}

/** Instante de entrada do item i (escalonado) para n itens numa cena de `duracao` segundos. */
export function inicioItem(i, n, duracao, inicio = 0.4) {
  const passo = Math.min(1.1, (duracao * 0.55) / Math.max(1, n));
  return inicio + i * passo;
}

/** Progresso suave 0..1 do item i. */
export function entrada(t, i, n, duracao, inicio = 0.4, tempo = 0.5) {
  const a = inicioItem(i, n, duracao, inicio);
  return suave(faixa(t, a, a + tempo));
}

const TEXTO_BASE = { "font-family": "'Inter', sans-serif", color: COR.texto };
export const fonteTitulo = { "font-family": "'EB Garamond', serif", "font-weight": 700, color: COR.texto };
export const fonteUi = TEXTO_BASE;

/** Cabeçalho comum (título opcional) no topo do palco. Retorna { html, altura }. */
export function cabecalho(dados, perfil, t) {
  if (!dados.titulo) return { html: "", altura: 0 };
  const p = palco(perfil);
  const u = suave(faixa(t, 0.05, 0.55));
  const html = div(
    {
      position: "absolute",
      left: `${p.x}px`,
      top: `${p.y}px`,
      width: `${p.largura}px`,
      ...fonteTitulo,
      "font-size": "64px",
      "line-height": 1.1,
      opacity: f2(u),
      transform: `translateY(${f2((1 - u) * -20)}px)`,
    },
    esc(dados.titulo)
  );
  return { html, altura: 96 };
}

/** Moldura base (fundo do palco) com o conteúdo desenhado. */
export function moldura(perfil, interno) {
  return div({ position: "absolute", left: 0, top: 0, width: `${perfil.largura}px`, height: `${perfil.altura}px`, overflow: "hidden", background: COR.fundo }, interno);
}

/** Validação simples de campos: devolve lista de mensagens. */
export function exigirTexto(erros, valor, nome, max = 90) {
  if (typeof valor !== "string" || !valor.trim()) erros.push(`'${nome}' é obrigatório (texto).`);
  else if (valor.length > max) erros.push(`'${nome}' passa de ${max} caracteres (${valor.length}).`);
}
export function textoOpcional(erros, valor, nome, max = 90) {
  if (valor !== undefined && valor !== null) exigirTexto(erros, valor, nome, max);
}
export function exigirLista(erros, lista, nome, min, max) {
  if (!Array.isArray(lista)) {
    erros.push(`'${nome}' deve ser uma lista.`);
    return false;
  }
  if (lista.length < min || lista.length > max) {
    erros.push(`'${nome}' deve ter de ${min} a ${max} itens (tem ${lista.length}).`);
    return false;
  }
  return true;
}

/** Razão de contraste WCAG entre duas cores hex (#rrggbb). */
export function contraste(fg, bg) {
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

/** Pares texto/fundo usados pelas cenas — verificados em teste (WCAG AA ≥ 4.5). */
export const PARES_CONTRASTE = [
  [COR.texto, COR.fundo],
  [COR.texto, COR.painel],
  [COR.texto, COR.painelClaro],
  [COR.sub, COR.fundo],
  [COR.sub, COR.painel],
  [COR.ciano, COR.fundo],
  [COR.ciano, COR.painel],
  [COR.ambar, COR.painel],
  [COR.ok, COR.painel],
  [COR.falha, COR.painel],
  [COR.fundo, COR.ciano],
  [COR.fundo, COR.ambar],
];
