// motor/publish/scheduler.js — Sistema Inteligente de Agendamento de Publicações (YouTube & TikTok)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { ROOT } from "./env-helper.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const AGENDAMENTOS_FILE = path.join(__dirname, "agendamentos.json");

/**
 * Converte strings naturais ou datas relativas em timestamp ISO 8601 futuro.
 * 
 * Exemplos suportados:
 *  - Relativos: "+2h", "3h", "30m", "45min", "1d", "2dias", "2h30m"
 *  - Naturais: "hoje 18:00", "hoje às 20h", "amanha 19:30", "depois de amanhã 15:00"
 *  - Dias da semana: "segunda 18:00", "terca 20:00", "sexta 12:00" (se já passou nesta semana, avança para a próxima)
 *  - Datas explícitas: "06/11/2026 19:00", "2026-11-06 18:30", "2026-11-06T18:30:00Z"
 * 
 * @param {string|Date} input 
 * @returns {string} Timestamp ISO 8601 no formato UTC
 */
export function interpretarDataAgendamento(input) {
  if (!input) {
    throw new Error("Data de agendamento não fornecida.");
  }

  if (input instanceof Date) {
    if (isNaN(input.getTime())) throw new Error("Objeto Date inválido fornecido para agendamento.");
    if (input.getTime() <= Date.now()) {
      throw new Error(`A data informada (${input.toLocaleString("pt-BR")}) já passou. Escolha um horário futuro.`);
    }
    return input.toISOString();
  }

  if (typeof input !== "string") {
    throw new Error(`Tipo inválido para data de agendamento: ${typeof input}`);
  }

  const str = input.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const agora = new Date();

  // 1. Relativo simples: "+2h", "2h", "30m", "1d", "2h30m", "45min"
  const relRegex = /^\+?(\d+)\s*(h|m|min|d|hora|horas|minuto|minutos|dia|dias)(?:\s*(\d+)\s*(m|min|minutos))?$/i;
  const matchRel = str.match(relRegex);
  if (matchRel) {
    const val1 = parseInt(matchRel[1], 10);
    const unit1 = matchRel[2];
    const val2 = matchRel[3] ? parseInt(matchRel[3], 10) : 0;

    let ms = 0;
    if (unit1.startsWith("h")) ms += val1 * 3600 * 1000;
    else if (unit1.startsWith("m")) ms += val1 * 60 * 1000;
    else if (unit1.startsWith("d")) ms += val1 * 86400 * 1000;

    if (val2 > 0) ms += val2 * 60 * 1000;

    if (ms <= 0) {
      throw new Error("O deslocamento de tempo relativo deve ser maior que zero.");
    }

    return new Date(agora.getTime() + ms).toISOString();
  }

  // 2. Dias da semana (segunda, terca, quarta, quinta, sexta, sabado, domingo)
  const diasSemana = {
    domingo: 0,
    segunda: 1,
    terca: 2,
    quarta: 3,
    quinta: 4,
    sexta: 5,
    sabado: 6,
  };

  const timeRegex = /(\d{1,2})[:h](\d{2})?/;
  const matchHora = str.match(timeRegex);

  for (const [nomeDia, numDia] of Object.entries(diasSemana)) {
    if (str.startsWith(nomeDia)) {
      if (!matchHora) {
        throw new Error(`Especifique o horário para ${nomeDia}. Exemplo: "${nomeDia} 18:00" ou "${nomeDia} 20h".`);
      }
      const horas = parseInt(matchHora[1], 10);
      const minutos = matchHora[2] ? parseInt(matchHora[2], 10) : 0;

      const data = new Date(agora);
      const diaAtual = agora.getDay();
      let diffDias = numDia - diaAtual;

      // Se for o mesmo dia da semana
      if (diffDias === 0) {
        data.setHours(horas, minutos, 0, 0);
        if (data.getTime() <= agora.getTime()) {
          diffDias = 7; // horário de hoje já passou, pula para a semana que vem
        }
      } else if (diffDias < 0) {
        diffDias += 7; // já passou nesta semana, avança para a próxima
      }

      data.setDate(data.getDate() + diffDias);
      data.setHours(horas, minutos, 0, 0);
      return data.toISOString();
    }
  }

  // 3. "hoje", "amanha", "depois de amanha"
  if (str.includes("hoje") || str.includes("amanha")) {
    if (!matchHora) {
      throw new Error(`Horário não especificado. Exemplo: "amanha 18:00" ou "hoje 20:30".`);
    }
    const horas = parseInt(matchHora[1], 10);
    const minutos = matchHora[2] ? parseInt(matchHora[2], 10) : 0;

    const data = new Date(agora);
    if (str.includes("depois de amanha")) {
      data.setDate(data.getDate() + 2);
    } else if (str.includes("amanha")) {
      data.setDate(data.getDate() + 1);
    }
    data.setHours(horas, minutos, 0, 0);

    if (data.getTime() <= agora.getTime()) {
      if (str.includes("hoje")) {
        throw new Error(`O horário ${horas}:${minutos.toString().padStart(2, "0")} de hoje já passou.`);
      }
    }
    return data.toISOString();
  }

  // 4. Formato DD/MM/AAAA HH:mm ou DD/MM HH:mm
  const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(\d{1,2})[:h](\d{2})?/);
  if (ddmmyyyy) {
    const dia = parseInt(ddmmyyyy[1], 10);
    const mes = parseInt(ddmmyyyy[2], 10) - 1;
    let ano = ddmmyyyy[3] ? parseInt(ddmmyyyy[3], 10) : agora.getFullYear();
    if (ano < 100) ano += 2000;
    const hora = parseInt(ddmmyyyy[4], 10);
    const min = ddmmyyyy[5] ? parseInt(ddmmyyyy[5], 10) : 0;
    const data = new Date(ano, mes, dia, hora, min, 0, 0);
    if (isNaN(data.getTime())) {
      throw new Error(`Data inválida: "${input}".`);
    }
    if (data.getTime() <= agora.getTime()) {
      throw new Error(`A data informada (${data.toLocaleString("pt-BR")}) já passou.`);
    }
    return data.toISOString();
  }

  // 5. ISO Date ou YYYY-MM-DD HH:mm
  const parsed = new Date(str.replace(" ", "T"));
  if (!isNaN(parsed.getTime())) {
    if (parsed.getTime() <= agora.getTime()) {
      throw new Error(`A data informada (${parsed.toLocaleString("pt-BR")}) já passou. Escolha uma data futura.`);
    }
    return parsed.toISOString();
  }

  throw new Error(
    `Formato de data não reconhecido: "${input}".\n` +
      `Exemplos válidos:\n` +
      `  • Relativos: "+2h", "30m", "1d", "2h30m"\n` +
      `  • Naturais: "amanha 18:00", "hoje 22:30", "sexta 19:00"\n` +
      `  • Calendário: "10/11/2026 18:00" ou "2026-11-10 18:00"`
  );
}

/**
 * Lê todos os agendamentos registrados no arquivo JSON.
 * @returns {Array<object>}
 */
export function carregarAgendamentos() {
  if (!fs.existsSync(AGENDAMENTOS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(AGENDAMENTOS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Salva a lista de agendamentos no arquivo JSON.
 * @param {Array<object>} lista 
 */
export function salvarListaAgendamentos(lista) {
  fs.writeFileSync(AGENDAMENTOS_FILE, JSON.stringify(lista, null, 2), "utf8");
}

/**
 * Registra um novo agendamento no sistema.
 * 
 * @param {string} slug - Slug do vídeo
 * @param {string} dataISO - Data ISO 8601 futura
 * @param {object} opcoes - { plataformas: ['youtube', 'tiktok'], public?: boolean, unlisted?: boolean }
 * @returns {object} Registro criado
 */
export function salvarAgendamento(slug, dataISO, opcoes = {}) {
  const lista = carregarAgendamentos();
  const id = `agend_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

  const novoItem = {
    id,
    slug,
    data_agendada: dataISO,
    criado_em: new Date().toISOString(),
    plataformas: opcoes.plataformas || (opcoes.tiktok ? ["tiktok"] : opcoes.youtube ? ["youtube"] : ["youtube", "tiktok"]),
    opcoes: {
      public: Boolean(opcoes.public),
      unlisted: Boolean(opcoes.unlisted),
      tiktokInbox: Boolean(opcoes.tiktokInbox),
    },
    status: "pendente",
    tentativas: 0,
    historico: [],
  };

  lista.push(novoItem);
  salvarListaAgendamentos(lista);

  return novoItem;
}

/**
 * Cancela ou remove um agendamento existente pelo ID ou pelo slug.
 * @param {string} idOuSlug 
 */
export function cancelarAgendamento(idOuSlug) {
  const lista = carregarAgendamentos();
  const index = lista.findIndex((item) => item.id === idOuSlug || item.slug === idOuSlug);

  if (index === -1) {
    return { sucesso: false, mensagem: `Nenhum agendamento encontrado para: ${idOuSlug}` };
  }

  const removido = lista.splice(index, 1)[0];
  salvarListaAgendamentos(lista);

  return { sucesso: true, removido };
}

/**
 * Exibe no terminal a lista de agendamentos cadastrados.
 */
export function listarAgendamentos() {
  const lista = carregarAgendamentos();
  console.log(`\n========================================================`);
  console.log(`   ⏰ FILA DE AGENDAMENTOS // MOTOR 2.0 (${lista.length})`);
  console.log(`========================================================\n`);

  if (lista.length === 0) {
    console.log("  Nenhum agendamento pendente no momento.");
    console.log("  Para agendar um vídeo, use:");
    console.log('    npm run video:upload -- <slug> --agendar "amanha 18:00"\n');
    return lista;
  }

  const agora = Date.now();
  lista.sort((a, b) => new Date(a.data_agendada) - new Date(b.data_agendada));

  lista.forEach((item, idx) => {
    const dataAlvo = new Date(item.data_agendada);
    const diffMin = Math.round((dataAlvo.getTime() - agora) / 60000);
    const tempoRelativo =
      diffMin > 0
        ? `em ${diffMin > 60 ? `${(diffMin / 60).toFixed(1)}h` : `${diffMin}min`}`
        : `VENCIDO há ${Math.abs(diffMin)}min`;

    const iconStatus =
      item.status === "concluido" ? "✅" : item.status === "falhou" ? "❌" : diffMin <= 0 ? "⚡" : "⏳";

    console.log(`  ${idx + 1}. [${item.id}]`);
    console.log(`     Slug:        ${item.slug}`);
    console.log(`     Data Alvo:   ${dataAlvo.toLocaleString("pt-BR")} (${tempoRelativo})`);
    console.log(`     Plataformas: ${item.plataformas.join(", ")}`);
    console.log(`     Status:      ${iconStatus} ${item.status.toUpperCase()}`);
    if (item.ultimo_erro) {
      console.log(`     Erro:        ${item.ultimo_erro}`);
    }
    console.log("");
  });

  return lista;
}

/**
 * Executa publicações pendentes cuja data já tenha chegado.
 * @param {object} param0 
 */
export async function executarAgendamentosPendentes({ force = false } = {}) {
  const lista = carregarAgendamentos();
  const agora = Date.now();
  let processados = 0;

  for (const item of lista) {
    if (item.status === "concluido") continue;

    const timestampAlvo = new Date(item.data_agendada).getTime();
    const jaPassou = timestampAlvo <= agora;

    if (jaPassou || force) {
      console.log(`\n🚀 [Agendador] Executando publicação agendada: ${item.slug} (${item.id})...`);
      processados++;
      item.tentativas = (item.tentativas || 0) + 1;

      try {
        const { publicarVideo } = await import("./uploader.js");
        const opcoesExec = {
          youtube: item.plataformas.includes("youtube"),
          tiktok: item.plataformas.includes("tiktok"),
          public: item.opcoes.public,
          unlisted: item.opcoes.unlisted,
          // Evita loop recursivo de agendamento na execução da fila
          _execucaoFila: true,
        };

        const res = await publicarVideo(item.slug, opcoesExec);
        item.status = "concluido";
        item.concluido_em = new Date().toISOString();
        item.resultado = res;
        console.log(`✅ [Agendador] Agendamento ${item.id} concluído com sucesso!`);
      } catch (err) {
        console.error(`❌ [Agendador] Erro no agendamento ${item.id}: ${err.message}`);
        item.status = item.tentativas >= 3 ? "falhou" : "pendente";
        item.ultimo_erro = err.message;
      }

      salvarListaAgendamentos(lista);
    }
  }

  if (processados === 0) {
    console.log("ℹ️ [Agendador] Nenhum agendamento com horário atingido no momento.");
  }
}

/**
 * Inicia monitoramento contínuo em segundo plano (watcher).
 */
export function iniciarWatcher(intervaloSegundos = 60) {
  console.log(`\n👀 [Agendador] Iniciando monitoramento a cada ${intervaloSegundos}s...`);
  console.log(`Pressione Ctrl+C para encerrar.\n`);

  executarAgendamentosPendentes().catch(console.error);

  setInterval(() => {
    executarAgendamentosPendentes().catch(console.error);
  }, intervaloSegundos * 1000);
}

// Execução via CLI direta (node motor/publish/scheduler.js)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes("--watch") || args.includes("-w")) {
    iniciarWatcher(60);
  } else if (args.includes("--run") || args.includes("--exec")) {
    await executarAgendamentosPendentes({ force: args.includes("--force") });
  } else if (args.includes("--cancel")) {
    const idx = args.indexOf("--cancel");
    const alvo = args[idx + 1];
    if (!alvo) {
      console.error("Uso: node scheduler.js --cancel <id-ou-slug>");
      process.exit(1);
    }
    const res = cancelarAgendamento(alvo);
    console.log(res.sucesso ? `✅ Cancelado: ${res.removido.slug} (${res.removido.id})` : `❌ ${res.mensagem}`);
  } else {
    listarAgendamentos();
    await executarAgendamentosPendentes();
  }
}
