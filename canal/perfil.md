# Perfil do Canal — Diretrizes Editoriais & Identidade Visual

> Este arquivo define a identidade, tom de voz, estilo visual e preferências do seu canal. Ele serve como guia para você e para agentes de IA que geram roteiros e composições visuais no Motor 2.0.

---

## 1. Identidade e Propósito
- **Nome do Canal:** `[Seu Canal Aqui]` (ex: `@seucanal`)
- **Nicho / Foco:** `[Seu nicho aqui]` (ex: Curiosidades, Tecnologia, Ciência, Finanças, Negócios, Saúde).
- **Proposta de Valor:** O que o canal entrega em cada vídeo curto (ex: "Explicar a lógica por trás de coisas cotidianas usando metáforas visuais claras e ritmo envolvente").

---

## 2. Mascote e Personagem (Opcional)
- **Mascote 3D:** O motor inclui o construtor procedural `criarBoneco(THREE, opcoes)` em `motor/3d/character.js`. Você pode personalizar:
  - `corCamisa`: Hexadecimal (ex: `0x1e78d6`)
  - `corCalca`: Hexadecimal (ex: `0x26334d`)
  - `corPele`: Hexadecimal (ex: `0xffcfa8`)
  - `corCabelo`: Hexadecimal (ex: `0x2b1b12`)
  - `corSapato`: Hexadecimal (ex: `0xd93829`)
- **Papel Narrativo:** Como o mascote atua no vídeo (ex: testa hipóteses, comete erros que o vídeo corrige, comemora a solução).

---

## 3. Roteiro e Tom de Voz
- **Linguagem Prática e Direta:** Conecte o tema à experiência real do público sem jargões acadêmicos pesados.
- **Ritmo "Falha ➔ Corrige":** Mostre o problema ou quebra de expectativa nos primeiros 2 segundos, e desenvolva a solução passo a passo.
- **Assinatura / Chamada de Fechamento (CTA):** Defina como você gosta de encerrar seus vídeos (ex: *"Se você curtiu esse conteúdo, segue pra não perder o próximo!"*).

---

## 4. Sistema Visual (3D + 2D Editorial)
- **Resolução Padrão:** `1080x1920` (9:16 vertical, 30 FPS).
- **Tipografia:**
  - Títulos e Destaques: `EB Garamond` ou fonte de display da sua escolha.
  - UI / Telemetria / Legendas Karaokê: `Inter` (números tabulares `tabular-nums`).
- **Paleta de Cores do Canal:**
  - Fundo do Palco: `#050a14` a `#0c192c` (ou tom principal do seu canal)
  - Cor de Destaque / Destaque de Palavras: `#38bdf8` (Ciano / Laser)
  - Cor de Alerta / Erro: `#ef4444` (Vermelho)
  - Cor de Sucesso / Solução: `#22c55e` (Verde)

---

## 5. Padrão de Voz (ElevenLabs)
- **Voice ID:** `[SEU_VOICE_ID_AQUI]` (Configure no ElevenLabs o ID da voz desejada).
- **Modelo:** `eleven_multilingual_v2` (ou modelo da sua preferência).
- **Parâmetros Recomendados de Naturalidade:**
  - `estabilidade: 0.38` (mantém boa flexão dramática sem desafinar)
  - `similaridade: 0.80`
  - `estilo: 0.40`
  - `velocidade: 1.08`
  - `acelerar: 1.0` (sem corte forçado por `atempo`)
- **Masterização de Áudio:** O motor normaliza o som automaticamente para o padrão broadcast de **`-14 LUFS`** com *sidechain ducking* de trilha sonora e efeitos.

---

## 6. Plataformas Conectadas
- **YouTube Shorts:** Conecte executando `npm run auth:youtube`.
- **TikTok:** Conecte executando `npm run auth:tiktok`.
- **Diagnóstico em Tempo Real:** Verifique a qualquer momento com `npm run video:status`.
