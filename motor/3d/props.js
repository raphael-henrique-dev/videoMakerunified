// motor/3d/props.js — Objetos técnicos 3D procedurais: Cabo Submarino de 7 camadas, Vista Explodida, Lasers e Efeitos

import { clamp, lerp, faixa, suave, suavissimo, pulso, mat, malha } from "./math.js";

/**
 * Constrói o modelo 3D de alta precisão do Cabo Submarino de Fibra Óptica com 7 camadas concêntricas:
 * 1. fibra (núcleo de vidro de sílica pura + feixe luminoso)
 * 2. revestimento (acrílico protetor primário)
 * 3. tubo (buffer tube com gel hidrofóbico + 6 fibras coloridas internas)
 * 4. cobre (condutor tubular de alta tensão ~10.000V)
 * 5. vedacao (barreira hermética de policarbonato/alumínio contra pressão abissal)
 * 6. aco (armadura helicoidal de 18 fios de aço trançados)
 * 7. jaqueta (capa externa de polietileno de alta densidade com faixa amarela de sinalização)
 */
export function criarCaboSubmarino(THREE, opcoes = {}) {
  const escala = opcoes.escala ?? 1.0;
  const raiz = new THREE.Group();
  raiz.scale.setScalar(escala);

  // Grupo horizontal telescopado (corte em degraus mostrando todas as 7 camadas)
  const cabo = new THREE.Group();
  raiz.add(cabo);

  // Materiais ricos para cada camada
  const mVidro = mat(THREE, 0x7dd3fc, {
    roughness: 0.08,
    metalness: 0.1,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.85,
  });
  const mRevestimento = mat(THREE, 0x38bdf8, {
    roughness: 0.22,
    metalness: 0.15,
    transparent: true,
    opacity: 0.72,
  });
  const mTubo = mat(THREE, 0xf8fafc, { roughness: 0.35, metalness: 0.1 });
  const mGel = mat(THREE, 0xbae6fd, { roughness: 0.15, transparent: true, opacity: 0.48 });
  const mCobre = mat(THREE, 0xd97706, {
    roughness: 0.26,
    metalness: 0.82,
    emissive: 0x78350f,
    emissiveIntensity: 0.18,
  });
  const mVedacao = mat(THREE, 0x94a3b8, { roughness: 0.32, metalness: 0.68 });
  const mAco = mat(THREE, 0xcbd5e1, { roughness: 0.24, metalness: 0.88 });
  const mJaqueta = mat(THREE, 0x111827, { roughness: 0.55, metalness: 0.18 });
  const mFaixa = mat(THREE, 0xfacc15, {
    roughness: 0.35,
    emissive: 0xca8a04,
    emissiveIntensity: 0.25,
  });

  // 1. Núcleo de fibra óptica + feixe laser interno
  const fibra = new THREE.Group();
  const nucleoVidro = malha(THREE, new THREE.CylinderGeometry(0.065, 0.065, 5.2, 24), mVidro);
  nucleoVidro.rotation.z = Math.PI / 2;
  fibra.add(nucleoVidro);

  // Pulsos luminosos viajando pela fibra
  const pulsosLuz = [];
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 16, 14),
      new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    p.scale.set(2.2, 0.85, 0.85);
    fibra.add(p);
    pulsosLuz.push(p);
  }
  const luzFibra = new THREE.PointLight(0x00f0ff, 2.2, 4.5);
  luzFibra.position.set(1.8, 0.1, 0.2);
  fibra.add(luzFibra);
  cabo.add(fibra);

  // 2. Revestimento primário de acrílico
  const revestimento = malha(
    THREE,
    new THREE.CylinderGeometry(0.13, 0.13, 4.3, 28),
    mRevestimento
  );
  revestimento.rotation.z = Math.PI / 2;
  revestimento.position.x = -0.35;
  cabo.add(revestimento);

  // 3. Tubo protetor (Buffer Tube) + 6 fibras coloridas + gel hidrofóbico
  const tubo = new THREE.Group();
  const cascaTubo = malha(THREE, new THREE.CylinderGeometry(0.24, 0.24, 3.6, 28), mTubo);
  cascaTubo.rotation.z = Math.PI / 2;
  const gelInterno = malha(THREE, new THREE.CylinderGeometry(0.245, 0.245, 0.25, 24), mGel, false);
  gelInterno.rotation.z = Math.PI / 2;
  gelInterno.position.x = 1.82;
  tubo.add(cascaTubo, gelInterno);

  const coresFibras = [0xef4444, 0x22c55e, 0x3b82f6, 0xeab308, 0xa855f7, 0x06b6d4];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const fCor = malha(
      THREE,
      new THREE.CylinderGeometry(0.032, 0.032, 0.7, 14),
      mat(THREE, coresFibras[i], { roughness: 0.2, emissive: coresFibras[i], emissiveIntensity: 0.35 })
    );
    fCor.rotation.z = Math.PI / 2;
    fCor.position.set(1.95, Math.sin(a) * 0.13, Math.cos(a) * 0.13);
    tubo.add(fCor);
  }
  tubo.position.x = -0.68;
  cabo.add(tubo);

  // 4. Tubo condutor de Cobre (energia elétrica para repetidores ópticos)
  const cobre = malha(THREE, new THREE.CylinderGeometry(0.35, 0.35, 3.0, 32), mCobre);
  cobre.rotation.z = Math.PI / 2;
  cobre.position.x = -1.02;
  cabo.add(cobre);

  // 5. Vedação hermética contra água e pressão abissal
  const vedacao = malha(THREE, new THREE.CylinderGeometry(0.45, 0.45, 2.4, 32), mVedacao);
  vedacao.rotation.z = Math.PI / 2;
  vedacao.position.x = -1.35;
  cabo.add(vedacao);

  // 6. Armadura de 18 fios de aço de alta tração
  const aco = new THREE.Group();
  const nFios = 18;
  const raioAnelAco = 0.54;
  for (let i = 0; i < nFios; i++) {
    const a = (i / nFios) * Math.PI * 2;
    const fio = malha(THREE, new THREE.CylinderGeometry(0.068, 0.068, 1.85, 16), mAco);
    fio.rotation.z = Math.PI / 2;
    fio.rotation.y = 0.08;
    fio.position.set(0, Math.sin(a) * raioAnelAco, Math.cos(a) * raioAnelAco);
    aco.add(fio);
  }
  aco.position.x = -1.68;
  cabo.add(aco);

  // 7. Jaqueta externa de Polietileno de Alta Densidade (PEAD)
  const jaqueta = new THREE.Group();
  const corpoJaqueta = malha(THREE, new THREE.CylinderGeometry(0.68, 0.68, 1.35, 36), mJaqueta);
  corpoJaqueta.rotation.z = Math.PI / 2;
  const listra1 = malha(THREE, new THREE.CylinderGeometry(0.692, 0.692, 0.14, 36), mFaixa);
  listra1.rotation.z = Math.PI / 2;
  listra1.position.x = 0.35;
  const listra2 = malha(THREE, new THREE.CylinderGeometry(0.692, 0.692, 0.14, 36), mFaixa);
  listra2.rotation.z = Math.PI / 2;
  listra2.position.x = -0.25;
  jaqueta.add(corpoJaqueta, listra1, listra2);
  jaqueta.position.x = -2.02;
  cabo.add(jaqueta);

  const camadas = {
    fibra,
    revestimento,
    tubo,
    cobre,
    vedacao,
    aco,
    jaqueta,
  };

  const posOriginais = {
    fibra: -0.0,
    revestimento: -0.35,
    tubo: -0.68,
    cobre: -1.02,
    vedacao: -1.35,
    aco: -1.68,
    jaqueta: -2.02,
  };

  /**
   * Atualiza o estado das camadas para animação progressiva de montagem (de dentro para fora)
   * e anima os pulsos de laser viajando pelo núcleo de vidro.
   */
  function atualizar(t, estadoCamadas = {}) {
    // Animação dos pulsos de luz na fibra óptica
    for (let i = 0; i < pulsosLuz.length; i++) {
      const u = ((t * 1.45 + i / pulsosLuz.length) % 1);
      pulsosLuz[i].position.x = lerp(-2.4, 2.4, u);
      const env = Math.sin(u * Math.PI);
      pulsosLuz[i].scale.set(2.2 * env, 0.85 * env, 0.85 * env);
    }
    luzFibra.intensity = 1.8 + Math.sin(t * 8.0) * 0.55;

    // Controle de entrada suave (deslizando no eixo X) para cada camada
    for (const [nome, obj] of Object.entries(camadas)) {
      const prog = estadoCamadas[nome] !== undefined ? clamp(estadoCamadas[nome]) : 1.0;
      if (prog <= 0.001) {
        obj.visible = false;
      } else {
        obj.visible = true;
        const u = suavissimo(prog);
        obj.position.x = lerp(posOriginais[nome] - 2.6, posOriginais[nome], u);
        obj.position.y = 0;
        const esc = lerp(0.75, 1.0, u);
        obj.scale.setScalar(esc);
      }
    }
  }

  return {
    raiz,
    cabo,
    camadas,
    pulsosLuz,
    luzFibra,
    atualizar,
  };
}

/**
 * Cria uma Torre Vertical de Vista Explodida das 7 camadas do cabo submarino,
 * ideal para o Frame 04 de revisão técnica com projeção 3D -> 2D e chamadas SVG.
 */
export function criarPilhaExplodidaCabo(THREE) {
  const grupo = new THREE.Group();

  const definicoes = [
    { id: "jaqueta",      nome: "7. Jaqueta PEAD",        cor: 0x1e293b, emissive: 0xfacc15, r: 0.62, h: 0.20, yAlvo: -1.10 },
    { id: "aco",          nome: "6. Fios de Aço (18x)",   cor: 0xcbd5e1, emissive: 0x64748b, r: 0.53, h: 0.20, yAlvo: -0.68 },
    { id: "vedacao",      nome: "5. Barreira Hermética",  cor: 0x94a3b8, emissive: 0x334155, r: 0.45, h: 0.19, yAlvo: -0.26 },
    { id: "cobre",        nome: "4. Tubo de Cobre 10kV",  cor: 0xd97706, emissive: 0x92400e, r: 0.37, h: 0.19, yAlvo:  0.16 },
    { id: "tubo",         nome: "3. Buffer Tube + Gel",   cor: 0xf8fafc, emissive: 0x38bdf8, r: 0.29, h: 0.19, yAlvo:  0.58 },
    { id: "revestimento", nome: "2. Acrílico Primário",   cor: 0x38bdf8, emissive: 0x0284c7, r: 0.21, h: 0.19, yAlvo:  1.00 },
    { id: "fibra",        nome: "1. Fibra de Sílica",     cor: 0x00f0ff, emissive: 0x00f0ff, r: 0.12, h: 0.26, yAlvo:  1.42 },
  ];

  const pecas = [];
  for (let i = 0; i < definicoes.length; i++) {
    const d = definicoes[i];
    const pecaGrp = new THREE.Group();
    const cilindro = malha(
      THREE,
      new THREE.CylinderGeometry(d.r, d.r, d.h, 32),
      mat(THREE, d.cor, {
        roughness: 0.25,
        metalness: i <= 3 ? 0.65 : 0.15,
        emissive: d.emissive,
        emissiveIntensity: i === 6 ? 0.85 : 0.18,
      })
    );
    pecaGrp.add(cilindro);

    // Anel luminoso de borda técnica
    const anel = new THREE.Mesh(
      new THREE.TorusGeometry(d.r + 0.02, 0.016, 12, 32),
      new THREE.MeshBasicMaterial({ color: i === 6 ? 0x00ffff : 0x38bdf8, transparent: true, opacity: 0.65 })
    );
    anel.rotation.x = Math.PI / 2;
    pecaGrp.add(anel);

    grupo.add(pecaGrp);
    pecas.push({ ...d, grp: pecaGrp, cilindro, anel });
  }

  // Eixo central guia laser
  const eixoLaser = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 2.8, 16),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 })
  );
  eixoLaser.position.y = 0.16;
  grupo.add(eixoLaser);

  function atualizar(t, tExplosao = 0.2) {
    const uExp = suavissimo(faixa(t, tExplosao, tExplosao + 1.4));
    for (let i = 0; i < pecas.length; i++) {
      const p = pecas[i];
      const yCompacto = -0.4 + i * 0.18;
      p.grp.position.y = lerp(yCompacto, p.yAlvo, uExp) + Math.sin(t * 2.2 + i * 0.6) * 0.03;
      p.grp.rotation.y = t * 0.45 + i * 0.25;
      p.grp.rotation.x = 0.18;
    }
  }

  return { grupo, pecas, atualizar };
}

/**
 * Normaliza qualquer modelo 3D externo (.glb / .gltf ou Group) para a escala, centro e padrão
 * de sombreamento estilizado do canal.
 */
export function normalizarModeloExterno(THREE, raizModelo, opcoes = {}) {
  const tamanhoAlvo = opcoes.tamanhoAlvo ?? 2.0;
  const caixa = new THREE.Box3().setFromObject(raizModelo);
  const tam = new THREE.Vector3();
  const centro = new THREE.Vector3();
  caixa.getSize(tam);
  caixa.getCenter(centro);

  const maiorEixo = Math.max(tam.x, tam.y, tam.z, 0.001);
  const escala = tamanhoAlvo / maiorEixo;
  raizModelo.scale.multiplyScalar(escala);

  raizModelo.position.sub(centro.multiplyScalar(escala));
  raizModelo.traverse((filho) => {
    if (filho.isMesh) {
      filho.castShadow = true;
      filho.receiveShadow = true;
    }
  });
  return raizModelo;
}

/**
 * Frame 01 — Cria o Planeta Terra em Sobrecarga Térmica + Termômetro 3D Gigante
 * Mostra o globo terrestre com faixas de anomalia de temperatura (+1.5°C) e um termômetro
 * que sobrecarrega quando tenta medir o calor acumulado nos oceanos e atmosfera.
 */
export function criarPlanetaTermico(THREE, opcoes = {}) {
  const escala = opcoes.escala ?? 1.0;
  const raiz = new THREE.Group();
  raiz.scale.setScalar(escala);

  const globoGrp = new THREE.Group();
  raiz.add(globoGrp);

  // Esfera oceânica base
  const mOceano = mat(THREE, 0x0b3b69, {
    roughness: 0.32,
    metalness: 0.18,
    emissive: 0x082f49,
    emissiveIntensity: 0.35,
  });
  const esferaTerra = malha(THREE, new THREE.SphereGeometry(1.18, 40, 32), mOceano);
  globoGrp.add(esferaTerra);

  // Placas continentais estilizadas ao redor do globo
  const mContinente = mat(THREE, 0x22c55e, {
    roughness: 0.55,
    metalness: 0.08,
    emissive: 0x15803d,
    emissiveIntensity: 0.18,
  });
  const coordsCont = [
    [0.45, 0.35, 1.0, 0.48],
    [-0.55, 0.42, 0.92, 0.52],
    [0.15, -0.48, 1.05, 0.42],
    [-0.38, -0.35, 0.98, 0.38],
    [0.85, 0.1, 0.72, 0.45],
    [-0.88, -0.1, 0.72, 0.44],
  ];
  const placas = [];
  for (const [cx, cy, cz, tam] of coordsCont) {
    const dir = new THREE.Vector3(cx, cy, cz).normalize();
    const placa = malha(THREE, new THREE.DodecahedronGeometry(tam, 1), mContinente);
    placa.position.copy(dir.multiplyScalar(1.06));
    placa.lookAt(0, 0, 0);
    placa.scale.set(1.15, 0.85, 0.28);
    globoGrp.add(placa);
    placas.push(placa);
  }

  // Faixas orbitais de anomalia térmica (azul -> âmbar -> vermelho incandescente)
  const aneisTermicos = [];
  const latitudes = [-0.55, -0.2, 0.18, 0.52];
  for (let i = 0; i < latitudes.length; i++) {
    const lat = latitudes[i];
    const rAnel = Math.sqrt(Math.max(0.2, 1.24 * 1.24 - lat * lat));
    const mAnel = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0xf97316 : 0xef4444,
      transparent: true,
      opacity: 0.65,
    });
    const anel = new THREE.Mesh(new THREE.TorusGeometry(rAnel, 0.028, 14, 48), mAnel);
    anel.rotation.x = Math.PI / 2;
    anel.position.y = lat;
    globoGrp.add(anel);
    aneisTermicos.push({ anel, mAnel, lat });
  }

  // Casca atmosférica estufa (glow externo)
  const mAtmosfera = mat(THREE, 0xf97316, {
    roughness: 0.15,
    transparent: true,
    opacity: 0.24,
    emissive: 0xef4444,
    emissiveIntensity: 0.45,
  });
  const atmosfera = new THREE.Mesh(new THREE.SphereGeometry(1.34, 36, 28), mAtmosfera);
  globoGrp.add(atmosfera);

  // Termômetro 3D gigante ao lado do globo
  const termometro = new THREE.Group();
  termometro.position.set(1.22, -0.05, 0.45);
  raiz.add(termometro);

  const mVidroT = mat(THREE, 0xe2e8f0, {
    roughness: 0.12,
    transparent: true,
    opacity: 0.48,
  });
  const tuboVidro = malha(THREE, new THREE.CylinderGeometry(0.16, 0.16, 2.2, 24), mVidroT, false);
  tuboVidro.position.y = 0.3;
  termometro.add(tuboVidro);

  const mMercurio = mat(THREE, 0xef4444, {
    roughness: 0.2,
    emissive: 0xef4444,
    emissiveIntensity: 0.85,
  });
  const bulbo = malha(THREE, new THREE.SphereGeometry(0.28, 24, 20), mMercurio);
  bulbo.position.y = -0.82;
  termometro.add(bulbo);

  const colunaMercurio = malha(THREE, new THREE.CylinderGeometry(0.095, 0.095, 1.9, 20), mMercurio, false);
  colunaMercurio.position.y = -0.2;
  termometro.add(colunaMercurio);

  // Luz de sobrecarga térmica
  const luzCalor = new THREE.PointLight(0xf97316, 2.2, 6.0);
  luzCalor.position.set(0.5, 0.6, 1.8);
  raiz.add(luzCalor);

  function atualizar(t, nivelCalor = 0.5) {
    const nv = clamp(nivelCalor, 0, 1);
    globoGrp.rotation.y = t * 0.42;
    globoGrp.rotation.z = 0.18;

    // Animação da sobrecarga térmica nas faixas e atmosfera
    mAtmosfera.opacity = lerp(0.14, 0.38, nv) + Math.sin(t * 5.0) * 0.04;
    mAtmosfera.emissiveIntensity = lerp(0.2, 0.95, nv);
    mOceano.emissive.setHex(nv > 0.55 ? 0x7c2d12 : 0x082f49);
    mOceano.emissiveIntensity = lerp(0.25, 0.75, nv);

    for (let i = 0; i < aneisTermicos.length; i++) {
      const a = aneisTermicos[i];
      const escalaPulso = 1.0 + Math.sin(t * 4.5 + i * 1.1) * 0.035 * nv;
      a.anel.scale.setScalar(escalaPulso);
      a.mAnel.opacity = lerp(0.25, 0.88, nv);
    }

    // Subida do mercúrio no termômetro e vibração de sobrecarga
    const escalaMerc = lerp(0.22, 1.08, nv);
    colunaMercurio.scale.y = escalaMerc;
    colunaMercurio.position.y = -0.82 + (1.9 * escalaMerc) * 0.5;
    if (nv > 0.75) {
      termometro.rotation.z = Math.sin(t * 28.0) * 0.06;
      bulbo.scale.setScalar(1.0 + Math.sin(t * 18.0) * 0.08);
    } else {
      termometro.rotation.z = 0;
      bulbo.scale.setScalar(1.0);
    }
    luzCalor.intensity = lerp(1.0, 3.2, nv);
  }

  return { raiz, globoGrp, termometro, atmosfera, luzCalor, atualizar };
}

/**
 * Frame 02 — Cria a "Esponja Atmosférica" (Lei de Clausius-Clapeyron: +7% vapor por °C)
 * Nuvem cumulonimbus volumétrica que suga colunas de vapor do solo ressecado até saturar
 * e despencar em cortinas de chuva torrencial e raios.
 */
export function criarEsponjaAtmosferica(THREE) {
  const raiz = new THREE.Group();

  // Nuvem-esponja superior (clusters esféricos que incham e escurecem)
  const nuvemGrp = new THREE.Group();
  nuvemGrp.position.set(0, 2.35, 0);
  raiz.add(nuvemGrp);

  const mNuvem = mat(THREE, 0xe2e8f0, {
    roughness: 0.65,
    metalness: 0.05,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.15,
  });

  const bolhasConfig = [
    [0, 0, 0, 0.78],
    [-0.68, -0.08, 0.12, 0.62],
    [0.68, -0.06, 0.1, 0.64],
    [-1.18, -0.18, -0.05, 0.48],
    [1.18, -0.16, -0.05, 0.5],
    [-0.35, 0.42, -0.08, 0.58],
    [0.38, 0.45, 0.06, 0.6],
    [0, 0.62, 0, 0.52],
  ];
  const bolhas = [];
  for (const [bx, by, bz, br] of bolhasConfig) {
    const b = malha(THREE, new THREE.SphereGeometry(br, 24, 20), mNuvem);
    b.position.set(bx, by, bz);
    nuvemGrp.add(b);
    bolhas.push(b);
  }

  // Colunas ascendentes de evaporação (vapor subindo do chão para a nuvem)
  const vaporGrp = new THREE.Group();
  raiz.add(vaporGrp);
  const mVapor = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.55,
  });
  const particulasVapor = [];
  for (let i = 0; i < 28; i++) {
    const ang = (i / 28) * Math.PI * 2;
    const raio = 0.25 + (i % 4) * 0.32;
    const gota = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), mVapor);
    vaporGrp.add(gota);
    particulasVapor.push({
      gota,
      x: Math.cos(ang) * raio,
      z: Math.sin(ang) * raio,
      fase: i / 28,
    });
  }

  // Cortina de chuva torrencial (quando a esponja é espremida)
  const chuvaGrp = new THREE.Group();
  raiz.add(chuvaGrp);
  const mChuva = new THREE.MeshBasicMaterial({
    color: 0x60a5fa,
    transparent: true,
    opacity: 0.82,
  });
  const tracosChuva = [];
  for (let i = 0; i < 36; i++) {
    const traco = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 8), mChuva);
    const rx = ((i % 9) - 4) * 0.28;
    const rz = (Math.floor(i / 9) - 1.5) * 0.28;
    chuvaGrp.add(traco);
    tracosChuva.push({ traco, rx, rz, offset: (i * 0.17) % 1 });
  }

  // Raio elétrico no centro da tempestade
  const mRaio = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const raioMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.02, 2.2, 8), mRaio);
  raioMesh.position.set(0.15, 1.1, 0.25);
  raioMesh.rotation.z = 0.14;
  raioMesh.visible = false;
  raiz.add(raioMesh);

  function atualizar(t, saturacao = 0.5, chovendo = 0.0) {
    const sat = clamp(saturacao, 0, 1);
    const chv = clamp(chovendo, 0, 1);

    // Nuvem incha conforme retém +7% de vapor por °C
    const esc = lerp(0.78, 1.28, sat);
    nuvemGrp.scale.set(esc, esc * (1.0 - chv * 0.12), esc);
    nuvemGrp.position.y = 2.35 + Math.sin(t * 2.2) * 0.06;

    // Cor da nuvem muda de branca/ciano (absorvendo vapor) para chumbo-elétrico (tempestade)
    const cClara = new THREE.Color(0xdbeafe);
    const cTempestade = new THREE.Color(0x1e293b);
    mNuvem.color.copy(cClara.lerp(cTempestade, chv * 0.85 + sat * 0.15));
    mNuvem.emissive.setHex(chv > 0.4 ? 0x0284c7 : 0x38bdf8);
    mNuvem.emissiveIntensity = lerp(0.15, 0.42, sat);

    // Anima vapor subindo
    mVapor.opacity = lerp(0.68, 0.15, chv);
    for (const p of particulasVapor) {
      const u = (t * 0.65 + p.fase) % 1;
      p.gota.position.set(
        p.x + Math.sin(t * 3.0 + p.fase * 6.28) * 0.08,
        lerp(0.15, 2.2, u),
        p.z
      );
      const s = Math.sin(u * Math.PI) * lerp(0.6, 1.35, sat);
      p.gota.scale.setScalar(Math.max(0.01, s));
    }

    // Anima cortina de chuva caindo
    chuvaGrp.visible = chv > 0.02;
    mChuva.opacity = chv * 0.88;
    for (const c of tracosChuva) {
      const u = (t * 2.8 + c.offset) % 1;
      c.traco.position.set(c.rx, lerp(2.15, 0.15, u), c.rz);
    }

    // Flashes de raio quando chovendo forte
    raioMesh.visible = chv > 0.5 && Math.sin(t * 19.0) > 0.65;
  }

  return { raiz, nuvemGrp, vaporGrp, chuvaGrp, raioMesh, atualizar };
}

/**
 * Frame 03 — Cria o Vórtice Ciclônico sobre Oceano Superaquecido (90% do Calor Global)
 * Mostra a superfície do mar brilhando em infravermelho térmico e alimentando
 * um funil espiral de furacão/supercélula com anéis rotativos de alta velocidade.
 */
export function criarVorticeCiclonico(THREE) {
  const raiz = new THREE.Group();

  // Disco oceânico térmico na base
  const mMarQuente = mat(THREE, 0x0f172a, {
    roughness: 0.22,
    metalness: 0.35,
    emissive: 0xea580c,
    emissiveIntensity: 0.55,
  });
  const discoMar = malha(THREE, new THREE.CylinderGeometry(2.8, 2.8, 0.12, 48), mMarQuente);
  discoMar.position.y = 0.06;
  raiz.add(discoMar);

  // Anéis concêntricos de anomalia térmica na água
  const aneisCalorMar = [];
  for (let i = 0; i < 4; i++) {
    const r = 0.55 + i * 0.52;
    const mAnel = new THREE.MeshBasicMaterial({
      color: i < 2 ? 0xef4444 : 0xf59e0b,
      transparent: true,
      opacity: 0.65 - i * 0.12,
    });
    const anel = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 12, 48), mAnel);
    anel.rotation.x = Math.PI / 2;
    anel.position.y = 0.14;
    raiz.add(anel);
    aneisCalorMar.push({ anel, mAnel, rBase: r });
  }

  // Estrutura vertical do vórtice ciclônico (anéis de nuvens e vento em espiral)
  const vorticeGrp = new THREE.Group();
  raiz.add(vorticeGrp);

  const niveisVortice = [];
  const nNiveis = 7;
  for (let i = 0; i < nNiveis; i++) {
    const frac = i / (nNiveis - 1);
    const raioNivel = lerp(0.42, 1.55, Math.pow(frac, 0.85));
    const yNivel = lerp(0.38, 2.75, frac);
    const nivelGrp = new THREE.Group();
    nivelGrp.position.y = yNivel;

    const corAnel = frac < 0.35 ? 0xf97316 : frac < 0.7 ? 0x38bdf8 : 0xe2e8f0;
    const anelVento = new THREE.Mesh(
      new THREE.TorusGeometry(raioNivel, 0.045 + frac * 0.04, 14, 40),
      mat(THREE, corAnel, {
        roughness: 0.35,
        transparent: true,
        opacity: 0.78,
        emissive: corAnel,
        emissiveIntensity: 0.35,
      })
    );
    anelVento.rotation.x = Math.PI / 2;
    nivelGrp.add(anelVento);

    // Pás de nuvens espirais em cada nível
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const gomo = malha(
        THREE,
        new THREE.SphereGeometry(0.16 + frac * 0.12, 16, 14),
        mat(THREE, 0xcbd5e1, { roughness: 0.55, emissive: corAnel, emissiveIntensity: 0.2 })
      );
      gomo.position.set(Math.cos(a) * raioNivel, 0, Math.sin(a) * raioNivel);
      gomo.scale.set(1.6, 0.65, 0.9);
      nivelGrp.add(gomo);
    }

    vorticeGrp.add(nivelGrp);
    niveisVortice.push({ nivelGrp, frac });
  }

  function atualizar(t, potencia = 0.7) {
    const pot = clamp(potencia, 0, 1);
    const velGiro = lerp(1.8, 6.2, pot);

    mMarQuente.emissiveIntensity = lerp(0.25, 0.85, pot) + Math.sin(t * 4.0) * 0.08;

    for (let i = 0; i < aneisCalorMar.length; i++) {
      const a = aneisCalorMar[i];
      const u = 1.0 - ((t * 0.55 + i * 0.25) % 1) * 0.35;
      a.anel.scale.setScalar(u);
    }

    for (let i = 0; i < niveisVortice.length; i++) {
      const nv = niveisVortice[i];
      nv.nivelGrp.rotation.y = t * velGiro * (1.3 - nv.frac * 0.45) + i * 0.5;
      nv.nivelGrp.position.x = Math.sin(t * 2.5 + i * 0.7) * 0.08 * pot;
      const esc = lerp(0.65, 1.12, pot);
      nv.nivelGrp.scale.setScalar(esc);
    }
  }

  return { raiz, discoMar, vorticeGrp, atualizar };
}

/**
 * Frame 04 — Cria a Corrente de Jato (Jet Stream) e a Amplificação Ártica
 * Mostra o hemisfério terrestre com a calota polar aquecendo e a fita da Corrente de Jato
 * perdendo velocidade e criando ondas gigantes (Ondas de Rossby) que travam sistemas extremos.
 */
export function criarCorrenteDeJato(THREE) {
  const raiz = new THREE.Group();

  // Globo hemisférico central
  const mTerra = mat(THREE, 0x0c2d48, { roughness: 0.45, metalness: 0.15 });
  const globo = malha(THREE, new THREE.SphereGeometry(1.25, 40, 32), mTerra);
  raiz.add(globo);

  // Calota Polar Ártica no topo (muda de gelo azul/branco para vermelho de amplificação ártica)
  const mArtico = mat(THREE, 0xe0f2fe, {
    roughness: 0.3,
    emissive: 0xef4444,
    emissiveIntensity: 0.1,
  });
  const calotaArtica = malha(
    THREE,
    new THREE.SphereGeometry(1.27, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.28),
    mArtico
  );
  raiz.add(calotaArtica);

  // Segmentos da fita da Corrente de Jato ao redor da latitude média
  const nSegs = 64;
  const esferasJato = [];
  const jatoGrp = new THREE.Group();
  raiz.add(jatoGrp);

  for (let i = 0; i < nSegs; i++) {
    const mSeg = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const seg = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 12), mSeg);
    jatoGrp.add(seg);
    esferasJato.push({ seg, mSeg, idx: i });
  }

  // Duas cúpulas estacionárias de bloqueio (Domo de Calor + Tempestade Travada)
  const mDomoCalor = mat(THREE, 0xef4444, {
    roughness: 0.2,
    transparent: true,
    opacity: 0.45,
    emissive: 0xef4444,
    emissiveIntensity: 0.65,
  });
  const domoCalor = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 20), mDomoCalor);
  domoCalor.position.set(0.88, 0.35, 0.92);
  raiz.add(domoCalor);

  const mDomoChuva = mat(THREE, 0x3b82f6, {
    roughness: 0.2,
    transparent: true,
    opacity: 0.45,
    emissive: 0x0284c7,
    emissiveIntensity: 0.65,
  });
  const domoChuva = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 20), mDomoChuva);
  domoChuva.position.set(-0.85, 0.12, 0.96);
  raiz.add(domoChuva);

  function atualizar(t, meandro = 0.5) {
    const m = clamp(meandro, 0, 1);
    globo.rotation.y = t * 0.18;

    // Amplificação ártica: polo esquenta 4x mais rápido
    mArtico.emissiveIntensity = lerp(0.08, 0.92, m);
    mArtico.color.setHex(m > 0.5 ? 0xfca5a5 : 0xe0f2fe);

    // Quando o gradiente enfraquece, a corrente de jato fica mais lenta e com curvas enormes
    const velFluxo = lerp(3.2, 0.65, m);
    const ampOnda = lerp(0.08, 0.44, m);

    for (let i = 0; i < nSegs; i++) {
      const s = esferasJato[i];
      const ang = (i / nSegs) * Math.PI * 2;
      const lat = 0.42 + Math.sin(ang * 4.0 + t * velFluxo) * ampOnda;
      const r = 1.34;
      const rHoriz = Math.cos(lat) * r;
      const y = Math.sin(lat) * r;
      s.seg.position.set(Math.cos(ang) * rHoriz, y, Math.sin(ang) * rHoriz);
      s.seg.scale.setScalar(1.0 + Math.sin(t * 6.0 + i * 0.4) * 0.22);
      s.mSeg.color.setHex(m > 0.55 && Math.sin(ang * 4.0) > 0 ? 0xf97316 : 0x00f0ff);
    }

    // Domos de bloqueio aparecem quando os meandros travam
    const escDomo = suavissimo(faixa(m, 0.25, 0.85));
    domoCalor.scale.setScalar(Math.max(0.01, escDomo * (1.0 + Math.sin(t * 4.0) * 0.08)));
    domoChuva.scale.setScalar(Math.max(0.01, escDomo * (1.0 + Math.cos(t * 4.0) * 0.08)));
  }

  return { raiz, globo, calotaArtica, domoCalor, domoChuva, atualizar };
}

/**
 * Frame 05 — Cria o Corte Geológico e Urbano (Solo Seco Impermeável + Enxurrada)
 * Mostra como o solo esturricado pela seca e o asfalto urbano impedem a infiltração,
 * gerando escoamento superficial explosivo (flash flood).
 */
export function criarCorteSoloUrbano(THREE) {
  const raiz = new THREE.Group();

  // Base do bloco geológico em corte transversal
  const mSubsolo = mat(THREE, 0x451a03, { roughness: 0.85 });
  const blocoSubsolo = malha(THREE, new THREE.BoxGeometry(3.8, 0.65, 2.2), mSubsolo);
  blocoSubsolo.position.y = 0.325;
  raiz.add(blocoSubsolo);

  // Metade esquerda: Solo seco rachado (endurecido como concreto)
  const mSoloSeco = mat(THREE, 0xb45309, { roughness: 0.78 });
  const placaSeca = malha(THREE, new THREE.BoxGeometry(1.88, 0.16, 2.22), mSoloSeco);
  placaSeca.position.set(-0.95, 0.72, 0);
  raiz.add(placaSeca);

  // Metade direita: Asfalto urbano e prédios estilizados
  const mAsfalto = mat(THREE, 0x1e293b, { roughness: 0.65, metalness: 0.2 });
  const placaAsfalto = malha(THREE, new THREE.BoxGeometry(1.88, 0.16, 2.22), mAsfalto);
  placaAsfalto.position.set(0.95, 0.72, 0);
  raiz.add(placaAsfalto);

  // Mini edifícios urbanos na direita
  const mPredio = mat(THREE, 0x334155, {
    roughness: 0.35,
    metalness: 0.45,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.18,
  });
  const alturasPredios = [
    [0.55, 0.95, -0.55],
    [1.15, 1.35, -0.48],
    [1.55, 0.82, 0.25],
  ];
  for (const [px, ph, pz] of alturasPredios) {
    const predio = malha(THREE, new THREE.BoxGeometry(0.42, ph, 0.42), mPredio);
    predio.position.set(px, 0.8 + ph * 0.5, pz);
    raiz.add(predio);
  }

  // Lâmina de água / enxurrada superficial que acumula sobre o solo impermeável
  const mEnxurrada = mat(THREE, 0x0284c7, {
    roughness: 0.12,
    metalness: 0.25,
    transparent: true,
    opacity: 0.78,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.35,
  });
  const laminaAgua = malha(THREE, new THREE.BoxGeometry(3.76, 0.38, 2.18), mEnxurrada);
  laminaAgua.position.set(0, 0.82, 0);
  raiz.add(laminaAgua);

  function atualizar(t, nivelEnxurrada = 0.5) {
    const nv = clamp(nivelEnxurrada, 0.02, 1.0);
    laminaAgua.scale.y = nv;
    laminaAgua.position.y = 0.8 + (0.38 * nv) * 0.5 + Math.sin(t * 5.5) * 0.015;
    mEnxurrada.opacity = lerp(0.25, 0.84, nv);
  }

  return { raiz, blocoSubsolo, placaSeca, placaAsfalto, laminaAgua, atualizar };
}

/**
 * Frame 06 — Cria a Torre Vertical de Vista Explodida da Supercélula Climática (7 Níveis)
 * Usada no fechamento técnico com projeção 3D -> 2D e chamadas SVG para explicar toda a máquina térmica.
 */
export function criarPilhaExplodidaTempestade(THREE) {
  const grupo = new THREE.Group();

  const definicoes = [
    { id: "oceano",      nome: "1. Oceano +30°C (90% Calor)", cor: 0xea580c, emissive: 0xef4444, r: 0.68, h: 0.18, yAlvo: -1.12 },
    { id: "evaporacao",  nome: "2. Vapor +7% / °C",           cor: 0xf59e0b, emissive: 0xf97316, r: 0.56, h: 0.18, yAlvo: -0.70 },
    { id: "condensacao", nome: "3. Base de Condensação",      cor: 0x38bdf8, emissive: 0x0284c7, r: 0.62, h: 0.19, yAlvo: -0.28 },
    { id: "updraft",     nome: "4. Corrente Ascendente",      cor: 0x06b6d4, emissive: 0x00f0ff, r: 0.46, h: 0.22, yAlvo:  0.15 },
    { id: "granizo",     nome: "5. Núcleo de Granizo e Raios",cor: 0x6366f1, emissive: 0xfacc15, r: 0.52, h: 0.20, yAlvo:  0.58 },
    { id: "jato",        nome: "6. Corrente de Jato Travada", cor: 0xa855f7, emissive: 0xc084fc, r: 0.58, h: 0.18, yAlvo:  1.00 },
    { id: "bigorna",     nome: "7. Bigorna Estratosférica",   cor: 0xe2e8f0, emissive: 0x38bdf8, r: 0.78, h: 0.22, yAlvo:  1.42 },
  ];

  const pecas = [];
  for (let i = 0; i < definicoes.length; i++) {
    const d = definicoes[i];
    const pecaGrp = new THREE.Group();
    const cilindro = malha(
      THREE,
      new THREE.CylinderGeometry(d.r, d.r * 0.88, d.h, 36),
      mat(THREE, d.cor, {
        roughness: 0.28,
        metalness: 0.25,
        emissive: d.emissive,
        emissiveIntensity: 0.35,
      })
    );
    pecaGrp.add(cilindro);

    const anel = new THREE.Mesh(
      new THREE.TorusGeometry(d.r + 0.025, 0.016, 12, 36),
      new THREE.MeshBasicMaterial({ color: d.emissive, transparent: true, opacity: 0.75 })
    );
    anel.rotation.x = Math.PI / 2;
    pecaGrp.add(anel);

    grupo.add(pecaGrp);
    pecas.push({ ...d, grp: pecaGrp, cilindro, anel });
  }

  // Coluna central de vorticidade térmica
  const eixoCentral = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 2.9, 16),
    new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.55 })
  );
  eixoCentral.position.y = 0.16;
  grupo.add(eixoCentral);

  function atualizar(t, tExplosao = 0.2) {
    const uExp = suavissimo(faixa(t, tExplosao, tExplosao + 1.4));
    for (let i = 0; i < pecas.length; i++) {
      const p = pecas[i];
      const yCompacto = -0.4 + i * 0.18;
      p.grp.position.y = lerp(yCompacto, p.yAlvo, uExp) + Math.sin(t * 2.4 + i * 0.65) * 0.03;
      p.grp.rotation.y = t * (0.55 + i * 0.08) + i * 0.3;
      p.grp.rotation.x = 0.16;
    }
  }

  return { grupo, pecas, atualizar };
}

// ============================================================================
// KIT WI-FI E SINAIS INVISÍVEIS EM CASA (6 CONSTRUTORES PROCEDURAIS 3D)
// ============================================================================

/**
 * Frame 01 (Wi-Fi) — Roteador na sala com 3 antenas + ondas 3D enfraquecendo até o celular travando
 */
export function criarRoteadorSinalFraco(THREE) {
  const raiz = new THREE.Group();

  // Rack/mesa da sala
  const mMesa = mat(THREE, 0x334155, { roughness: 0.7 });
  const mesa = malha(THREE, new THREE.BoxGeometry(1.3, 0.14, 0.85), mMesa);
  mesa.position.set(-0.55, 0.72, 0);
  raiz.add(mesa);

  // Corpo do roteador
  const mCorpo = mat(THREE, 0x0f172a, { roughness: 0.35, metalness: 0.4 });
  const corpo = malha(THREE, new THREE.BoxGeometry(0.78, 0.16, 0.52), mCorpo);
  corpo.position.set(-0.55, 0.87, 0);
  raiz.add(corpo);

  // 3 Antenas articuladas
  const mAntena = mat(THREE, 0x1e293b, { roughness: 0.4, metalness: 0.5 });
  for (const ax of [-0.82, -0.55, -0.28]) {
    const ant = malha(THREE, new THREE.CylinderGeometry(0.025, 0.035, 0.62, 12), mAntena);
    ant.position.set(ax, 1.22, -0.18);
    ant.rotation.z = (ax + 0.55) * -0.25;
    raiz.add(ant);
  }

  // LEDs frontais do roteador
  const leds = [];
  for (let i = 0; i < 4; i++) {
    const mLed = mat(THREE, 0x22c55e, { emissive: 0x22c55e, emissiveIntensity: 0.85 });
    const led = malha(THREE, new THREE.SphereGeometry(0.032, 10, 8), mLed, false);
    led.position.set(-0.76 + i * 0.14, 0.87, 0.27);
    raiz.add(led);
    leds.push({ mesh: led, mat: mLed });
  }

  // Anéis de onda Wi-Fi propagando pelo ar
  const ondas = [];
  for (let i = 0; i < 4; i++) {
    const mOnda = mat(THREE, 0x38bdf8, {
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.75,
    });
    const anel = malha(THREE, new THREE.TorusGeometry(0.28 + i * 0.22, 0.032, 10, 24), mOnda, false);
    anel.position.set(-0.2 + i * 0.36, 1.35, 0);
    anel.rotation.y = Math.PI / 2;
    raiz.add(anel);
    ondas.push({ anel, mat: mOnda, idx: i });
  }

  // Celular distante no quarto com bolinha de carregamento ("travando")
  const celularGrp = new THREE.Group();
  celularGrp.position.set(1.15, 1.42, 0.12);
  celularGrp.rotation.y = -0.35;

  const mCel = mat(THREE, 0x1e293b, { roughness: 0.25, metalness: 0.6 });
  const chassiCel = malha(THREE, new THREE.BoxGeometry(0.54, 0.98, 0.08), mCel);
  const mTela = mat(THREE, 0x090d16, { emissive: 0xef4444, emissiveIntensity: 0.22 });
  const telaCel = malha(THREE, new THREE.BoxGeometry(0.46, 0.86, 0.02), mTela, false);
  telaCel.position.z = 0.045;

  const mSpinner = mat(THREE, 0xef4444, { emissive: 0xf97316, emissiveIntensity: 0.9 });
  const spinner = malha(THREE, new THREE.TorusGeometry(0.13, 0.028, 10, 18, Math.PI * 1.45), mSpinner, false);
  spinner.position.z = 0.065;

  celularGrp.add(chassiCel, telaCel, spinner);
  raiz.add(celularGrp);

  function atualizar(t, quedaSinal = 0.5) {
    const q = clamp(quedaSinal, 0, 1);
    spinner.rotation.z = -t * 5.2;
    celularGrp.position.y = 1.42 + Math.sin(t * 2.5) * 0.05;

    ondas.forEach((o, i) => {
      const fase = (t * 1.6 + i * 0.25) % 1;
      const enfraquece = clamp(1 - i * 0.24 * (0.4 + q * 0.8), 0.12, 1);
      o.anel.position.x = -0.35 + fase * 1.35;
      o.anel.scale.setScalar(0.55 + fase * 0.85);
      o.mat.opacity = (1 - fase) * 0.82 * enfraquece;
      if (q > 0.55 && i >= 2) {
        o.mat.color.setHex(0xef4444);
        o.mat.emissive.setHex(0xdc2626);
      } else {
        o.mat.color.setHex(0x38bdf8);
        o.mat.emissive.setHex(0x0284c7);
      }
    });

    leds.forEach((l, i) => {
      const alerta = q > 0.6 && i >= 2;
      l.mat.color.setHex(alerta ? 0xef4444 : 0x22c55e);
      l.mat.emissive.setHex(alerta ? 0xef4444 : 0x22c55e);
    });
  }

  return { raiz, ondas, celularGrp, atualizar };
}

/**
 * Frame 02 (Wi-Fi) — Roteador como "lâmpada invisível" preso atrás da TV/armário vs livre
 */
export function criarRoteadorArmario(THREE) {
  const raiz = new THREE.Group();

  // Base do armário/rack
  const mMadeira = mat(THREE, 0x78350f, { roughness: 0.75 });
  const base = malha(THREE, new THREE.BoxGeometry(2.1, 0.16, 1.1), mMadeira);
  base.position.y = 0.65;
  raiz.add(base);

  // Roteador brilhando no centro como uma lâmpada de ondas
  const mLamp = mat(THREE, 0xfacc15, { emissive: 0xf59e0b, emissiveIntensity: 0.9 });
  const bulboSinal = malha(THREE, new THREE.SphereGeometry(0.28, 16, 12), mLamp, false);
  bulboSinal.position.set(0, 1.18, 0);
  raiz.add(bulboSinal);

  const mBaseRot = mat(THREE, 0x0f172a, { roughness: 0.4 });
  const baseRot = malha(THREE, new THREE.BoxGeometry(0.75, 0.16, 0.48), mBaseRot);
  baseRot.position.set(0, 0.82, 0);
  raiz.add(baseRot);

  // Portas/barreiras do armário e TV que abafam o roteador
  const mPorta = mat(THREE, 0x451a03, { roughness: 0.8 });
  const portaEsq = malha(THREE, new THREE.BoxGeometry(0.92, 1.15, 0.12), mPorta);
  portaEsq.position.set(-0.52, 1.32, 0.42);
  const portaDir = malha(THREE, new THREE.BoxGeometry(0.92, 1.15, 0.12), mPorta);
  portaDir.position.set(0.52, 1.32, 0.42);
  raiz.add(portaEsq, portaDir);

  // Anéis luminosos de alcance do sinal
  const raios = [];
  for (let i = 0; i < 4; i++) {
    const mRaio = mat(THREE, 0x38bdf8, {
      emissive: 0x38bdf8,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.7,
    });
    const anel = malha(THREE, new THREE.TorusGeometry(0.42 + i * 0.26, 0.032, 10, 24), mRaio, false);
    anel.position.set(0, 1.18, 0);
    raiz.add(anel);
    raios.push({ anel, mat: mRaio, idx: i });
  }

  function atualizar(t, abafado = 1.0) {
    const ab = clamp(abafado, 0, 1);
    // Portas fecham quando abafado=1 e abrem quando abafado=0
    portaEsq.position.x = lerp(-1.18, -0.46, ab);
    portaDir.position.x = lerp(1.18, 0.46, ab);
    portaEsq.rotation.y = lerp(-0.85, 0, ab);
    portaDir.rotation.y = lerp(0.85, 0, ab);

    const alcance = lerp(1.35, 0.42, ab);
    bulboSinal.scale.setScalar(lerp(1.15, 0.72, ab) + Math.sin(t * 5) * 0.05);

    raios.forEach((r, i) => {
      const pulsoR = 1 + Math.sin(t * 3.5 - i * 0.7) * 0.12;
      r.anel.scale.setScalar(alcance * pulsoR);
      r.anel.rotation.x = 0.35 + Math.sin(t * 1.4 + i) * 0.25;
      r.anel.rotation.y = t * (0.4 + i * 0.12);
      r.mat.opacity = lerp(0.82, 0.22, ab);
      r.mat.color.setHex(ab > 0.5 ? 0xf59e0b : 0x38bdf8);
    });
  }

  return { raiz, portaEsq, portaDir, bulboSinal, raios, atualizar };
}

/**
 * Frame 03 (Wi-Fi) — Os 3 inimigos dentro de casa: Parede de tijolo, Espelho e Canos d'água
 */
export function criarParedeObstaculosCasa(THREE) {
  const raiz = new THREE.Group();

  // Parede de alvenaria/concreto no centro
  const mTijolo = mat(THREE, 0x9a3412, { roughness: 0.85 });
  const parede = malha(THREE, new THREE.BoxGeometry(0.36, 1.85, 1.35), mTijolo);
  parede.position.set(0.05, 1.35, 0);
  raiz.add(parede);

  // Espelho brilhante colado na face frontal da parede (rebate o sinal)
  const mEspelho = mat(THREE, 0xe0f2fe, {
    roughness: 0.08,
    metalness: 0.85,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.28,
  });
  const espelho = malha(THREE, new THREE.BoxGeometry(0.06, 1.25, 0.82), mEspelho);
  espelho.position.set(-0.16, 1.42, 0.15);
  raiz.add(espelho);

  // Canos hidráulicos azuis cheios de água (absorvem a onda)
  const mCano = mat(THREE, 0x0284c7, {
    roughness: 0.3,
    emissive: 0x0369a1,
    emissiveIntensity: 0.35,
  });
  for (const cz of [-0.38, 0.0, 0.38]) {
    const cano = malha(THREE, new THREE.CylinderGeometry(0.085, 0.085, 1.88, 14), mCano);
    cano.position.set(0.28, 1.35, cz);
    raiz.add(cano);
  }

  // Esferas de sinal batendo no espelho e voltando vs tentando atravessar
  const pulsos = [];
  for (let i = 0; i < 6; i++) {
    const mPulso = mat(THREE, 0x38bdf8, { emissive: 0x00f0ff, emissiveIntensity: 0.75 });
    const esf = malha(THREE, new THREE.SphereGeometry(0.095, 12, 10), mPulso, false);
    raiz.add(esf);
    pulsos.push({ esf, mat: mPulso, idx: i });
  }

  function atualizar(t) {
    pulsos.forEach((p, i) => {
      const ciclo = (t * 0.95 + i * 0.17) % 1;
      const yBase = 0.85 + (i % 3) * 0.48;
      const zBase = (i % 2 === 0 ? 0.15 : -0.25);

      if (ciclo < 0.5) {
        // Indo em direção à parede/espelho
        const u = ciclo / 0.5;
        p.esf.position.set(lerp(-1.25, -0.22, u), yBase, zBase);
        p.esf.scale.setScalar(1.0);
        p.mat.color.setHex(0x38bdf8);
        p.mat.emissive.setHex(0x00f0ff);
      } else {
        // Rebateu no espelho ou foi sugado pela água do cano
        const u = (ciclo - 0.5) / 0.5;
        if (i % 2 === 0) {
          // Rebate de volta!
          p.esf.position.set(lerp(-0.22, -1.15, u), yBase + u * 0.35, zBase);
          p.mat.color.setHex(0xf59e0b);
          p.mat.emissive.setHex(0xea580c);
          p.esf.scale.setScalar(1.0 - u * 0.4);
        } else {
          // Atravessa enfraquecido após os canos d'água
          p.esf.position.set(lerp(0.25, 1.15, u), yBase, zBase);
          p.mat.color.setHex(0xef4444);
          p.mat.emissive.setHex(0xdc2626);
          p.esf.scale.setScalar(0.42);
        }
      }
    });
  }

  return { raiz, parede, espelho, pulsos, atualizar };
}

/**
 * Frame 04 (Wi-Fi) — O Micro-ondas na cozinha emitindo ondas na mesma frequência e atropelando o Wi-Fi
 */
export function criarMicroondasInterferencia(THREE) {
  const raiz = new THREE.Group();

  // Bancada da cozinha
  const mBancada = mat(THREE, 0x334155, { roughness: 0.7 });
  const bancada = malha(THREE, new THREE.BoxGeometry(1.75, 0.16, 1.0), mBancada);
  bancada.position.set(0.15, 0.72, 0);
  raiz.add(bancada);

  // Gabinete do micro-ondas
  const mGabinete = mat(THREE, 0xe2e8f0, { roughness: 0.3, metalness: 0.35 });
  const gabinete = malha(THREE, new THREE.BoxGeometry(1.42, 0.86, 0.82), mGabinete);
  gabinete.position.set(0.15, 1.23, 0);
  raiz.add(gabinete);

  // Visor escuro/laranja aceso do micro-ondas
  const mVisor = mat(THREE, 0xf97316, {
    roughness: 0.15,
    emissive: 0xea580c,
    emissiveIntensity: 0.75,
  });
  const visor = malha(THREE, new THREE.BoxGeometry(0.88, 0.56, 0.06), mVisor, false);
  visor.position.set(-0.02, 1.24, 0.40);
  raiz.add(visor);

  // Painel digital lateral do micro-ondas
  const mPainel = mat(THREE, 0x0f172a, { roughness: 0.3 });
  const painel = malha(THREE, new THREE.BoxGeometry(0.28, 0.64, 0.06), mPainel, false);
  painel.position.set(0.64, 1.24, 0.40);
  raiz.add(painel);

  // Anéis vermelhos/laranjas de ruído do micro-ondas colidindo com anéis azuis do Wi-Fi
  const ondasRuido = [];
  for (let i = 0; i < 4; i++) {
    const mRuido = mat(THREE, 0xef4444, {
      emissive: 0xf97316,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.75,
    });
    const anel = malha(THREE, new THREE.TorusGeometry(0.45 + i * 0.25, 0.038, 10, 22), mRuido, false);
    anel.position.set(0.15, 1.24, 0.2);
    raiz.add(anel);
    ondasRuido.push({ anel, mat: mRuido, idx: i });
  }

  function atualizar(t, ligado = 1.0) {
    const lg = clamp(ligado, 0, 1);
    // Micro-ondas treme levemente quando ligado no máximo
    gabinete.position.x = 0.15 + Math.sin(t * 32) * 0.015 * lg;
    visor.material.emissiveIntensity = lerp(0.15, 0.95 + Math.sin(t * 14) * 0.2, lg);

    ondasRuido.forEach((o, i) => {
      const fase = (t * 1.8 + i * 0.25) % 1;
      o.anel.scale.setScalar(0.55 + fase * 1.15 * (0.3 + lg * 0.7));
      o.anel.rotation.x = Math.sin(t * 3 + i) * 0.45;
      o.anel.rotation.y = Math.cos(t * 2.5 + i) * 0.45;
      o.mat.opacity = (1 - fase) * 0.85 * lg;
    });
  }

  return { raiz, gabinete, visor, ondasRuido, atualizar };
}

/**
 * Frame 05 (Wi-Fi) — O prédio/rua à noite com dezenas de redes dos vizinhos se atropelando
 */
export function criarVizinhosCongestionados(THREE) {
  const raiz = new THREE.Group();

  // Prédio residencial de vários andares
  const mPredio = mat(THREE, 0x1e293b, { roughness: 0.6, metalness: 0.25 });
  const torre = malha(THREE, new THREE.BoxGeometry(1.55, 2.15, 0.95), mPredio);
  torre.position.set(0.15, 1.42, -0.15);
  raiz.add(torre);

  // Janelas acesas dos apartamentos dos vizinhos
  const mJanela = mat(THREE, 0xfef08a, { emissive: 0xfacc15, emissiveIntensity: 0.8 });
  const posJanelas = [
    [-0.32, 0.85], [0.15, 0.85], [0.62, 0.85],
    [-0.32, 1.38], [0.15, 1.38], [0.62, 1.38],
    [-0.32, 1.92], [0.15, 1.92], [0.62, 1.92],
  ];
  posJanelas.forEach(([jx, jy]) => {
    const jan = malha(THREE, new THREE.BoxGeometry(0.28, 0.32, 0.06), mJanela, false);
    jan.position.set(jx, jy, 0.34);
    raiz.add(jan);
  });

  // Bolhas/anéis coloridos das redes Wi-Fi dos vizinhos se cruzando e engarrafando o ar
  const coresVizinhos = [0xef4444, 0xf97316, 0xa855f7, 0xec4899, 0xeab308, 0x38bdf8];
  const redes = [];
  for (let i = 0; i < coresVizinhos.length; i++) {
    const cor = coresVizinhos[i];
    const mRede = mat(THREE, cor, {
      emissive: cor,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.68,
    });
    const anel = malha(THREE, new THREE.TorusGeometry(0.48 + (i % 3) * 0.16, 0.035, 10, 22), mRede, false);
    const [px, py] = posJanelas[i];
    anel.position.set(px, py, 0.42);
    raiz.add(anel);
    redes.push({ anel, mat: mRede, idx: i });
  }

  function atualizar(t, congestionamento = 0.8) {
    const cg = clamp(congestionamento, 0.1, 1.0);
    redes.forEach((r, i) => {
      const pulso = 0.75 + Math.sin(t * (3.2 + i * 0.4) + i) * 0.35 * cg;
      r.anel.scale.setScalar(pulso);
      r.anel.rotation.z = t * (i % 2 === 0 ? 1.5 : -1.5);
      r.anel.rotation.x = Math.sin(t * 2 + i) * 0.35;
    });
  }

  return { raiz, torre, redes, atualizar };
}

/**
 * Frame 06 (Wi-Fi) — Pilha Explodida de 7 Níveis da Jornada do Wi-Fi na Vida Real
 */
export function criarPilhaExplodidaWifi(THREE) {
  const grupo = new THREE.Group();

  const definicoes = [
    { id: "roteador",   nome: "1. Roteador no Alto",   cor: 0x22c55e, emissive: 0x16a34a, r: 0.66, h: 0.18, yAlvo: -1.12 },
    { id: "armario",    nome: "2. Fora da Gaveta",     cor: 0x38bdf8, emissive: 0x0284c7, r: 0.58, h: 0.18, yAlvo: -0.70 },
    { id: "parede",     nome: "3. Parede de Tijolo",   cor: 0xd97706, emissive: 0xb45309, r: 0.62, h: 0.19, yAlvo: -0.28 },
    { id: "espelho",    nome: "4. Espelho e Canos",    cor: 0x06b6d4, emissive: 0x00f0ff, r: 0.48, h: 0.21, yAlvo:  0.15 },
    { id: "microondas", nome: "5. Micro-ondas Ligado", cor: 0xef4444, emissive: 0xdc2626, r: 0.54, h: 0.20, yAlvo:  0.58 },
    { id: "vizinhos",   nome: "6. Redes dos Vizinhos", cor: 0xa855f7, emissive: 0x9333ea, r: 0.58, h: 0.18, yAlvo:  1.00 },
    { id: "celular",    nome: "7. Vídeo Liso na Mão",  cor: 0xfacc15, emissive: 0xeab308, r: 0.74, h: 0.22, yAlvo:  1.42 },
  ];

  const pecas = [];
  for (let i = 0; i < definicoes.length; i++) {
    const d = definicoes[i];
    const pecaGrp = new THREE.Group();
    const cilindro = malha(
      THREE,
      new THREE.CylinderGeometry(d.r, d.r * 0.88, d.h, 36),
      mat(THREE, d.cor, {
        roughness: 0.28,
        metalness: 0.25,
        emissive: d.emissive,
        emissiveIntensity: 0.35,
      })
    );
    pecaGrp.add(cilindro);

    const anel = new THREE.Mesh(
      new THREE.TorusGeometry(d.r + 0.025, 0.016, 12, 36),
      new THREE.MeshBasicMaterial({ color: d.emissive, transparent: true, opacity: 0.75 })
    );
    anel.rotation.x = Math.PI / 2;
    pecaGrp.add(anel);

    grupo.add(pecaGrp);
    pecas.push({ ...d, grp: pecaGrp, cilindro, anel });
  }

  const eixoCentral = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 2.9, 16),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 })
  );
  eixoCentral.position.y = 0.16;
  grupo.add(eixoCentral);

  function atualizar(t, tExplosao = 0.2) {
    const uExp = suavissimo(faixa(t, tExplosao, tExplosao + 1.4));
    for (let i = 0; i < pecas.length; i++) {
      const p = pecas[i];
      const yCompacto = -0.4 + i * 0.18;
      p.grp.position.y = lerp(yCompacto, p.yAlvo, uExp) + Math.sin(t * 2.4 + i * 0.65) * 0.03;
      p.grp.rotation.y = t * (0.55 + i * 0.08) + i * 0.3;
      p.grp.rotation.x = 0.16;
    }
  }

  return { grupo, pecas, atualizar };
}

// --------------------------------------------------------------------------------------------
// Props do vídeo "Por Que os Países Estão Pedindo Para Você Estocar Comida?"
// Três cenários procedurais: mercado vazio, silo estratégico e despensa doméstica.
// --------------------------------------------------------------------------------------------

function criarGondolaMercado(THREE, r, xUnidade, zUnidade, ocupacao) {
  const grupo = new THREE.Group();
  const mBase = mat(THREE, 0x1f2937, { roughness: 0.72, metalness: 0.25 });
  const mChapa = mat(THREE, 0x94a3b8, { roughness: 0.42, metalness: 0.55 });
  const mPrateleira = mat(THREE, 0xcbd5e1, { roughness: 0.55, metalness: 0.35 });

  const base = malha(THREE, new THREE.BoxGeometry(1.5, 0.34, 4.3), mBase);
  base.position.set(xUnidade, 0.17, zUnidade);
  grupo.add(base);

  const spine = malha(THREE, new THREE.BoxGeometry(0.14, 2.55, 4.3), mChapa);
  spine.position.set(xUnidade, 1.45, zUnidade);
  grupo.add(spine);

  const coresLata = [0xef4444, 0xf59e0b, 0x22c55e, 0x38bdf8, 0xe2e8f0, 0xa855f7, 0xfacc15];
  const niveis = [0.58, 1.22, 1.86, 2.5];
  const lados = [-1, 1];

  for (const lado of lados) {
    for (let n = 0; n < niveis.length; n++) {
      const prateleira = malha(THREE, new THREE.BoxGeometry(1.12, 0.08, 4.3), mPrateleira);
      prateleira.position.set(xUnidade + lado * 0.62, niveis[n], zUnidade);
      grupo.add(prateleira);

      for (let slot = 0; slot < 12; slot++) {
        if (r() > ocupacao) continue;
        const cor = coresLata[Math.floor(r() * coresLata.length)];
        const lata = malha(
          THREE,
          new THREE.CylinderGeometry(0.105, 0.105, 0.3, 14),
          mat(THREE, cor, { roughness: 0.38, metalness: 0.42 })
        );
        lata.position.set(
          xUnidade + lado * (0.42 + r() * 0.32),
          niveis[n] + 0.19,
          zUnidade - 1.9 + slot * 0.345
        );
        lata.rotation.y = r() * 0.4;
        grupo.add(lata);
      }
    }
  }

  grupo.userData.altura = 2.8;
  return grupo;
}

/**
 * Mercado noturno em ruína: corredor central, gôndolas quase vazias, luminárias que piscam.
 * Retorna { raiz, atualizar(t, intensidadeLuz) }.
 */
export function criarMercadoVazio(THREE, opcoes = {}) {
  const raiz = new THREE.Group();
  const r = criarRand(opcoes.semente ?? 90210);
  const ocupacao = opcoes.ocupacao ?? 0.16;

  const mChao = mat(THREE, 0x151b26, { roughness: 0.88, metalness: 0.08 });
  const mParede = mat(THREE, 0x0d1420, { roughness: 0.9 });
  const mTeto = mat(THREE, 0x0a1018, { roughness: 0.95 });

  const chao = malha(THREE, new THREE.BoxGeometry(22, 0.3, 20), mChao);
  chao.position.set(0, -0.15, -2);
  raiz.add(chao);

  const paredeFundo = malha(THREE, new THREE.BoxGeometry(22, 5.2, 0.3), mParede);
  paredeFundo.position.set(0, 2.6, -8.2);
  raiz.add(paredeFundo);

  const teto = malha(THREE, new THREE.BoxGeometry(22, 0.25, 20), mTeto);
  teto.position.set(0, 4.55, -2);
  raiz.add(teto);

  const luminarias = [];
  const luzes = [];
  for (let i = 0; i < 4; i++) {
    const z = -6.2 + i * 3.1;
    const material = new THREE.MeshBasicMaterial({ color: 0xdbeafe });
    const painel = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.44), material);
    painel.rotation.x = Math.PI / 2;
    painel.position.set(0, 4.42, z);
    raiz.add(painel);
    luminarias.push({ material, base: new THREE.Color(0xdbeafe) });

    const luz = new THREE.PointLight(0xdbeafe, 1.15, 10, 1.6);
    luz.position.set(0, 4.1, z);
    raiz.add(luz);
    luzes.push(luz);
  }

  for (const x of [-2.75, 2.75]) {
    for (const z of [-4.6, 0.4]) {
      raiz.add(criarGondolaMercado(THREE, r, x, z, ocupacao));
    }
  }

  // Carrinho vazio tombado ao fundo: aro + cesto de grades
  const carrinho = new THREE.Group();
  const mGrade = mat(THREE, 0x94a3b8, { roughness: 0.35, metalness: 0.8 });
  for (let i = 0; i < 4; i++) {
    const aro = malha(THREE, new THREE.TorusGeometry(0.18, 0.025, 8, 16), mGrade);
    aro.rotation.y = Math.PI / 2;
    aro.position.set(-0.3 + i * 0.2, 0.18, 0);
    carrinho.add(aro);
  }
  const cesto = malha(THREE, new THREE.BoxGeometry(0.72, 0.42, 0.5), mGrade);
  cesto.position.set(0.1, 0.42, 0);
  carrinho.add(cesto);
  carrinho.position.set(-1.2, 0, -6.2);
  carrinho.rotation.z = 0.32;
  raiz.add(carrinho);

  // Poça escura no piso
  const poco = new THREE.Mesh(
    new THREE.CircleGeometry(1.1, 28),
    new THREE.MeshBasicMaterial({ color: 0x02060d, transparent: true, opacity: 0.55, depthWrite: false })
  );
  poco.rotation.x = -Math.PI / 2;
  poco.position.set(0.9, 0.012, 2.4);
  raiz.add(poco);

  const corTemp = new THREE.Color();
  function atualizar(t, intensidade = 1) {
    for (let i = 0; i < luminarias.length; i++) {
      const falha = i === 1 && Math.sin(t * 3.7 + 1.4) > 0.9;
      const cintila = 0.82 + 0.18 * Math.sin(t * 11 + i * 2.3);
      const n = (falha ? 0.08 : cintila) * intensidade;
      corTemp.copy(luminarias[i].base).multiplyScalar(Math.max(0.04, n));
      luminarias[i].material.color.copy(corTemp);
      luzes[i].intensity = 1.3 * n;
    }
  }

  atualizar(0, 1);
  return { raiz, atualizar, luminarias, luzes };
}

/**
 * Complexo de silos de grãos ao entardecer, com esteira, caminhão e sinalizadores.
 * Retorna { raiz, atualizar(t) }.
 */
export function criarSiloEstrategico(THREE, opcoes = {}) {
  const raiz = new THREE.Group();
  const mConcreto = mat(THREE, 0x8a94a6, { roughness: 0.72, metalness: 0.22 });
  const mAco = mat(THREE, 0x64748b, { roughness: 0.42, metalness: 0.68 });
  const mEscuro = mat(THREE, 0x1e293b, { roughness: 0.62, metalness: 0.35 });
  const mAmarelo = mat(THREE, 0xfacc15, { roughness: 0.45, metalness: 0.3, emissive: 0xca8a04, emissiveIntensity: 0.18 });

  const plataforma = malha(THREE, new THREE.BoxGeometry(10, 0.45, 5.2), mConcreto);
  plataforma.position.set(0, 0.225, 0);
  raiz.add(plataforma);

  const sinalizadores = [];
  const silos = [-2.7, 0, 2.7];
  silos.forEach((x, idx) => {
    const corpo = malha(THREE, new THREE.CylinderGeometry(1.18, 1.18, 3.8, 28), mAco);
    corpo.position.set(x, 2.4, 0);
    raiz.add(corpo);

    const anelBase = malha(THREE, new THREE.CylinderGeometry(1.22, 1.22, 0.12, 28), mAmarelo);
    anelBase.position.set(x, 0.62, 0);
    raiz.add(anelBase);
    const anelTopo = malha(THREE, new THREE.CylinderGeometry(1.22, 1.22, 0.1, 28), mAmarelo);
    anelTopo.position.set(x, 3.9, 0);
    raiz.add(anelTopo);

    const telhado = malha(THREE, new THREE.ConeGeometry(1.34, 0.92, 28), mEscuro);
    telhado.position.set(x, 4.75, 0);
    raiz.add(telhado);

    const sinal = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    sinal.position.set(x, 5.28, 0);
    raiz.add(sinal);
    sinalizadores.push({ malha: sinal, fase: idx * 1.7 });

    // Escada vertical no silo central
    if (idx === 1) {
      const trilhoE = malha(THREE, new THREE.BoxGeometry(0.06, 3.4, 0.06), mAco);
      trilhoE.position.set(x - 0.26, 2.35, 1.16);
      const trilhoD = trilhoE.clone();
      trilhoD.position.x = x + 0.26;
      raiz.add(trilhoE, trilhoD);
      for (let d = 0; d < 10; d++) {
        const degrau = malha(THREE, new THREE.BoxGeometry(0.56, 0.05, 0.05), mAco);
        degrau.position.set(x, 0.72 + d * 0.32, 1.16);
        raiz.add(degrau);
      }
    }
  });

  // Esteira inclinada levando grãos ao topo do silo central
  const esteira = new THREE.Group();
  const mBelt = mat(THREE, 0x0f172a, { roughness: 0.8 });
  const tubo = malha(THREE, new THREE.BoxGeometry(5.6, 0.26, 0.8), mAco);
  const correia = malha(THREE, new THREE.BoxGeometry(5.6, 0.06, 0.62), mBelt);
  correia.position.y = 0.14;
  esteira.add(tubo, correia);
  esteira.position.set(-3.9, 2.35, 1.3);
  esteira.rotation.z = 0.72;
  raiz.add(esteira);

  const graos = [];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
    raiz.add(g);
    graos.push(g);
  }

  // Caminhão simples na lateral
  const caminhao = new THREE.Group();
  const mCabine = mat(THREE, 0xb91c1c, { roughness: 0.5, metalness: 0.3 });
  const mCarga = mat(THREE, 0xd6d3d1, { roughness: 0.7, metalness: 0.15 });
  const bau = malha(THREE, new THREE.BoxGeometry(2.5, 1.5, 1.15), mCarga);
  bau.position.set(0.3, 1.15, 0);
  const cabine = malha(THREE, new THREE.BoxGeometry(1.1, 1.25, 1.1), mCabine);
  cabine.position.set(-1.55, 1.02, 0);
  const vidro = malha(THREE, new THREE.BoxGeometry(0.06, 0.45, 0.9), mat(THREE, 0x38bdf8, { roughness: 0.18, metalness: 0.4 }), false);
  vidro.position.set(-2.1, 1.28, 0);
  caminhao.add(bau, cabine, vidro);
  for (const x of [-1.55, 0.9]) {
    for (const z of [-0.55, 0.55]) {
      const roda = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.18, 16), mEscuro);
      roda.rotation.x = Math.PI / 2;
      roda.position.set(x, 0.3, z);
      caminhao.add(roda);
    }
  }
  caminhao.position.set(5.2, 0, 2.1);
  caminhao.rotation.y = -0.38;
  raiz.add(caminhao);

  function atualizar(t) {
    sinalizadores.forEach((s) => {
      const pisca = Math.sin(t * 4.2 + s.fase) > 0.55;
      s.malha.material.color.setHex(pisca ? 0xff3b3b : 0x5b1414);
    });
    graos.forEach((g, i) => {
      const u = ((t * 0.22 + i / graos.length) % 1 + 1) % 1;
      g.position.set(-6.1 + u * 4.4, 0.9 + u * 3.05, 1.47 + Math.sin(u * 3.2) * 0.04);
    });
  }

  atualizar(0);
  return { raiz, atualizar, sinalizadores };
}

function criarPoteDespensa(THREE, r, x, y, z, tipo) {
  const grupo = new THREE.Group();
  if (tipo === 0) {
    const cor = [0xd97706, 0xb45309, 0x84cc16, 0xef4444][Math.floor(r() * 4)];
    const corpo = malha(THREE, new THREE.CylinderGeometry(0.155, 0.155, 0.34, 16), mat(THREE, cor, { roughness: 0.32, metalness: 0.18 }));
    const tampa = malha(THREE, new THREE.CylinderGeometry(0.165, 0.165, 0.06, 16), mat(THREE, 0x94a3b8, { roughness: 0.28, metalness: 0.62 }));
    tampa.position.y = 0.2;
    grupo.add(corpo, tampa);
  } else if (tipo === 1) {
    const cor = [0x38bdf8, 0x0ea5e9, 0x7dd3fc][Math.floor(r() * 3)];
    const corpo = malha(THREE, new THREE.CylinderGeometry(0.085, 0.085, 0.38, 14), mat(THREE, cor, { roughness: 0.2, metalness: 0.15, transparent: true, opacity: 0.82 }));
    const gargalo = malha(THREE, new THREE.CylinderGeometry(0.045, 0.06, 0.16, 12), mat(THREE, cor, { roughness: 0.2, transparent: true, opacity: 0.82 }));
    gargalo.position.y = 0.27;
    grupo.add(corpo, gargalo);
  } else if (tipo === 2) {
    const cor = [0xb45309, 0x92400e, 0xa16207][Math.floor(r() * 3)];
    const corpo = malha(THREE, new THREE.BoxGeometry(0.3, 0.42, 0.22), mat(THREE, cor, { roughness: 0.8 }));
    grupo.add(corpo);
  } else {
    const corpo = malha(THREE, new THREE.SphereGeometry(0.28, 16, 12), mat(THREE, 0x8b6f47, { roughness: 0.92 }));
    corpo.scale.set(1, 0.78, 0.8);
    corpo.position.y = 0.16;
    grupo.add(corpo);
  }
  grupo.position.set(x, y, z);
  grupo.rotation.y = r() * 0.8 - 0.4;
  return grupo;
}

/**
 * Despensa doméstica: parede de madeira, três prateleiras e mantimentos organizados.
 * Retorna { raiz, atualizar(t) }.
 */
export function criarDespensa(THREE, opcoes = {}) {
  const raiz = new THREE.Group();
  const r = criarRand(opcoes.semente ?? 4471);
  const cheia = opcoes.cheia !== false;

  const mChao = mat(THREE, 0x1b1510, { roughness: 0.92 });
  const mMadeira = mat(THREE, 0x6b4a2f, { roughness: 0.82 });
  const mMadeiraEscura = mat(THREE, 0x4a3320, { roughness: 0.86 });

  const chao = malha(THREE, new THREE.BoxGeometry(7.4, 0.22, 4.2), mChao);
  chao.position.set(0, -0.11, 0);
  raiz.add(chao);

  for (let i = 0; i < 9; i++) {
    const tabua = malha(THREE, new THREE.BoxGeometry(0.78, 4.5, 0.16), i % 2 ? mMadeira : mMadeiraEscura);
    tabua.position.set(-3.12 + i * 0.78, 2.25, -1.9);
    raiz.add(tabua);
  }

  const paredeEsq = malha(THREE, new THREE.BoxGeometry(0.16, 4.5, 4.2), mMadeiraEscura);
  paredeEsq.position.set(-3.5, 2.25, 0);
  const paredeDir = paredeEsq.clone();
  paredeDir.position.x = 3.5;
  raiz.add(paredeEsq, paredeDir);

  const niveis = [0.95, 2.0, 3.05];
  for (const y of niveis) {
    const prateleira = malha(THREE, new THREE.BoxGeometry(5.9, 0.14, 1.15), mMadeira);
    prateleira.position.set(0, y, -1.12);
    raiz.add(prateleira);
    for (const x of [-2.7, 0, 2.7]) {
      const mão = malha(THREE, new THREE.BoxGeometry(0.1, 0.42, 0.9), mMadeiraEscura);
      mão.position.set(x, y - 0.28, -1.12);
      raiz.add(mão);
    }
  }

  const tipos = [0, 0, 1, 2, 2, 3];
  for (let n = 0; n < niveis.length; n++) {
    for (let slot = 0; slot < 14; slot++) {
      if (r() > (cheia ? 0.88 : 0.32)) continue;
      const tipo = tipos[Math.floor(r() * tipos.length)];
      const x = -2.55 + slot * 0.39;
      const z = -1.12 + (r() - 0.5) * 0.34;
      const item = criarPoteDespensa(THREE, r, x, niveis[n] + 0.23, z, tipo);
      item.scale.setScalar(0.98 + r() * 0.16);
      raiz.add(item);
    }
  }

  // Caixotes e galões no chão
  for (const [x, z, rot] of [[-2.25, 0.6, 0.12], [2.3, 0.45, -0.18]]) {
    const caixote = new THREE.Group();
    const corpo = malha(THREE, new THREE.BoxGeometry(0.95, 0.62, 0.7), mMadeira);
    corpo.position.y = 0.31;
    for (let i = 0; i < 3; i++) {
      const tabua = malha(THREE, new THREE.BoxGeometry(0.98, 0.05, 0.72), mMadeiraEscura);
      tabua.position.set(0, 0.12 + i * 0.22, 0);
      caixote.add(tabua);
    }
    caixote.add(corpo);
    caixote.position.set(x, 0, z);
    caixote.rotation.y = rot;
    raiz.add(caixote);
  }

  for (let i = 0; i < 6; i++) {
    const galao = malha(THREE, new THREE.CylinderGeometry(0.13, 0.13, 0.46, 14), mat(THREE, 0x7dd3fc, { roughness: 0.24, metalness: 0.1, transparent: true, opacity: 0.72 }));
    galao.position.set(1.15 + (i % 3) * 0.28, 0.23, 1.1 + Math.floor(i / 3) * 0.28);
    raiz.add(galao);
  }

  const luzQuente = new THREE.PointLight(0xffd9a0, opcoes.quente === false ? 0.35 : 2.0, 8, 1.4);
  luzQuente.position.set(0, 3.7, -0.4);
  raiz.add(luzQuente);
  const bulbo = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffe0b0 }));
  bulbo.position.copy(luzQuente.position);
  raiz.add(bulbo);

  function atualizar(t) {
    const n = 1 + Math.sin(t * 2.2) * 0.025 + (Math.sin(t * 17.3) > 0.985 ? -0.12 : 0);
    luzQuente.intensity = (opcoes.quente === false ? 0.35 : 2.0) * Math.max(0.86, n);
  }

  atualizar(0);
  return { raiz, atualizar, luzQuente };
}
