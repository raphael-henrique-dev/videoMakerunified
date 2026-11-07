# STORYBOARD — Por Que o Wi-Fi Cai Bem no Quarto? (2D) (`por-que-o-wifi-cai2d`)

> **Subtítulo:** Da caixinha escondida atrás da TV até o micro-ondas da cozinha: a corrida de obstáculos invisível dentro da sua casa  
> **Resolução:** 1080x1920 (30 FPS)  
> **Duração Total:** `100.88s`  
> **Voz & Ritmo:** ElevenLabs (`TX3LPaxmHKxFdv7VOQHJ`) acelerada em `1x` (~190 PPM) + Masterização `-14 LUFS` com Sidechain Ducking.

---

## Mapa de Cenas (Frames Híbridos 3D + 2D)

| # | Frame ID | Arquivo | Início | Duração | Fim | Métrica HUD |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `frame-01-bolinha-girando` | `compositions/frames/01-bolinha-girando.html` | `0.00s` | `15.92s` | `15.92s` | **SÓ 10 PASSOS** (DISTÂNCIA) |
| **02** | `frame-02-lampada-no-armario` | `compositions/frames/02-lampada-no-armario.html` | `15.92s` | `16.66s` | `32.58s` | **METADE PERDIDA** (SINAL PRESO) |
| **03** | `frame-03-espelho-e-agua` | `compositions/frames/03-espelho-e-agua.html` | `32.58s` | `17.77s` | `50.35s` | **ESPELHO + ÁGUA** (PIOR INIMIGO) |
| **04** | `frame-04-vilao-microondas` | `compositions/frames/04-vilao-microondas.html` | `50.35s` | `15.35s` | `65.70s` | **MESMO RITMO** (NA COZINHA) |
| **05** | `frame-05-engarrafamento-vizinhos` | `compositions/frames/05-engarrafamento-vizinhos.html` | `65.70s` | `17.35s` | `83.05s` | **AR CONGESTIONADO** (ÀS 21 HORAS) |
| **06** | `frame-06-raio-x-wifi` | `compositions/frames/06-raio-x-wifi.html` | `83.05s` | `17.83s` | `100.88s` | **COMO RESOLVER** (CURIORISANDO) |

---

## Detalhamento por Frame

### Frame 01 — A Bolinha Que Trava no Quarto (`0.00s` → `15.92s`)

- **Kicker Editorial:** `NOSSO DIA A DIA // A BOLINHA DA RAIVA`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Card editorial mostrando o contraste entre a internet rápida na sala e o vídeo travando na cama.
- **Áudio do Frame:** `assets/voice/frame-01.wav`
- **Narração Alinhada:**
  - **[0.12s – 7.31s | local 0.12s – 7.31s]** (M / gancho_quarto): *"Você deita na cama para ver um *vídeo,* fecha a porta do quarto e bem na melhor parte aparece aquela *bolinha* girando na tela!"*
  - **[7.43s – 15.32s | local 7.43s – 15.32s]** (PA / preguica_sinal): *"O roteador está ali na sala, você paga caro todo *mês,* mas parece que a internet tem preguiça de andar dez *passos* até você!"*

### Frame 02 — A Lâmpada Trancada na Gaveta (`15.92s` → `32.58s`)

- **Kicker Editorial:** `ERRO 01 // ESCONDER ATRÁS DA TV`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Comparativo visual entre o roteador escondido no móvel e livre no alto da estante.
- **Áudio do Frame:** `assets/voice/frame-02.wav`
- **Narração Alinhada:**
  - **[16.04s – 23.42s | local 0.12s – 7.50s]** (PA / esconder_rack): *"O primeiro erro mora na *sala:* muita gente esconde o aparelho atrás da *televisão* ou dentro do rack para não ficar feio."*
  - **[23.54s – 31.99s | local 7.62s – 16.07s]** (M / lampada_gaveta): *"Só que o Wi-Fi funciona igualzinho a uma *lâmpada:* se você tranca a luz dentro da *gaveta,* o resto da casa inteira fica no escuro!"*

### Frame 03 — Parede, Espelho e Cano d'Água (`32.58s` → `50.35s`)

- **Kicker Editorial:** `ERRO 02 // O BANHEIRO NO CAMINHO`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Cards explicando como o espelho rebate o sinal igual muro e a água dos canos engole a internet.
- **Áudio do Frame:** `assets/voice/frame-03.wav`
- **Narração Alinhada:**
  - **[32.70s – 40.35s | local 0.12s – 7.77s]** (PG / parede_tijolo): *"Para chegar no quarto, o sinal precisa atravessar a *casa,* e cada parede de tijolo no meio do caminho já rouba metade da *força.*"*
  - **[40.47s – 49.76s | local 7.89s – 17.18s]** (PA / vilao_banheiro): *"Mas o pior vilão é o *banheiro:* o espelho rebate o sinal igual bola no *muro,* e os canos cheios de água engolem o resto pelo caminho!"*

### Frame 04 — O Caminhão Buzinando na Cozinha (`50.35s` → `65.70s`)

- **Kicker Editorial:** `ERRO 03 // QUANDO ESQUENTA O PRATO`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** HUD de alerta mostrando a colisão entre o micro-ondas esquentando água e a chamada de vídeo travando na sala.
- **Áudio do Frame:** `assets/voice/frame-04.wav`
- **Narração Alinhada:**
  - **[50.47s – 56.36s | local 0.12s – 6.01s]** (M / prato_cozinha): *"Já reparou que alguém liga o *micro-ondas* na cozinha e a chamada de vídeo trava na mesma *hora* lá no sofá?"*
  - **[56.48s – 65.11s | local 6.13s – 14.76s]** (PA / caminhao_buzinando): *"Não é coincidência: ele esquenta a comida sacudindo a água no mesmo *ritmo* do Wi-Fi, igual um caminhão *buzinando* no meio da sua conversa!"*

### Frame 05 — Trânsito Travado com os Vizinhos (`65.70s` → `83.05s`)

- **Kicker Editorial:** `ERRO 04 // HORA DO PICO À NOITE`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Dois cards lado a lado mostrando o corredor único no ar e o engarrafamento quando todo mundo vê filme junto.
- **Áudio do Frame:** `assets/voice/frame-05.wav`
- **Narração Alinhada:**
  - **[65.82s – 74.83s | local 0.12s – 9.13s]** (PG / redes_vizinhos): *"E quando chega a *noite,* entra a armadilha dos vizinhos: o roteador da rua inteira tenta passar pelo mesmo *corredor* invisível no ar."*
  - **[74.95s – 82.47s | local 9.25s – 16.77s]** (PA / transito_sala): *"Com todo mundo assistindo filme ao mesmo *tempo,* o ar da sua sala vira um trânsito *travado* onde um sinal atropela o outro!"*

### Frame 06 — Por Fora e Por Dentro do Seu Wi-Fi (`83.05s` → `100.88s`)

- **Kicker Editorial:** `RAIO-X COMPLETO // 7 ETAPAS EM CASA`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** 7 chamadas técnicas SVG alinhadas aos discos 3D + cartão final de assinatura do Curiorisando.
- **Áudio do Frame:** `assets/voice/frame-06.wav`
- **Narração Alinhada:**
  - **[83.17s – 92.40s | local 0.12s – 9.35s]** (PA / por_fora_por_dentro): *"Por fora, é só uma caixinha piscando luz *verde* na estante; por dentro, é uma corrida de obstáculos desviando de espelhos, canos e *micro-ondas!*"*
  - **[92.52s – 100.09s | local 9.47s – 17.04s]** (M / fechamento_curiorisando): *"Pois é, o mundo é mais *curioso* do que parece! Se você também tinha raiva dessa bolinha girando, segue o *Curiorisando!*"*

