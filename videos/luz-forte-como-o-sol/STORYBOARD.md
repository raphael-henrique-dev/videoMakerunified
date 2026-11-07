# STORYBOARD — E Se a Luz Fosse Tão Forte Quanto o Sol? (`luz-forte-como-o-sol`)

> **Subtítulo:** A engenharia de recriar a luz do sol numa sala: a lupa gigante, o metal que derrete, os 192 lasers e a mini-estrela de laboratório  
> **Resolução:** 1080x1920 (30 FPS)  
> **Duração Total:** `109.88s`  
> **Voz & Ritmo:** ElevenLabs (`TX3LPaxmHKxFdv7VOQHJ`) acelerada em `1x` (~190 PPM) + Masterização `-14 LUFS` com Sidechain Ducking.

---

## Mapa de Cenas (Frames Híbridos 3D + 2D)

| # | Frame ID | Arquivo | Início | Duração | Fim | Métrica HUD |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `frame-01-lupa` | `compositions/frames/01-lupa.html` | `0.00s` | `15.45s` | `15.45s` | **1.000 W/m²** (LUZ DO SOL NA TERRA) |
| **02** | `frame-02-escala` | `compositions/frames/02-escala.html` | `15.45s` | `22.37s` | `37.82s` | **CENTENAS DE SÓIS** (CONCENTRAÇÃO DE LUZ) |
| **03** | `frame-03-falha` | `compositions/frames/03-falha.html` | `37.82s` | `17.26s` | `55.08s` | **5.500 °C** (SUPERFÍCIE DO SOL) |
| **04** | `frame-04-lasers` | `compositions/frames/04-lasers.html` | `55.08s` | `21.07s` | `76.15s` | **192 FEIXES** (ALVO MINÚSCULO) |
| **05** | `frame-05-conta` | `compositions/frames/05-conta.html` | `76.15s` | `19.54s` | `95.69s` | **1,5x** (GANHO DE FUSÃO) |
| **06** | `frame-06-fechamento` | `compositions/frames/06-fechamento.html` | `95.69s` | `14.19s` | `109.88s` | **100%** (CURIOSIDADE) |

---

## Detalhamento por Frame

### Frame 01 — A Lupa no Quintal (`0.00s` → `15.45s`)

- **Kicker Editorial:** `EXPERIMENTO // A LUPA NO QUINTAL`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Sol alto no céu, lupa gigante concentrando raios num ponto só e uma folha que começa a fumegar no quintal.
- **Áudio do Frame:** `assets/voice/frame-01.wav`
- **Narração Alinhada:**
  - **[0.12s – 5.41s | local 0.12s – 5.41s]** (PA / gancho_lupa): *"E se a gente conseguisse acender uma *luz* tão forte quanto o sol... dentro de uma *sala?*"*
  - **[5.53s – 14.81s | local 5.53s – 14.81s]** (M / lupa_folha): *"No quintal, uma lupa simples já *torra* uma folha em segundos. Agora imagina juntar a luz de *um milhão* de lupas num ponto só."*

### Frame 02 — O Sol Entrega Mil Watts por Metro (`15.45s` → `37.82s`)

- **Kicker Editorial:** `ESCALA // POTÊNCIA DO SOL`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Campo de espelhos heliostatos refletindo raios para uma torre receptora que brilha no centro do palco.
- **Áudio do Frame:** `assets/voice/frame-02.wav`
- **Narração Alinhada:**
  - **[15.57s – 26.48s | local 0.12s – 11.03s]** (M / sol_watts): *"O detalhe é que o sol não é só brilho: cada metro quadrado que bate no seu quintal entrega mais de *mil watts* de potência. É um aquecedor ligado o *dia inteiro.*"*
  - **[26.60s – 37.23s | local 11.15s – 21.78s]** (PA / espelhos_alvo): *"Para imitar isso num laboratório, não basta uma lâmpada forte: é preciso somar *centenas* de sóis de uma vez, com espelhos gigantes apontando pro mesmo *alvo.*"*

### Frame 03 — Nenhuma Lâmpada Aguenta o Sol (`37.82s` → `55.08s`)

- **Kicker Editorial:** `FALHA // O LIMITE DO METAL`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Lâmpada de filamento incandescente rachando sob o calor, poça de metal derretido e termômetro cruzando a linha vermelha.
- **Áudio do Frame:** `assets/voice/frame-03.wav`
- **Narração Alinhada:**
  - **[37.94s – 46.85s | local 0.12s – 9.03s]** (PA / lampada_derrete): *"O problema? Uma lâmpada comum *derrete* antes de chegar perto. O filamento de *tungstênio* aguenta uns três mil e quatrocentos graus."*
  - **[46.97s – 54.49s | local 9.15s – 16.67s]** (M / sol_cinco_mil): *"A superfície do sol passa dos *cinco mil e quinhentos.* Qualquer vidro, metal ou plástico vira *poça* muito antes disso."*

### Frame 04 — Uma Estrela em Bilionésimos de Segundo (`55.08s` → `76.15s`)

- **Kicker Editorial:** `SOLUÇÃO // 192 LASERS`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Câmara esférica com 192 feixes de laser convergindo numa microesfera central que acende como uma mini-estrela.
- **Áudio do Frame:** `assets/voice/frame-04.wav`
- **Narração Alinhada:**
  - **[55.20s – 66.76s | local 0.12s – 11.68s]** (M / lasers_192): *"A solução? Trocar a lâmpada por *lasers.* No maior laboratório dos Estados Unidos, 192 feixes atacam uma microesfera do tamanho de um grão de pimenta."*
  - **[66.88s – 75.56s | local 11.80s – 20.48s]** (PA / mini_estrela): *"Por uma fração de segundo, eles liberam mais potência do que a rede elétrica de um país inteiro. E acendem uma *mini-estrela* ali dentro."*

### Frame 05 — O Sol de Laboratório Ainda Deve Energia (`76.15s` → `95.69s`)

- **Kicker Editorial:** `A CONTA // ENERGIA DE VERDADE`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Balança de energia com 2,05 MJ entrando e 3,15 MJ saindo, cercada por chips de aplicação: satélite, aço e painel solar.
- **Áudio do Frame:** `assets/voice/frame-05.wav`
- **Narração Alinhada:**
  - **[76.27s – 86.67s | local 0.12s – 10.52s]** (PA / balanca_energia): *"Em 2022, essa fusão devolveu mais energia do que recebeu. Mas a conta total ainda é *pesada:* o sistema inteiro consome muito mais do que *entrega.*"*
  - **[86.79s – 95.09s | local 10.64s – 18.95s]** (M / aplicacoes_luz): *"Mesmo assim, essa luz já *testa satélites,* derrete aço e aquece painéis solares antes de chegarem na sua *casa.*"*

### Frame 06 — Por Fora e Por Dentro (`95.69s` → `109.88s`)

- **Kicker Editorial:** `POR DENTRO // UMA ESTRELA DOMADA`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Câmara de fusão em corte com uma mini-estrela girando no centro, quatro chamadas técnicas (lupa, espelhos, lasers, fusão) e o selo final do Curiorisando.
- **Áudio do Frame:** `assets/voice/frame-06.wav`
- **Narração Alinhada:**
  - **[95.81s – 103.19s | local 0.12s – 7.50s]** (PA / estrela_domada): *"Por fora, é só uma sala cheia de *espelhos* e canos. Por dentro, é uma *estrela* sendo acesa e apagada no nosso comando."*
  - **[103.31s – 108.74s | local 7.62s – 13.05s]** (M / fechamento_curiorisando): *"Pois é, o mundo é mais *curioso* do que parece! Se você é curioso, segue o *Curiorisando!*"*

