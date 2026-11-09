// motor/audio/loudnorm.js — loudnorm em 2 passadas (medir e aplicar com os valores medidos)

export const ALVO_LUFS = -14;
export const ALVO_TP = -1.5;
export const ALVO_LRA = 11;

/** Extrai o bloco JSON que o filtro loudnorm imprime no stderr do ffmpeg. */
export function parsearMedicaoLoudnorm(stderr) {
  const blocos = [...String(stderr).matchAll(/\{[^{}]*"input_i"[^{}]*\}/g)];
  if (!blocos.length) throw new Error("Medição loudnorm não encontrada na saída do ffmpeg.");
  const j = JSON.parse(blocos[blocos.length - 1][0]);
  return {
    input_i: Number(j.input_i),
    input_tp: Number(j.input_tp),
    input_lra: Number(j.input_lra),
    input_thresh: Number(j.input_thresh),
    target_offset: Number(j.target_offset),
  };
}

export const filtroMedicaoLoudnorm = () => `loudnorm=I=${ALVO_LUFS}:TP=${ALVO_TP}:LRA=${ALVO_LRA}:print_format=json`;

/** Filtro da 2ª passada com os valores medidos e linear=true (ganho constante, sem compressão dinâmica). */
export function filtroAplicacaoLoudnorm(m) {
  return (
    `loudnorm=I=${ALVO_LUFS}:TP=${ALVO_TP}:LRA=${ALVO_LRA}` +
    `:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}` +
    `:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=summary`
  );
}
