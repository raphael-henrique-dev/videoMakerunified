// motor/audio/capitulos.js — Planejamento de áudio por capítulo (trilha e barramento de SFX do formato horizontal)
// Funções puras (sem ffmpeg) para serem testáveis; o pipeline aplica os planos.

export const CROSSFADE_TRILHA_S = 1.5;

/** Agrupa frames consecutivos do mesmo capítulo em intervalos [inicio, fim]. Sem capituloId → um intervalo único. */
export function intervalosCapitulos(framesMeta, duracaoTotal) {
  const intervalos = [];
  for (const fm of framesMeta) {
    const id = fm.capituloId ?? "__unico";
    const ultimo = intervalos[intervalos.length - 1];
    if (ultimo && ultimo.id === id) ultimo.fim = fm.fim;
    else intervalos.push({ id, inicio: fm.inicio, fim: fm.fim });
  }
  if (intervalos.length) {
    intervalos[0].inicio = 0;
    intervalos[intervalos.length - 1].fim = duracaoTotal;
    for (let i = 1; i < intervalos.length; i++) intervalos[i].inicio = intervalos[i - 1].fim;
  }
  return intervalos;
}

/**
 * Define qual trilha toca em cada trecho: `musica` do capítulo ou, na falta, a `trilha` única do roteiro.
 * Trechos adjacentes com a mesma trilha são fundidos (a música não reinicia). `arquivo` null = silêncio.
 */
export function planejarSegmentosTrilha(intervalos, capitulos = [], trilhaUnica = null) {
  const porId = new Map((capitulos || []).map((c) => [c.id, c]));
  const segmentos = [];
  for (const iv of intervalos) {
    const arquivo = porId.get(iv.id)?.musica || trilhaUnica || null;
    const ultimo = segmentos[segmentos.length - 1];
    if (ultimo && ultimo.arquivo === arquivo) ultimo.fim = iv.fim;
    else segmentos.push({ inicio: iv.inicio, fim: iv.fim, arquivo });
  }
  return segmentos;
}

/** Distribui os SFX agendados (tempo global `em`) pelos intervalos, com tempo relativo ao início do intervalo. */
export function agruparSonsPorIntervalo(sons, intervalos) {
  return intervalos.map((iv, i) => {
    const ultimo = i === intervalos.length - 1;
    return sons
      .filter((s) => s.em >= iv.inicio && (s.em < iv.fim || (ultimo && s.em <= iv.fim)))
      .map((s) => ({ ...s, emRelativo: Number((s.em - iv.inicio).toFixed(3)) }));
  });
}
