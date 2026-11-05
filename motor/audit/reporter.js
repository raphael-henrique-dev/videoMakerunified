// motor/audit/reporter.js — Formatador de Relatório Markdown da Auditoria Visual (Motor 2.0)

import fs from "node:fs";
import path from "node:path";

/**
 * Gera relatório Markdown completo a partir dos resultados dos Tier 1 e Tier 2.
 *
 * @param {object} dados
 * @returns {string} Conteúdo em Markdown
 */
export function formatarRelatorioMarkdown(dados) {
  const {
    slug,
    titulo = slug,
    aprovado,
    notaFinal,
    tier1,
    tier2,
    pranchas,
    duracaoTotalMs = 0,
    timestampISO = new Date().toISOString(),
  } = dados;

  const badgeStatus = aprovado
    ? "🟢 **APROVADO**"
    : tier1?.resumo?.criticos > 0
    ? "🔴 **REPROVADO (Falha Crítica)**"
    : "🟡 **ALERTA (Ajustes Recomendados)**";

  const vlmInfo = tier2?.ativo
    ? `**${tier2.provedorNome}** (\`${tier2.modelo}\`) — Nota VLM: **${tier2.nota_geral?.toFixed(1)}/10**`
    : `*Tier 2 VLM Inativo (Modo Determinístico Local)*`;

  let md = `# Relatório de Auditoria Visual por Visão Computacional — Motor 2.0

| Metadado | Detalhe |
| :--- | :--- |
| **Projeto / Vídeo** | \`${slug}\` — *${titulo}* |
| **Status Final** | ${badgeStatus} |
| **Nota Geral Consolidada** | **${notaFinal.toFixed(1)} / 10** |
| **Data / Hora** | \`${timestampISO}\` |
| **Tempo de Execução** | \`${(duracaoTotalMs / 1000).toFixed(2)}s\` |
| **Motor de Imagem Local** | \`${tier1?.motor || "auto"}\` (${tier1?.duracaoMs || 0}ms) |
| **Crítico Semântico VLM** | ${vlmInfo} |

---

## 1. Prancha de Contato Anotada (Safe-Zones 9:16)

> [!NOTE]
> A prancha abaixo exibe a amostra central de cada cena do vídeo com a sobreposição das safe-zones verticais do TikTok, YouTube Shorts e Reels:
> - 🟧 **Topo (0-160px):** Área de abas e busca do app.
> - 🟥 **Rodapé (1540-1920px):** Área de legendas nativas, nome do canal e som.
> - 🟪 **Lateral Direita (940-1080px):** Coluna de ações (curtir, comentar, compartilhar).

${
  pranchas?.humana
    ? `![Prancha de Contato Anotada](${path.basename(pranchas.humana)})\n\n*(Arquivo em: \`${pranchas.humana}\`)*`
    : "*Prancha anotada não disponível.*"
}

---

## 2. Inspeção Técnica Determinística (Tier 1 Local)

- **Alertas Críticos:** \`${tier1?.resumo?.criticos || 0}\`
- **Alertas de Nível Alto:** \`${tier1?.resumo?.altos || 0}\`
- **Alertas de Nível Médio:** \`${tier1?.resumo?.medios || 0}\`
- **Nota Base Tier 1:** \`${tier1?.resumo?.nota?.toFixed(1) || 10}/10\`

### Tabela de Cenas Auditadas

| Cena / Frame | Tempo | Luminância (Média / p95) | Violações de Safe-Zone | Status Movimento | Diagnóstico |
| :--- | :---: | :---: | :---: | :---: | :--- |
`;

  for (const cena of tier1?.cenas || []) {
    const amostraCentral = cena.amostras[Math.floor(cena.amostras.length / 2)] || {};
    const lum = amostraCentral.metricas?.luminancia || {};
    const zonas = amostraCentral.zonasVioladas?.length
      ? amostraCentral.zonasVioladas.map((z) => `\`${z}\``).join(", ")
      : "✅ Nenhuma";

    const movDeltas = cena.diferencasMovimento?.length
      ? `Δ ${cena.diferencasMovimento.join(", ")}`
      : "Amostra única";

    const alertasFormatados = cena.alertas?.length
      ? cena.alertas
          .map((a) => {
            const icone = a.severidade === "critico" ? "🔴" : a.severidade === "alto" ? "🟠" : "🟡";
            return `${icone} **${a.codigo}**: ${a.mensagem}`;
          })
          .join("<br>")
      : "✅ Conforme";

    md += `| \`${cena.id}\` | \`${amostraCentral.tempo?.toFixed(2)}s\` | \`${lum.media || 0} / ${lum.p95 || 0}\` | ${zonas} | \`${movDeltas}\` | ${alertasFormatados} |\n`;
  }

  md += `\n---\n\n## 3. Avaliação Estética e Semântica (Tier 2 VLM)\n\n`;

  if (tier2?.ativo) {
    md += `> **Resumo do Diretor de Arte & QA:**\n> ${tier2.resumo_critico}\n\n`;

    if (tier2.cenas?.length) {
      md += `### Notas e Crítica por Cena\n\n`;
      md += `| # | Cena / Frame | Nota | Enquadramento | Iluminação | Legibilidade | Problemas Identificados |\n`;
      md += `| :---: | :--- | :---: | :---: | :---: | :---: | :--- |\n`;

      for (const c of tier2.cenas) {
        const probs = c.problemas?.length ? c.problemas.join("; ") : "Nenhum problema";
        md += `| ${c.indice || "-"} | \`${c.identificador || "cena"}\` | **${c.nota?.toFixed(1) || "-"}** | \`${c.enquadramento || "ok"}\` | \`${c.iluminacao || "ok"}\` | \`${c.legibilidade || "ok"}\` | ${probs} |\n`;
      }
    }
  } else {
    md += `*O Tier 2 não foi executado nesta sessão (${tier2?.aviso || "modo rápido ou sem chave de API"}).*\n`;
  }

  // Seção 4: Plano de Ações Corretivas (Actionable Code Fixes)
  md += `\n---\n\n## 4. Plano de Ações Corretivas (Self-Healing)\n\n`;

  const correcoes = [];

  // Correções originadas do Tier 1
  for (const cena of tier1?.cenas || []) {
    for (const al of cena.alertas || []) {
      if (al.codigo === "SAFE_ZONE_VIOLATION") {
        correcoes.push({
          origem: "Tier 1 (Safe-Zone)",
          cena: cena.id,
          alvo: `Zona ${al.zona}`,
          acao: `Mover elementos gráficos/texto para longe da margem ${al.zona} (topo < 160px ou rodapé > 1540px).`,
          codigo: al.zona === "rodape" ? "/* Elevar card/legenda */\nbottom: 420px; /* ou top: 1300px */" : null,
        });
      } else if (al.codigo === "BLACKOUT" || al.codigo === "UNDEREXPOSED") {
        correcoes.push({
          origem: "Tier 1 (Luz)",
          cena: cena.id,
          alvo: "Three.js / Iluminação",
          acao: "Aumentar a intensidade da luz ambiente e direcional.",
          codigo: "ambientLight.intensity = 0.85;\ndirectionalLight.intensity = 1.2;",
        });
      } else if (al.codigo === "ANIMATION_FREEZE") {
        correcoes.push({
          origem: "Tier 1 (Movimento)",
          cena: cena.id,
          alvo: "Timeline / Loop",
          acao: "Verificar se a timeline GSAP/HyperFrames está montada e com 'window.__timelines' registrado.",
          codigo: "window.__timelines['frame-id'] = tl;",
        });
      }
    }
  }

  // Correções sugeridas pelo VLM Tier 2
  if (tier2?.cenas?.length) {
    for (const c of tier2.cenas) {
      for (const s of c.sugestoes_correcao || []) {
        correcoes.push({
          origem: `Tier 2 (${tier2.provedorNome})`,
          cena: c.identificador || `Cena #${c.indice}`,
          alvo: s.alvo || "Composição",
          acao: s.acao,
          codigo: s.codigo_sugerido,
        });
      }
    }
  }

  if (correcoes.length === 0) {
    md += `✅ **Nenhuma correção necessária!** O vídeo cumpre todos os critérios técnicos de safe-zone, iluminação, contraste e estabilidade.\n`;
  } else {
    md += `Foram identificadas as seguintes correções para aplicar:\n\n`;
    correcoes.forEach((cor, idx) => {
      md += `### ${idx + 1}. [${cor.origem}] em \`${cor.cena}\` (${cor.alvo})\n`;
      md += `- **Ação:** ${cor.acao}\n`;
      if (cor.codigo) {
        md += `\`\`\`javascript\n${cor.codigo}\n\`\`\`\n`;
      }
      md += `\n`;
    });
  }

  return md;
}

/**
 * Salva o relatório Markdown no diretório de auditoria do vídeo.
 */
export function salvarRelatorio(dirAuditoria, relatorioMd, slug) {
  fs.mkdirSync(dirAuditoria, { recursive: true });
  const caminhoMd = path.join(dirAuditoria, "AUDITORIA_VISUAL.md");
  fs.writeFileSync(caminhoMd, relatorioMd, "utf8");
  return caminhoMd;
}
