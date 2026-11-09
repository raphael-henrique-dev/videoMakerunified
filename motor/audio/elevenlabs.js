// motor/audio/elevenlabs.js — Utilitários de resiliência para chamadas de TTS (retry/backoff e concorrência limitada)

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/** Converte o header Retry-After (segundos ou data HTTP) em milissegundos; null se ausente/inválido. */
export function interpretarRetryAfter(valor, agora = Date.now()) {
  if (valor === undefined || valor === null || valor === "") return null;
  const seg = Number(valor);
  if (Number.isFinite(seg)) return Math.max(0, seg * 1000);
  const data = Date.parse(valor);
  return Number.isNaN(data) ? null : Math.max(0, data - agora);
}

/**
 * fetch com retry e backoff exponencial em 429/5xx e erros de rede.
 * Respeita Retry-After. Outros status 4xx falham imediatamente.
 * @param {Function} fetchFn
 * @param {string} url
 * @param {object} init
 * @param {{tentativas?:number, baseMs?:number, maxMs?:number, dormir?:Function, log?:Function}} [opcoes]
 */
export async function fetchComRetry(fetchFn, url, init, opcoes = {}) {
  const { tentativas = 5, baseMs = 1000, maxMs = 30000, dormir = esperar, log = () => {} } = opcoes;
  let ultimoErro;
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    let espera = Math.min(maxMs, baseMs * 2 ** (tentativa - 1));
    try {
      const res = await fetchFn(url, init);
      if (res.ok) return res;
      const corpo = await res.text();
      ultimoErro = new Error(`Erro ElevenLabs (${res.status}): ${corpo}`);
      const retentavel = res.status === 429 || res.status >= 500;
      if (!retentavel) throw Object.assign(ultimoErro, { fatal: true });
      const ra = interpretarRetryAfter(res.headers?.get?.("retry-after"));
      if (ra !== null) espera = Math.min(maxMs, Math.max(espera, ra));
    } catch (err) {
      if (err.fatal) throw err;
      ultimoErro = err;
    }
    if (tentativa < tentativas) {
      log(`[audio] ${ultimoErro.message} — nova tentativa ${tentativa + 1}/${tentativas} em ${(espera / 1000).toFixed(1)}s`);
      await dormir(espera);
    }
  }
  throw ultimoErro;
}

/** Executa `fn(item, indice)` com no máximo `limite` tarefas simultâneas, devolvendo resultados na ordem original. */
export async function mapComConcorrencia(itens, limite, fn) {
  const resultados = new Array(itens.length);
  let proximo = 0;
  async function trabalhador() {
    while (true) {
      const i = proximo++;
      if (i >= itens.length) return;
      resultados[i] = await fn(itens[i], i);
    }
  }
  const n = Math.max(1, Math.min(limite, itens.length));
  await Promise.all(Array.from({ length: n }, trabalhador));
  return resultados;
}
