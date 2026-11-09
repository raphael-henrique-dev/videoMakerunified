// motor/2d/transicoes.js — Transições entre frames: flash, fade, wipe, push e zoom
//
// Funções puras que devolvem a lista de "tweens" GSAP (dados) de cada transição; o gerador do index.html
// emite o código a partir dela. `flash` é o overlay original do formato curto (tratado à parte pelo gerador).
// Os clips são sequenciais (sem sobreposição): a saída anima no fim do clip anterior e a entrada no início do próximo.

export const TRANSICOES = ["flash", "fade", "wipe", "push", "zoom"];
export const DURACAO_PADRAO = 0.5;

const arred = (n) => Math.round(n * 1000) / 1000;

/**
 * @param {string} nome
 * @param {{tCorte:number, idSaida:string, idEntrada:string, duracao?:number, largura:number}} p
 * @returns {Array<{tipo:"set"|"to"|"fromTo", alvo:string, de?:object, para:object, em:number}>}
 */
export function planejarTransicao(nome, { tCorte, idSaida, idEntrada, duracao = DURACAO_PADRAO, largura }) {
  if (!TRANSICOES.includes(nome)) throw new Error(`Transição desconhecida: '${nome}'. Use: ${TRANSICOES.join(", ")}.`);
  if (nome === "flash") return [];
  const meia = duracao / 2;
  const saida = `#${idSaida}`;
  const entrada = `#${idEntrada}`;
  const ini = Math.max(0, tCorte - meia);
  const tweens = [];
  const para = (obj, dur, ease) => ({ ...obj, duration: arred(dur), ease });

  if (nome === "fade") {
    tweens.push({ tipo: "to", alvo: saida, para: para({ opacity: 0 }, meia, "power1.in"), em: arred(ini) });
    tweens.push({ tipo: "fromTo", alvo: entrada, de: { opacity: 0 }, para: para({ opacity: 1 }, meia, "power1.out"), em: arred(tCorte) });
  } else if (nome === "wipe") {
    tweens.push({ tipo: "fromTo", alvo: entrada, de: { clipPath: "inset(0% 100% 0% 0%)" }, para: para({ clipPath: "inset(0% 0% 0% 0%)" }, duracao, "power2.inOut"), em: arred(tCorte) });
  } else if (nome === "push") {
    tweens.push({ tipo: "to", alvo: saida, para: para({ x: -largura }, meia, "power3.in"), em: arred(ini) });
    tweens.push({ tipo: "fromTo", alvo: entrada, de: { x: largura }, para: para({ x: 0 }, meia, "power3.out"), em: arred(tCorte) });
  } else if (nome === "zoom") {
    tweens.push({ tipo: "to", alvo: saida, para: para({ scale: 1.12, opacity: 0, transformOrigin: "50% 50%" }, meia, "power2.in"), em: arred(ini) });
    tweens.push({ tipo: "fromTo", alvo: entrada, de: { scale: 0.9, opacity: 0, transformOrigin: "50% 50%" }, para: para({ scale: 1, opacity: 1 }, meia, "power2.out"), em: arred(tCorte) });
  }
  return tweens;
}

/** Estado neutro dos clips (restaura o que as transições alteraram quando a timeline volta no tempo). */
export function resetarClips(ids) {
  return ids.map((id) => ({ tipo: "set", alvo: `#${id}`, para: { opacity: 1, x: 0, scale: 1, clipPath: "none" }, em: 0 }));
}

/** Converte tweens em código JS de timeline GSAP (`tl` já declarada). */
export function emitirTweensJs(tweens, variavel = "tl") {
  return tweens
    .map((tw) => {
      const alvo = JSON.stringify(tw.alvo);
      if (tw.tipo === "set") return `${variavel}.set(${alvo}, ${JSON.stringify(tw.para)}, ${tw.em});`;
      if (tw.tipo === "to") return `${variavel}.to(${alvo}, ${JSON.stringify(tw.para)}, ${tw.em});`;
      return `${variavel}.fromTo(${alvo}, ${JSON.stringify(tw.de)}, ${JSON.stringify(tw.para)}, ${tw.em});`;
    })
    .join("\n    ");
}

/**
 * Escolhe a transição do corte para `frame`: respeita `frame.transicao`; sem ela, o curto usa sempre flash e
 * o horizontal alterna fade/wipe/push dentro do capítulo e usa zoom na troca de capítulo.
 */
export function escolherTransicao(perfil, frame, anterior, indiceCorte = 0) {
  const permitidas = perfil.transicoes || ["flash"];
  if (frame?.transicao) return permitidas.includes(frame.transicao) ? frame.transicao : permitidas[0];
  if (permitidas.length === 1) return permitidas[0];
  if (anterior && frame && anterior.capituloId !== frame.capituloId) return "zoom";
  const ciclo = ["fade", "wipe", "push"].filter((n) => permitidas.includes(n));
  return ciclo.length ? ciclo[indiceCorte % ciclo.length] : permitidas[0];
}
