# STORYBOARD — E Se Começasse a Chover e Nunca Mais Parasse? (`chove-sem-parar`)

> **Subtítulo:** O que acontece quando a água não tem mais para onde escoar  
> **Resolução:** 1080x1920 (30 FPS)  
> **Duração Total:** `67.56s`  
> **Voz & Ritmo:** ElevenLabs (`TX3LPaxmHKxFdv7VOQHJ`) acelerada em `1x` (~190 PPM) + Masterização `-14 LUFS` com Sidechain Ducking.

---

## Mapa de Cenas (Frames Híbridos 3D + 2D)

| # | Frame ID | Arquivo | Início | Duração | Fim | Métrica HUD |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `frame-01-gancho-torneira` | `compositions/frames/01-gancho-torneira.html` | `0.00s` | `9.21s` | `9.21s` | **Dia 1** (A TORNEIRA ABERTA) |
| **02** | `frame-02-solo-cimento` | `compositions/frames/02-solo-cimento.html` | `9.21s` | `9.35s` | `18.56s` | **0%** (ABSORCAO DO SOLO) |
| **03** | `frame-03-ralo-transborda` | `compositions/frames/03-ralo-transborda.html` | `18.56s` | `10.46s` | `29.02s` | **Entupido** (REDE DE PLUVIAL) |
| **04** | `frame-04-rua-rio` | `compositions/frames/04-rua-rio.html` | `29.02s` | `9.82s` | `38.84s` | **10 min** (RUA ALAGADA) |
| **05** | `frame-05-drenagem` | `compositions/frames/05-drenagem.html` | `38.84s` | `13.02s` | `51.86s` | **100%** (ESCOAMENTO LIBERADO) |
| **06** | `frame-06-fechamento` | `compositions/frames/06-fechamento.html` | `51.86s` | `15.70s` | `67.56s` | **Curiorisando** (SEGUE O CANAL) |

---

## Detalhamento por Frame

### Frame 01 — E Se Começasse a Chover e Nunca Mais Parasse? (`0.00s` → `9.21s`)

- **Kicker Editorial:** `CENARIO // CHUVA SEM FIM`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Nuvens carregadas se acumulando no céu, primeiras gotas batendo no asfalto seco, mascote olhando para cima com guarda-chuba.
- **Áudio do Frame:** `assets/voice/frame-01.wav`
- **Narração Alinhada:**
  - **[0.12s – 3.74s | local 0.12s – 3.74s]** (gancho): *"E se começasse a chover agora e nunca mais parasse?"*
  - **[3.86s – 8.87s | local 3.86s – 8.87s]** (torneira): *"Não é cena de filme. É só o céu abrindo a *torneira* e esquecendo de fechar."*

### Frame 02 — O Solo Vira Cimento (`9.21s` → `18.56s`)

- **Kicker Editorial:** `FALHA 01 // O CHAO NAO ABSORVE MAIS`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Corte transversal do solo: agua acumulada na superfície, terra seca embaixo, mascote pisando em uma poça.
- **Áudio do Frame:** `assets/voice/frame-02.wav`
- **Narração Alinhada:**
  - **[9.33s – 13.74s | local 0.12s – 4.53s]** (quintal / falha): *"O chao do seu quintal aguenta um temporal, mas nao chuva sem fim."*
  - **[13.86s – 18.22s | local 4.65s – 9.01s]** (cimento / falha): *"Depois de horas, a terra vira *cimento* e nao absorve mais uma gota."*

### Frame 03 — O Ralo Transborda (`18.56s` → `29.02s`)

- **Kicker Editorial:** `FALHA 02 // AS GALERIAS ENTUPAM`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Bueiro entupido com folhas e lixo, agua subindo na grade, mascote observando preocupado.
- **Áudio do Frame:** `assets/voice/frame-03.wav`
- **Narração Alinhada:**
  - **[18.68s – 23.46s | local 0.12s – 4.90s]** (entupido / falha): *"A galeria de pluvial entope com folha, lixo e sacola plastica."*
  - **[23.58s – 28.68s | local 5.02s – 10.12s]** (transborda / falha): *"A agua sobe no ralo, transborda e comeca a correr pela calcada."*

### Frame 04 — Enxurrada Sem Freio (`29.02s` → `38.84s`)

- **Kicker Editorial:** `FALHA 03 // A RUA VIRA RIO`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Rua alagada com agua subindo, carros boiando, mascote em terreno mais alto observando a enxurrada.
- **Áudio do Frame:** `assets/voice/frame-04.wav`
- **Narração Alinhada:**
  - **[29.14s – 34.90s | local 0.12s – 5.88s]** (rio / falha): *"Em minutos sua rua vira *rio*. Carro boiando, lixeira descendo a ladeira."*
  - **[35.02s – 38.50s | local 6.00s – 9.48s]** (fonte / falha): *"A enxurrada nao para porque a *fonte* nunca fecha."*

### Frame 05 — Para Onde a Agua Vai? (`38.84s` → `51.86s`)

- **Kicker Editorial:** `SOLUCAO // DRENAGEM E PISO PERMEAVEL`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Diagrama de rede de drenagem, bueiro grande, piso permeavel com agua infiltrando no solo, mascote apontando para a solucao.
- **Áudio do Frame:** `assets/voice/frame-05.wav`
- **Narração Alinhada:**
  - **[38.96s – 43.88s | local 0.12s – 5.04s]** (solucao / corrige): *"A *solucao*? Rede de drenagem com bueiros maiores, que engolem o volume."*
  - **[44.00s – 51.52s | local 5.16s – 12.68s]** (piso / corrige): *"Para blindar isso, entra o *piso permeavel*: deixa a agua descer pra dentro da terra em vez de correr na superficie."*

### Frame 06 — Por Fora, Parece Só Chuva. Por Dentro, É... (`51.86s` → `67.56s`)

- **Kicker Editorial:** `POR FORA E POR DENTRO // CURIORISANDO`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Silhueta da cidade sob chuva contínua mas com drenagem funcionando, mascote acenando, selo final do Curiorisando.
- **Áudio do Frame:** `assets/voice/frame-06.wav`
- **Narração Alinhada:**
  - **[51.98s – 59.08s | local 0.12s – 7.22s]** (por_fora_por_dentro): *"Por fora, parece so uma *chuva chata*. Por dentro, e a cidade inteira testando o limite do escoamento."*
  - **[59.20s – 66.02s | local 7.34s – 14.16s]** (cta): *"Pois e, o mundo e mais *curioso* do que parece. Se voce e curioso, segue o *Curiorisando*!"*

