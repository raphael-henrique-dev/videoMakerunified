# Aprendizados Técnicos e Arquiteturais (`motor-v2`)

> Este documento consolida os aprendizados de engenharia 3D, motion design 2D, pipeline de áudio e publicação automática acumulados no desenvolvimento do Motor 2.0.

---

## 1. Direção Visual 3D + 2D
- **Combinação de Camadas:** O WebGL 3D entrega profundidade espacial, iluminação volumétrica e carisma (mascote + objetos mecânicos procedurais), enquanto o HTML/CSS/SVG 2D entrega legibilidade tipográfica perfeita, métricas tabulares e chamadas técnicas (*leader lines*).
- **Projeção 3D→2D (`Motor3D.tela`):** Sempre que rotular partes de um objeto 3D, projete a coordenada 3D real da peça para coordenadas 2D da tela ou alinhe a vista explodida com linhas chamadas SVG nítidas.
- **Ritmo "Falha → Corrige":** Nunca apresente uma peça técnica apenas listando suas camadas. Mostre por que ela precisa daquela camada (ex: o fio nu quebrando, a peça superaquecendo, o impacto quebrando) antes de aplicar a solução.

---

## 2. Regras Técnicas HyperFrames + Three.js
- **Sincronização Determinística (`hf-seek` + GSAP `onUpdate`):** O renderizador do HyperFrames captura quadros buscando tempos específicos (`seek`). O palco Three.js deve responder tanto ao evento global `hf-seek` quanto ao callback `onUpdate` da timeline GSAP local do frame.
- **Isolamento de Sub-composições:** Todo arquivo em `compositions/frames/*.html` deve ter `<template>` na raiz, com `<style>` e `<script>` **dentro** do `<template>`.
- **Zona Segura de Legendas:** A legenda karaokê ocupa a faixa `y: 1300px–1460px`. Elementos 3D principais e cartões 2D não devem colidir com essa região.

---

## 3. Engenharia de Áudio
- **Cache de Narração por SHA-1:** Frases idênticas reutilizam instantaneamente o `.mp3` e `.json` em `narracao/`, garantindo consistência de timestamps por palavra e custo zero de re-geração.
- **Ducking Musical e Sonoro:** Efeitos sonoros (`sfx`) e música (`bgm`) nunca devem competir com a inteligibilidade da voz.
- **Masterização `-14 LUFS`:** O áudio final deve ser masterizado em `-14 LUFS` (`True Peak = -1.5 dB`) como faixa única de áudio, atendendo aos padrões de streaming (YouTube Shorts e TikTok).

---

## 4. Roteiro e Linguagem Narrativa
- **Linguagem Direta e Vida Real:** Conecte o tema à experiência prática das pessoas. Evite jargões científicos sem antes traduzi-los em analogias cotidianas.
- **Variação de Conectivos:** Jamais repita o mesmo conector em frases consecutivas de solução (evitar o padrão repetitivo *"Então você... Então você..."*). Varie dinamicamente: *"A solução?..."*, *"Para blindar isso, entra..."*, *"No centro de tudo..."*, *"E para aguentar o peso..."*.
- **Pontuação Expressiva para TTS:** Use exclamações, perguntas retóricas e travessões para forçar o motor de voz a modular a entonação, quebrando a cadência neutra de leitura.

---

## 5. Enquadramento e Proporção Vertical 9:16 (`FOV 42°`)
- **Câmera Three.js em 1080x1920:** Como o `PerspectiveCamera` usa FOV vertical (`42°`), o FOV horizontal efetivo em `1080x1920` é estreito (`~24,5°`). Para que elementos largos fiquem 100% visíveis sem cortar nas laterais, a distância da câmera no eixo Z deve ser **`z = 7.0 a 7.6`** (mantendo os elementos dentro de `x ∈ [-1.0, +1.0]`).
- **Ritmo de Cenas:** Frases conversadas completas duram **`6,0s a 7,2s` cada**. A estrutura ideal para vídeos de ~60s–90s é equilibrar cenas onde os elementos visuais tenham tempo suficiente para serem compreendidos.

---

## 6. Motor 2D Vetorial Puro (`motor2d.global.js`)
- **Eficiência e Velocidade:** A execução 100% SVG vetorial + GSAP reduz o tempo de renderização em mais de **2x** comparado a renderizadores 3D pesados, gerando arquivos MP4 mais leves e com nitidez perfeita.
- **Lip-Sync Silábico Universal:** O mascote consome diretamente o alinhamento extraído dos metadados de áudio, mantendo a boca perfeitamente sincronizada de forma determinística para o renderizador (`hf-seek`).
- **Aderência a Contraste WCAG AA (≥ 4.5:1):** Manter sempre contraste superior a 4.5:1 em textos sobre fundos coloridos ou escuros.

---

## 7. Arsenal de Efeitos Narrativos (Opcionais)
- **Zoom de Destaque:** Aplicado no grupo do palco (`transform-origin` no ponto de interesse), entrada de `0.5–0.7s` com `power2.inOut`. Deve focar no elemento concreto, mantendo as legendas fora do zoom.
- **Acelerar o Tempo (⏩):** Tela ondulada (`feTurbulence` + `feDisplacementMap`) + SFX `avanca.wav` para comprimir esperas repetitivas.
- **Retroceder o Tempo (⏪):** Rebobinamento visual + SFX `rebobina.wav` para voltar a um erro e reexplicar.
- **Preto e Branco (`grayscale(1)`):** Aplicado no palco por `0.6–1.5s` com SFX `errado.ogg` para marcar momentos de falha ou problema.

---

## 8. Publicação Automática (YouTube Shorts & TikTok API v2)
- **Arquitetura Modular:** A publicação é feita como camada assíncrona desacoplada (`motor/publish/`), permitindo consumo tanto via CLI quanto por APIs web (Express, Fastify, Next.js).
- **YouTube Data API v3 (Resumable):** Upload em duas etapas (iniciação de metadados + streaming binário com cabeçalho `X-Upload-Content-Type: video/mp4`).
- **TikTok API v2 (PKCE S256 Obrigatório):** O TikTok exige `code_challenge` SHA-256 Base64URL e `code_verifier`. O escopo padrão suportado é `user.info.basic,video.upload`.
- **Servidor OAuth2 Local:** Os comandos `npm run auth:youtube` e `npm run auth:tiktok` iniciam um servidor HTTP local na porta 3000 para capturar o callback e trocar tokens automaticamente.

---

## 9. Agendamento Inteligente Multi-Plataforma (`--agendar`)
- **YouTube Cloud Scheduling:** Suporta agendamento remoto nativo pelo campo `status.publishAt` (RFC 3339). A API do Google impõe que `privacyStatus` seja estritamente `"private"`. O Google torna o vídeo público no segundo programado, sem depender do computador ligado.
- **TikTok Queue e Inbox:** A API v2 do TikTok não possui agendamento remoto REST nativo. O motor resolve via:
  1. **Fila Local Persistente (`agendamentos.json`):** Executada via `npm run video:agendados` ou `npm run video:agendados -- --watch`.
  2. **Envio como Rascunho (`--inbox`):** O vídeo é transferido para o Inbox do app TikTok para agendamento direto pelo celular.
- **Parser de Datas em Linguagem Natural:** Suporta offsets relativos (`"+2h"`, `"30m"`, `"1d"`), datas coloquiais (`"amanha 18:00"`, `"sexta 19:30"`) e datas de calendário (`"2026-11-10 18:00"`).
