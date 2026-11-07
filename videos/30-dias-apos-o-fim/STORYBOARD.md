# STORYBOARD — 30 Dias Após o Fim (`30-dias-apos-o-fim`)

> **Subtítulo:** O experimento mental de um planeta sem ninguém: a energia apaga, a água seca, a cidade vira selva e o céu volta a brilhar  
> **Resolução:** 1080x1920 (30 FPS)  
> **Duração Total:** `89.13s`  
> **Voz & Ritmo:** ElevenLabs (`TX3LPaxmHKxFdv7VOQHJ`) acelerada em `1x` (156 PPM) + Masterização `-14 LUFS` com Sidechain Ducking.

---

## Mapa de Cenas (Frames 2D Vetoriais)

| # | Frame ID | Arquivo | Início | Duração | Fim | Métrica HUD |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `frame-01-dia-1` | `compositions/frames/01-dia-1.html` | `0.00s` | `12.52s` | `12.52s` | **DIA 1** (O SILÊNCIO) |
| **02** | `frame-02-energia` | `compositions/frames/02-energia.html` | `12.52s` | `14.42s` | `26.94s` | **0 W** (REDE ELÉTRICA) |
| **03** | `frame-03-agua` | `compositions/frames/03-agua.html` | `26.94s` | `14.38s` | `41.32s` | **0 L/s** (BOMBAS DE ÁGUA) |
| **04** | `frame-04-natureza` | `compositions/frames/04-natureza.html` | `41.32s` | `17.07s` | `58.39s` | **SEMANA 2** (CIDADE TOMADA) |
| **05** | `frame-05-ceu` | `compositions/frames/05-ceu.html` | `58.39s` | `16.88s` | `75.27s` | **MILHARES DE ESTRELAS** (DIA 30) |
| **06** | `frame-06-fechamento` | `compositions/frames/06-fechamento.html` | `75.27s` | `13.86s` | `89.13s` | **SEGUE O CANAL** (CURIORISANDO) |

---

## Detalhamento por Frame

### Frame 01 — Dia 1: O Último Ruído (`0.00s` → `12.52s`)

- **Kicker Editorial:** `EXPERIMENTO MENTAL // DIA 1`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Skyline noturna com janelas acesas apagando uma a uma, relógio do dia 1, semáforo vermelho e uma linha de silêncio que morre no asfalto.
- **Áudio do Frame:** `assets/voice/frame-01.wav`
- **Narração Alinhada:**
  - **[0.12s – 4.90s | local 0.12s – 4.90s]** (PA / gancho_estalo): *"E se, num *estalo,* toda a humanidade desaparecesse da Terra de uma vez?"*
  - **[5.02s – 11.88s | local 5.02s – 11.88s]** (M / dia_1_maquinas): *"No *dia 1,* as luzes ainda brilham e as máquinas continuam rodando. Mas ninguém mais está no *comando.*"*

### Frame 02 — Horas 1–6: A Energia Desaba (`12.52s` → `26.94s`)

- **Kicker Editorial:** `SISTEMA 01 // ENERGIA`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Torre de transmissão com cabos tensionados, disjuntor abrindo, medidor de carga caindo a zero e quarteirões apagando em cascata.
- **Áudio do Frame:** `assets/voice/frame-02.wav`
- **Narração Alinhada:**
  - **[12.64s – 19.37s | local 0.12s – 6.85s]** (M / energia_turbinas): *"A primeira coisa a cair é a *energia.* Sem gente pra alimentar as turbinas, as usinas param uma atrás da outra."*
  - **[19.49s – 26.36s | local 6.97s – 13.84s]** (PA / apagao_cascata): *"Em poucas horas, a rede inteira *apaga,* e o planeta mergulha num silêncio que não existe há *séculos.*"*

### Frame 03 — Dia 3: A Água Para de Subir (`26.94s` → `41.32s`)

- **Kicker Editorial:** `SISTEMA 02 // ÁGUA`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Caixa d'água esvaziando, bomba com luz vermelha, torneira pingando até secar e o rio mudando de azul para um caldo esverdeado.
- **Áudio do Frame:** `assets/voice/frame-03.wav`
- **Narração Alinhada:**
  - **[27.06s – 33.32s | local 0.12s – 6.38s]** (PA / agua_bombas): *"Sem eletricidade, as *bombas* param de subir água. A torneira que jorrava na sua casa fica *seca.*"*
  - **[33.44s – 40.73s | local 6.50s – 13.79s]** (M / esgoto_rio): *"E o pior: sem as estações de *tratamento,* o esgoto volta pro rio, e a água que sobra vira um caldo *perigoso.*"*

### Frame 04 — Semana 2: A Cidade Vira Selva (`41.32s` → `58.39s`)

- **Kicker Editorial:** `SISTEMA 03 // NATUREZA`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Rua rachada com plantas brotando do asfalto, trepadeiras subindo pelos prédios e uma capivara atravessando a avenida vazia.
- **Áudio do Frame:** `assets/voice/frame-04.wav`
- **Narração Alinhada:**
  - **[41.44s – 50.40s | local 0.12s – 9.07s]** (M / animais_ruas): *"Na segunda semana, os *animais* percebem que o barulho sumiu. Capivaras, raposas e até *onças* voltam a circular pelas ruas."*
  - **[50.51s – 57.80s | local 9.19s – 16.48s]** (PA / plantas_asfalto): *"As *plantas* brotam pelas rachaduras do asfalto, e a cidade começa a virar uma *floresta* de concreto tomada pelo verde."*

### Frame 05 — Dia 30: O Céu Volta a Brilhar (`58.39s` → `75.27s`)

- **Kicker Editorial:** `SISTEMA 04 // CÉU`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Céu noturno com estrelas reaparecendo, satélite girando vazio, data center fervendo servidores e o sinal de internet apagando.
- **Áudio do Frame:** `assets/voice/frame-05.wav`
- **Narração Alinhada:**
  - **[58.51s – 66.21s | local 0.12s – 7.82s]** (PA / ceu_estrelas): *"No *dia 30,* sem luzes artificiais, o céu noturno volta a mostrar *milhares* de estrelas que a cidade escondia."*
  - **[66.33s – 74.68s | local 7.94s – 16.29s]** (M / internet_apaga): *"Os *satélites* continuam girando vazios, e os data centers, sem refrigeração, cozinham *servidores* e apagam a internet."*

### Frame 06 — Por Fora e Por Dentro (`75.27s` → `89.13s`)

- **Kicker Editorial:** `RAIO-X FINAL // O PLANETA RESPIRA`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Planeta em corte dividido entre cidade apagada e floresta viva, com quatro chamadas técnicas (energia, água, natureza, céu) e o selo final do Curiorisando.
- **Áudio do Frame:** `assets/voice/frame-06.wav`
- **Narração Alinhada:**
  - **[75.39s – 82.44s | local 0.12s – 7.17s]** (PA / por_fora_por_dentro): *"Por fora, parece o *fim do mundo.* Por dentro, é só o planeta *respirando* de novo, sem a gente atrapalhando."*
  - **[82.56s – 87.99s | local 7.29s – 12.72s]** (M / fechamento_curiorisando): *"Pois é, o mundo é mais *curioso* do que parece! Se você é curioso, segue o *Curiorisando!*"*

