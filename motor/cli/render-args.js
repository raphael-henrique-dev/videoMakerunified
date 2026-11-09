// motor/cli/render-args.js — Argumentos do `hyperframes render` a partir do perfil de formato
// Flags confirmadas com `npx hyperframes@0.8.177 render --help`:
//   --quality, --crf, --fps, --resolution, --workers, --low-memory-mode, --resume (+ env HF_SEGMENTED_CAPTURE=true)

/**
 * @param {object} perfil perfil de motor/formato.js
 * @param {string[]} extras flags do usuário: --4k, --workers=N, --low-memory, --resume, --crf=N, --quality=X
 * @returns {{args: string[], env: object, avisos: string[]}}
 */
export function montarArgsRender(perfil, extras = []) {
  const avisos = [];
  const valor = (nome) => extras.find((a) => a.startsWith(`--${nome}=`))?.split("=")[1];
  const tem = (nome) => extras.includes(`--${nome}`);
  const r = perfil.render || {};

  const quality = valor("quality") || r.quality;
  const crf = valor("crf") || r.crf;
  const args = ["--quality", String(quality), "--crf", String(crf), "--fps", String(r.fps ?? perfil.fps)];
  const env = {};

  if (tem("4k")) {
    if (r.resolucao4k) args.push("--resolution", r.resolucao4k);
    else avisos.push(`--4k só é suportado no formato horizontal; ignorado no formato ${perfil.id}.`);
  }
  if (perfil.id === "horizontal") {
    const workers = valor("workers");
    if (workers) args.push("--workers", workers);
    if (tem("low-memory")) args.push("--low-memory-mode");
    if (tem("resume")) {
      args.push("--resume");
      env.HF_SEGMENTED_CAPTURE = "true";
    }
  } else if (valor("workers") || tem("low-memory") || tem("resume")) {
    avisos.push("--workers, --low-memory e --resume só se aplicam ao formato horizontal; ignorados.");
  }
  return { args, env, avisos };
}
