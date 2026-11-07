# STORYBOARD — Por Que o Elevador Não Despenca? (`por-que-o-elevador-nao-despenca`)

> **Subtítulo:** O peso escondido no poço, os cabos de aço redundantes e o freio que abraça o trilho quando tudo dá errado  
> **Resolução:** 1080x1920 (30 FPS)  
> **Duração Total:** `93.05s`  
> **Voz & Ritmo:** ElevenLabs (`TX3LPaxmHKxFdv7VOQHJ`) acelerada em `1x` (~190 PPM) + Masterização `-14 LUFS` com Sidechain Ducking.

---

## Mapa de Cenas (Frames Híbridos 3D + 2D)

| # | Frame ID | Arquivo | Início | Duração | Fim | Métrica HUD |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `frame-01-caixa-suspensa` | `compositions/frames/01-caixa-suspensa.html` | `0.00s` | `16.61s` | `16.61s` | **1 TONELADA** (PESO SUSPENSO) |
| **02** | `frame-02-socio-invisivel` | `compositions/frames/02-socio-invisivel.html` | `16.61s` | `13.82s` | `30.43s` | **QUASE O MESMO PESO** (CONTRAPESO) |
| **03** | `frame-03-cabos-redundantes` | `compositions/frames/03-cabos-redundantes.html` | `30.43s` | `16.46s` | `46.89s` | **4 A 8 POR CABINE** (CABOS DE AÇO) |
| **04** | `frame-04-freio-de-mola` | `compositions/frames/04-freio-de-mola.html` | `46.89s` | `13.97s` | `60.86s` | **100% TRAVADO** (FREIO DE MOLA) |
| **05** | `frame-05-freio-de-emergencia` | `compositions/frames/05-freio-de-emergencia.html` | `60.86s` | `13.83s` | `74.69s` | **1,3x O NORMAL** (VELOCIDADE DE DISPARO) |
| **06** | `frame-06-raio-x-elevador` | `compositions/frames/06-raio-x-elevador.html` | `74.69s` | `18.36s` | `93.05s` | **SEGUE O CANAL** (CURIORISANDO) |

---

## Detalhamento por Frame

### Frame 01 — A Caixa Que Não Cai (`0.00s` → `16.61s`)

- **Kicker Editorial:** `NOSSO DIA A DIA // A CAIXA QUE SOBE`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Corte do prédio com a cabine subindo pelo poço, cabos de aço tensionados, indicador de andar e um ponto de interrogação pulsando sobre o vão.
- **Áudio do Frame:** `assets/voice/frame-01.wav`
- **Narração Alinhada:**
  - **[0.12s – 7.45s | local 0.12s – 7.45s]** (M / gancho_caixa): *"Você entra numa *caixa* de metal suspensa por cabos, aperta o botão do décimo andar e sente o estômago *subir.*"*
  - **[7.57s – 15.97s | local 7.57s – 15.97s]** (PA / pergunta_seguranca): *"Ela para certinho, a porta abre, e você nem pensa no que segura tudo isso. Mas o que impede essa caixa de *despencar?*"*

### Frame 02 — O Sócio Invisível (`16.61s` → `30.43s`)

- **Kicker Editorial:** `SEGREDO 01 // O PESO ESCONDIDO`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Corte vertical do poço mostrando cabine e contrapeso em lados opostos, polia no topo girando e etiquetas de peso com uma balança gigante equilibrando os dois.
- **Áudio do Frame:** `assets/voice/frame-02.wav`
- **Narração Alinhada:**
  - **[16.73s – 23.78s | local 0.12s – 7.17s]** (PA / contrapeso): *"O primeiro segredo é um *sócio* invisível: no fundo do poço existe um bloco de concreto chamado *contrapeso.*"*
  - **[23.90s – 29.84s | local 7.29s – 13.23s]** (M / balanca_gigante): *"Quando a cabine desce, ele *sobe* na mesma hora, e os dois ficam quase *empatados* numa balança gigante."*

### Frame 03 — Nunca Um Cabo Só (`30.43s` → `46.89s`)

- **Kicker Editorial:** `SEGREDO 02 // NUNCA UM CABO SÓ`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Corte transversal de um cabo de aço trançado à esquerda e a cabine sustentada por quatro cabos à direita, com barras de carga que se redistribuem quando um cabo rompe.
- **Áudio do Frame:** `assets/voice/frame-03.wav`
- **Narração Alinhada:**
  - **[30.55s – 39.22s | local 0.12s – 8.79s]** (PA / cabos_multiplos): *"E não é um *cabo* só: cada elevador usa vários cabos de *aço* trançado, e cada um deles sozinho já aguentaria a cabine *cheia.*"*
  - **[39.34s – 46.30s | local 8.91s – 15.87s]** (M / redundancia): *"Se um *arrebenta,* os outros dividem o peso e seguram o tranco. É a engenharia da *redundância* trabalhando calada."*

### Frame 04 — O Freio Que Segura (`46.89s` → `60.86s`)

- **Kicker Editorial:** `SEGREDO 03 // O FREIO QUE SEGURA`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Corte da casa de máquinas com a polia de tração, as sapatas do freio, a mola que aperta e o eletroímã que solta, além do indicador de energia que apaga.
- **Áudio do Frame:** `assets/voice/frame-04.wav`
- **Narração Alinhada:**
  - **[47.01s – 53.14s | local 0.12s – 6.25s]** (M / freio_parada): *"Quando você chega no andar, um *freio* de sapata morde a polia do motor e trava a cabine *parada* no lugar."*
  - **[53.26s – 60.27s | local 6.37s – 13.38s]** (PA / freio_falha_segura): *"E ele é esperto: quem aperta a sapata é uma *mola,* então se faltar *energia,* o elevador freia em vez de soltar."*

### Frame 05 — O Freio de Emergência (`60.86s` → `74.69s`)

- **Kicker Editorial:** `SEGREDO 04 // SE TUDO FALHAR`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Corte do poço com a cabine nos trilhos, o limitador de velocidade girando, o velocímetro subindo e as cunhas laterais disparando contra o trilho com faíscas.
- **Áudio do Frame:** `assets/voice/frame-05.wav`
- **Narração Alinhada:**
  - **[60.98s – 67.38s | local 0.12s – 6.52s]** (PG / limitador_velocidade): *"E se os cabos *arrebentarem* e a cabine começar a cair? Entra em cena o *limitador de velocidade.*"*
  - **[67.50s – 74.05s | local 6.64s – 13.19s]** (M / cunhas_trilho): *"Se ele gira rápido demais, dispara umas *cunhas* que agarram os trilhos laterais e seguram a cabine *na marra.*"*

### Frame 06 — Por Fora e Por Dentro (`74.69s` → `93.05s`)

- **Kicker Editorial:** `RAIO-X COMPLETO // 5 PEÇAS`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Vista em corte do sistema inteiro com cinco chamadas técnicas numeradas e linhas SVG ligando contrapeso, cabos, freio, limitador e cunhas ao cartão final do Curiorisando.
- **Áudio do Frame:** `assets/voice/frame-06.wav`
- **Narração Alinhada:**
  - **[74.81s – 84.37s | local 0.12s – 9.68s]** (PA / por_fora_por_dentro): *"Por fora, é só uma caixa que sobe e desce; por dentro, é um *contrapeso,* vários *cabos,* um freio de *mola* e cunhas que agarram o *trilho.*"*
  - **[84.49s – 92.01s | local 9.80s – 17.32s]** (M / fechamento_curiorisando): *"Pois é, o mundo é mais *curioso* do que parece! Se você também olha diferente para o elevador, segue o *Curiorisando!*"*

