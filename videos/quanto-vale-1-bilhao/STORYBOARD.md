# STORYBOARD — Quanto Dinheiro Realmente É 1 Bilhão de Reais? (`quanto-vale-1-bilhao`)

> **Subtítulo:** A pilha de 1 km, os 8 mil anos de salário e a máquina que rende sozinha: a escala real de um bilhão  
> **Resolução:** 1080x1920 (30 FPS)  
> **Duração Total:** `89.54s`  
> **Voz & Ritmo:** ElevenLabs (`TX3LPaxmHKxFdv7VOQHJ`) acelerada em `1x` (~190 PPM) + Masterização `-14 LUFS` com Sidechain Ducking.

---

## Mapa de Cenas (Frames Híbridos 3D + 2D)

| # | Frame ID | Arquivo | Início | Duração | Fim | Métrica HUD |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `frame-01-torre` | `compositions/frames/01-torre.html` | `0.00s` | `14.34s` | `14.34s` | **1.000 m** (ALTURA DA PILHA) |
| **02** | `frame-02-salario` | `compositions/frames/02-salario.html` | `14.34s` | `15.63s` | `29.97s` | **8.333** (ANOS GUARDANDO) |
| **03** | `frame-03-contagem` | `compositions/frames/03-contagem.html` | `29.97s` | `13.17s` | `43.14s` | **31,7** (ANOS CONTANDO) |
| **04** | `frame-04-gasto` | `compositions/frames/04-gasto.html` | `43.14s` | `12.90s` | `56.04s` | **0** (SALDO DO BILHÃO) |
| **05** | `frame-05-maquina` | `compositions/frames/05-maquina.html` | `56.04s` | `15.36s` | `71.40s` | **R$ 10 mi** (RENDIMENTO MENSAL) |
| **06** | `frame-06-fechamento` | `compositions/frames/06-fechamento.html` | `71.40s` | `18.14s` | `89.54s` | **SEGUE O CANAL** (CURIORISANDO) |

---

## Detalhamento por Frame

### Frame 01 — A Torre de 1 Quilômetro (`0.00s` → `14.34s`)

- **Kicker Editorial:** `ESCALA 01 // A PILHA`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Torre de cédulas de R$ 100 crescendo ao lado de um arranha-céu, com régua de altura, callout de 10 milhões de notas e o mascote olhando para cima.
- **Áudio do Frame:** `assets/voice/frame-01.wav`
- **Narração Alinhada:**
  - **[0.12s – 5.69s | local 0.12s – 5.69s]** (PA / gancho_numero): *"Quanto é, de verdade, *1 bilhão* de reais? Parece só um número grande com nove *zeros.*"*
  - **[5.81s – 13.65s | local 5.81s – 13.65s]** (M / torre_1km): *"Mas empilhe 1 bilhão em notas de *100,* e a torre chega a *1 quilômetro* de altura. Mais alta que o maior prédio do *mundo.*"*

### Frame 02 — 8.333 Anos de Salário (`14.34s` → `29.97s`)

- **Kicker Editorial:** `CONTA 01 // SALÁRIO`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Régua do tempo de 8.333 anos com pirâmides do Egito marcadas no meio, barra de 1 bilhão que só chega a 54% e o mascote apontando para o trecho que falta.
- **Áudio do Frame:** `assets/voice/frame-02.wav`
- **Narração Alinhada:**
  - **[14.46s – 22.01s | local 0.12s – 7.67s]** (M / conta_salario): *"Agora tente *juntar* isso com salário. Guardando *10 mil* por mês, sem gastar *nada,* você levaria mais de *8 mil anos.*"*
  - **[22.13s – 29.33s | local 7.79s – 14.99s]** (PA / piramides): *"Seria preciso começar a poupar quase *4 mil anos* antes das pirâmides do Egito. E só *hoje* você teria o primeiro *bilhão.*"*

### Frame 03 — 31 Anos Contando 1 Real por Segundo (`29.97s` → `43.14s`)

- **Kicker Editorial:** `CONTA 02 // CONTAGEM`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Relógio gigante com ponteiro varrendo os segundos, contador de cédulas pulsando 1 real por segundo e uma barra de vida de 0 a 80 anos com o trecho dos 10 aos 41 destacado.
- **Áudio do Frame:** `assets/voice/frame-03.wav`
- **Narração Alinhada:**
  - **[30.09s – 35.01s | local 0.12s – 5.04s]** (PA / contagem_segundos): *"E se você *contasse* esse dinheiro, um real por segundo, sem parar nem pra *dormir?*"*
  - **[35.13s – 42.50s | local 5.16s – 12.53s]** (M / vida_contagem): *"Um bilhão de *segundos* é mais de *31 anos* contando. Você começaria aos *10* e terminaria com mais de *40.*"*

### Frame 04 — 1 Milhão por Dia: 1.000 Dias (`43.14s` → `56.04s`)

- **Kicker Editorial:** `CONTA 03 // GASTO`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Reservatório de dinheiro esvaziando por uma torneira, cédulas caindo pelo ralo e um mostrador circular marcando 1.000 dias até o saldo zerar.
- **Áudio do Frame:** `assets/voice/frame-04.wav`
- **Narração Alinhada:**
  - **[43.26s – 49.34s | local 0.12s – 6.20s]** (M / gasto_diario): *"Vire a conta do *outro* lado: gastar. Que tal *1 milhão* de reais por dia, todos os dias?"*
  - **[49.46s – 55.40s | local 6.32s – 12.26s]** (PA / saldo_zero): *"O bilhão *acaba* em *1.000 dias.* Menos de *três anos* de farra, e a conta volta pro *zero.*"*

### Frame 05 — A Máquina de Dinheiro (`56.04s` → `71.40s`)

- **Kicker Editorial:** `POR DENTRO // RENDIMENTO`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Máquina com engrenagens girando, cédulas entrando pela esteira e moedas caindo na saída, com selo de 1% ao mês e o valor de 10 milhões por mês.
- **Áudio do Frame:** `assets/voice/frame-05.wav`
- **Narração Alinhada:**
  - **[56.16s – 63.07s | local 0.12s – 7.03s]** (PA / maquina_engrenagens): *"E aqui está a parte que *muda tudo:* um bilhão parado não é dinheiro grande. É uma *máquina* de dinheiro."*
  - **[63.19s – 70.66s | local 7.15s – 14.62s]** (M / rendimento_mensal): *"A *1%* ao mês, ele rende *10 milhões* por mês. Mais do que muita gente junta a vida inteira, *sem* ninguém trabalhar."*

### Frame 06 — A Escala Real (`71.40s` → `89.54s`)

- **Kicker Editorial:** `FECHAMENTO // A ESCALA REAL`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Painel-resumo com quatro cartões (1 km, 8.333 anos, 31,7 anos contando, 1.000 dias gastando), o número 1 bilhão em destaque e o selo final do Curiorisando.
- **Áudio do Frame:** `assets/voice/frame-06.wav`
- **Narração Alinhada:**
  - **[71.52s – 82.75s | local 0.12s – 11.35s]** (PA / resumo_escala): *"Por fora, um bilhão é só *um número* numa tela. Por dentro, é uma *torre* de 1 km, *8 mil anos* de salário e uma máquina que rende *sozinha.*"*
  - **[82.87s – 88.30s | local 11.47s – 16.90s]** (M / fechamento_curiorisando): *"Pois é, o mundo é mais *curioso* do que parece! Se você é curioso, segue o *Curiorisando!*"*

