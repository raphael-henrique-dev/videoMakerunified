// motor/3d/character.js — Mascote 3D articulado (menino de moletom azul) e sistema de atuação procedural

import { clamp, lerp, lerp3, faixa, suave, pulso, quica, mat, malha, manchaSombra } from "./math.js";

export function criarBoneco(THREE, opcoes = {}) {
  const corCamisa = opcoes.camisa ?? 0x1e78d6;
  const corCalca = opcoes.calca ?? 0x26334d;
  const corPele = opcoes.pele ?? 0xffcfa8;
  const corCabelo = opcoes.cabelo ?? 0x2b1b12;
  const corSapato = opcoes.sapato ?? 0xd93829;
  const escala = opcoes.escala ?? 1;

  const raiz = new THREE.Group();
  raiz.scale.setScalar(escala);

  const mPele = mat(THREE, corPele, { roughness: 0.58 });
  const mBochecha = mat(THREE, 0xff8a7a, { roughness: 0.7, transparent: true, opacity: 0.45 });
  const mCamisa = mat(THREE, corCamisa, { roughness: 0.62 });
  const mPunho = mat(THREE, 0x1558a3, { roughness: 0.65 });
  const mCalca = mat(THREE, corCalca, { roughness: 0.72 });
  const mCabelo = mat(THREE, corCabelo, { roughness: 0.68 });
  const mSapato = mat(THREE, corSapato, { roughness: 0.48 });
  const mSola = mat(THREE, 0xf8fafc, { roughness: 0.5 });
  const mOlhoBranco = mat(THREE, 0xffffff, { roughness: 0.2 });
  const mIris = mat(THREE, 0x1d4ed8, { roughness: 0.25 });
  const mPreto = mat(THREE, 0x111827, { roughness: 0.3 });
  const mBrilho = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mMochila = mat(THREE, 0xe6951e, { roughness: 0.58 });
  const mAlca = mat(THREE, 0x9a5b13, { roughness: 0.68 });

  // Sombra no chão
  const sombra = manchaSombra(THREE, 0.62);
  raiz.add(sombra);

  const corpo = new THREE.Group();
  raiz.add(corpo);

  // Tronco (moletom)
  const tronco = malha(THREE, new THREE.CylinderGeometry(0.34, 0.38, 0.86, 28), mCamisa);
  tronco.position.y = 1.05;
  corpo.add(tronco);

  const ombros = malha(THREE, new THREE.SphereGeometry(0.35, 28, 20), mCamisa);
  ombros.position.y = 1.42;
  ombros.scale.set(1.06, 0.45, 0.88);
  corpo.add(ombros);

  const quadril = malha(THREE, new THREE.SphereGeometry(0.37, 28, 20), mCalca);
  quadril.position.y = 0.64;
  quadril.scale.set(1.0, 0.5, 0.9);
  corpo.add(quadril);

  // Capuz e bolso canguru
  const capuz = malha(THREE, new THREE.TorusGeometry(0.24, 0.075, 16, 28), mCamisa);
  capuz.position.set(0, 1.47, -0.05);
  capuz.rotation.x = Math.PI / 2 + 0.22;
  corpo.add(capuz);

  const bolso = malha(THREE, new THREE.BoxGeometry(0.38, 0.22, 0.12), mPunho);
  bolso.position.set(0, 0.84, 0.31);
  corpo.add(bolso);

  // Mochila amarela
  if (opcoes.mochila !== false) {
    const mochila = new THREE.Group();
    const corpoMochila = malha(THREE, new THREE.BoxGeometry(0.5, 0.58, 0.26), mMochila);
    corpoMochila.position.set(0, 1.12, -0.38);
    const topoMochila = malha(THREE, new THREE.CylinderGeometry(0.25, 0.25, 0.26, 24), mMochila);
    topoMochila.rotation.z = Math.PI / 2;
    topoMochila.position.set(0, 1.41, -0.38);
    const bolsoMochila = malha(THREE, new THREE.BoxGeometry(0.36, 0.26, 0.1), mAlca);
    bolsoMochila.position.set(0, 1.02, -0.52);
    mochila.add(corpoMochila, topoMochila, bolsoMochila);
    corpo.add(mochila);
  }

  // Pescoço e Cabeça
  const pescoco = malha(THREE, new THREE.CylinderGeometry(0.13, 0.15, 0.18, 20), mPele);
  pescoco.position.y = 1.54;
  corpo.add(pescoco);

  const cabeca = new THREE.Group();
  cabeca.position.set(0, 1.92, 0);
  corpo.add(cabeca);

  const cranio = malha(THREE, new THREE.SphereGeometry(0.42, 32, 28), mPele);
  cranio.scale.set(1.02, 0.98, 0.98);
  cabeca.add(cranio);

  // Orelhas e bochechas
  for (const s of [-1, 1]) {
    const orelha = malha(THREE, new THREE.SphereGeometry(0.095, 18, 16), mPele);
    orelha.position.set(s * 0.41, -0.02, -0.02);
    orelha.scale.set(0.6, 1.0, 0.8);
    cabeca.add(orelha);

    const bochecha = malha(THREE, new THREE.SphereGeometry(0.075, 16, 14), mBochecha, false);
    bochecha.position.set(s * 0.24, -0.08, 0.35);
    bochecha.scale.set(1.2, 0.75, 0.4);
    cabeca.add(bochecha);
  }

  const nariz = malha(THREE, new THREE.SphereGeometry(0.062, 18, 16), mPele);
  nariz.position.set(0, -0.02, 0.42);
  cabeca.add(nariz);

  // Cabelo estilizado com topete
  const cabeloGrp = new THREE.Group();
  const touca = malha(THREE, new THREE.SphereGeometry(0.44, 28, 24, 0, Math.PI * 2, 0, Math.PI * 0.58), mCabelo);
  touca.position.set(0, 0.04, -0.02);
  touca.rotation.x = -0.18;
  cabeloGrp.add(touca);

  const topete1 = malha(THREE, new THREE.ConeGeometry(0.14, 0.32, 18), mCabelo);
  topete1.position.set(0.06, 0.44, 0.22);
  topete1.rotation.set(0.55, 0, -0.25);
  const topete2 = malha(THREE, new THREE.ConeGeometry(0.11, 0.26, 18), mCabelo);
  topete2.position.set(-0.1, 0.42, 0.18);
  topete2.rotation.set(0.45, 0, 0.22);
  cabeloGrp.add(topete1, topete2);
  cabeca.add(cabeloGrp);

  // Olhos compostos (esclera + íris + pupila + brilho) e sobrancelhas
  const olhos = [];
  const sobrancelhas = [];
  for (const s of [-1, 1]) {
    const olhoGrp = new THREE.Group();
    olhoGrp.position.set(s * 0.15, 0.05, 0.37);

    const esclera = malha(THREE, new THREE.SphereGeometry(0.082, 20, 18), mOlhoBranco, false);
    esclera.scale.set(1.0, 1.12, 0.55);
    const iris = malha(THREE, new THREE.SphereGeometry(0.052, 18, 16), mIris, false);
    iris.position.z = 0.032;
    iris.scale.set(1.0, 1.05, 0.45);
    const pupila = malha(THREE, new THREE.SphereGeometry(0.032, 16, 14), mPreto, false);
    pupila.position.z = 0.048;
    pupila.scale.set(1.0, 1.0, 0.4);
    const brilho = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), mBrilho);
    brilho.position.set(0.018, 0.022, 0.062);

    olhoGrp.add(esclera, iris, pupila, brilho);
    cabeca.add(olhoGrp);
    olhos.push(olhoGrp);

    const sob = malha(THREE, new THREE.BoxGeometry(0.14, 0.032, 0.035), mCabelo, false);
    sob.position.set(s * 0.15, 0.19, 0.39);
    cabeca.add(sob);
    sobrancelhas.push(sob);
  }

  // Bocas intercambiáveis para expressões faciais
  const bocas = {};
  const bocaSorriso = malha(
    THREE,
    new THREE.TorusGeometry(0.085, 0.02, 14, 24, Math.PI),
    mPreto,
    false
  );
  bocaSorriso.position.set(0, -0.12, 0.39);
  bocaSorriso.rotation.x = Math.PI;
  cabeca.add(bocaSorriso);
  bocas.sorriso = bocaSorriso;

  const bocaTriste = malha(
    THREE,
    new THREE.TorusGeometry(0.075, 0.02, 14, 24, Math.PI),
    mPreto,
    false
  );
  bocaTriste.position.set(0, -0.17, 0.39);
  bocaTriste.visible = false;
  cabeca.add(bocaTriste);
  bocas.triste = bocaTriste;

  const bocaOh = malha(THREE, new THREE.SphereGeometry(0.065, 18, 16), mPreto, false);
  bocaOh.position.set(0, -0.14, 0.39);
  bocaOh.scale.set(0.95, 1.25, 0.45);
  bocaOh.visible = false;
  cabeca.add(bocaOh);
  bocas.oh = bocaOh;

  const bocaReta = malha(THREE, new THREE.BoxGeometry(0.12, 0.026, 0.03), mPreto, false);
  bocaReta.position.set(0, -0.14, 0.4);
  bocaReta.visible = false;
  cabeca.add(bocaReta);
  bocas.reta = bocaReta;

  // Boca articulada para lip-sync sincronizado com a narração (cavidade + dentes + língua)
  const bocaFala = new THREE.Group();
  bocaFala.position.set(0, -0.14, 0.395);
  bocaFala.visible = false;

  const cavidadeBoca = malha(
    THREE,
    new THREE.SphereGeometry(0.072, 18, 14),
    mPreto,
    false
  );
  cavidadeBoca.scale.set(1.08, 0.95, 0.38);

  const mLingua = mat(THREE, 0xf43f5e, { roughness: 0.4, emissive: 0xbe123c, emissiveIntensity: 0.25 });
  const linguaBoca = malha(
    THREE,
    new THREE.SphereGeometry(0.044, 14, 12),
    mLingua,
    false
  );
  linguaBoca.position.set(0, -0.022, 0.018);
  linguaBoca.scale.set(1.05, 0.55, 0.38);

  const mDentes = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const dentesBoca = malha(
    THREE,
    new THREE.BoxGeometry(0.076, 0.022, 0.02),
    mDentes,
    false
  );
  dentesBoca.position.set(0, 0.035, 0.02);

  bocaFala.add(cavidadeBoca, linguaBoca, dentesBoca);
  cabeca.add(bocaFala);
  bocas.fala = bocaFala;

  // Gota de suor procedural
  const gotaSuor = malha(
    THREE,
    new THREE.ConeGeometry(0.045, 0.13, 16),
    mat(THREE, 0x38bdf8, { roughness: 0.15, emissive: 0x0284c7, emissiveIntensity: 0.3 }),
    false
  );
  gotaSuor.position.set(0.36, 0.18, 0.25);
  gotaSuor.visible = false;
  cabeca.add(gotaSuor);

  // Capacete de obra / engenheiro
  const capaceteObra = new THREE.Group();
  const cascoObra = malha(
    THREE,
    new THREE.SphereGeometry(0.46, 28, 22, 0, Math.PI * 2, 0, Math.PI * 0.52),
    mat(THREE, 0xfacc15, { roughness: 0.32, metalness: 0.12 })
  );
  cascoObra.position.y = 0.08;
  const abaObra = malha(
    THREE,
    new THREE.CylinderGeometry(0.49, 0.52, 0.05, 28),
    mat(THREE, 0xeab308, { roughness: 0.35 })
  );
  abaObra.position.set(0, 0.08, 0.05);
  capaceteObra.add(cascoObra, abaObra);
  capaceteObra.visible = false;
  cabeca.add(capaceteObra);

  // Capacete espacial / mergulho abissal
  const capaceteEspaco = new THREE.Group();
  const colarEsp = malha(
    THREE,
    new THREE.TorusGeometry(0.34, 0.06, 16, 28),
    mat(THREE, 0xe2e8f0, { roughness: 0.3, metalness: 0.5 })
  );
  colarEsp.rotation.x = Math.PI / 2;
  colarEsp.position.y = -0.32;
  const bolhaEsp = malha(
    THREE,
    new THREE.SphereGeometry(0.56, 32, 28),
    mat(THREE, 0x7dd3fc, { roughness: 0.1, transparent: true, opacity: 0.32 }),
    false
  );
  bolhaEsp.position.y = 0.04;
  capaceteEspaco.add(colarEsp, bolhaEsp);
  capaceteEspaco.visible = false;
  cabeca.add(capaceteEspaco);

  // Braços articulados
  function montarBraco(lado) {
    const ombro = new THREE.Group();
    ombro.position.set(lado * 0.42, 1.38, 0);
    const manga = malha(THREE, new THREE.CylinderGeometry(0.105, 0.095, 0.52, 20), mCamisa);
    manga.position.y = -0.24;
    const punho = malha(THREE, new THREE.CylinderGeometry(0.098, 0.098, 0.08, 20), mPunho);
    punho.position.y = -0.48;
    const mao = malha(THREE, new THREE.SphereGeometry(0.105, 20, 18), mPele);
    mao.position.y = -0.56;
    ombro.add(manga, punho, mao);
    corpo.add(ombro);
    return { ombro, mao };
  }
  const bracoE = montarBraco(-1);
  const bracoD = montarBraco(1);

  // Pernas articuladas
  function montarPerna(lado) {
    const quadrilP = new THREE.Group();
    quadrilP.position.set(lado * 0.17, 0.62, 0);
    const coxa = malha(THREE, new THREE.CylinderGeometry(0.125, 0.11, 0.52, 20), mCalca);
    coxa.position.y = -0.26;
    const sapatoGrp = new THREE.Group();
    sapatoGrp.position.set(0, -0.54, 0.05);
    const tenis = malha(THREE, new THREE.BoxGeometry(0.24, 0.14, 0.34), mSapato);
    const sola = malha(THREE, new THREE.BoxGeometry(0.25, 0.05, 0.36), mSola);
    sola.position.y = -0.06;
    sapatoGrp.add(tenis, sola);
    quadrilP.add(coxa, sapatoGrp);
    corpo.add(quadrilP);
    return quadrilP;
  }
  const pernaE = montarPerna(-1);
  const pernaD = montarPerna(1);

  const bonecoObj = {
    raiz,
    corpo,
    cabeca,
    bracoE: bracoE.ombro,
    bracoD: bracoD.ombro,
    maoE: bracoE.mao,
    maoD: bracoD.mao,
    pernaE,
    pernaD,
    olhos,
    sobrancelhas,
    bocas,
    gotaSuor,
    capaceteObra,
    capaceteEspaco,
    cabeloGrp,
    humorAtual: "feliz",
  };
  raiz.userData = raiz.userData || {};
  raiz.userData.boneco = bonecoObj;
  return bonecoObj;
}

export function resetPose(b, t = 0) {
  b.raiz.rotation.set(0, 0, 0);
  b.corpo.position.set(0, Math.sin(t * 2.6) * 0.022, 0);
  b.corpo.rotation.set(0, 0, 0);
  b.cabeca.rotation.set(Math.sin(t * 1.8) * 0.03, Math.cos(t * 1.3) * 0.04, 0);
  b.bracoE.rotation.set(0, 0, 0.14 + Math.sin(t * 2.2) * 0.03);
  b.bracoD.rotation.set(0, 0, -0.14 - Math.sin(t * 2.2) * 0.03);
  b.pernaE.rotation.set(0, 0, 0);
  b.pernaD.rotation.set(0, 0, 0);
  b.gotaSuor.visible = false;
  if (b.bocas.fala) b.bocas.fala.visible = false;

  // Piscada natural a cada ~3.7s
  const cicloPisca = (t + 0.9) % 3.7;
  const escalaOlhoY = cicloPisca < 0.13 ? 0.12 : 1.0;
  b.olhos[0].scale.set(1, escalaOlhoY, 1);
  b.olhos[1].scale.set(1, escalaOlhoY, 1);
}

export function humor(b, tipo = "feliz") {
  b.humorAtual = tipo;
  b.bocas.sorriso.visible = false;
  b.bocas.triste.visible = false;
  b.bocas.oh.visible = false;
  b.bocas.reta.visible = false;
  if (b.bocas.fala) b.bocas.fala.visible = false;
  b.bocas.reta.scale.set(1, 1, 1);

  b.sobrancelhas[0].position.y = 0.19;
  b.sobrancelhas[1].position.y = 0.19;
  b.sobrancelhas[0].rotation.z = 0;
  b.sobrancelhas[1].rotation.z = 0;

  if (tipo === "feliz" || tipo === "orgulhoso") {
    b.bocas.sorriso.visible = true;
    b.sobrancelhas[0].position.y = 0.21;
    b.sobrancelhas[1].position.y = 0.21;
  } else if (tipo === "triste" || tipo === "cansado") {
    b.bocas.triste.visible = true;
    b.sobrancelhas[0].rotation.z = 0.26;
    b.sobrancelhas[1].rotation.z = -0.26;
  } else if (tipo === "assustado" || tipo === "surpreso") {
    b.bocas.oh.visible = true;
    b.sobrancelhas[0].position.y = 0.24;
    b.sobrancelhas[1].position.y = 0.24;
  } else if (tipo === "bravo" || tipo === "esforco") {
    b.bocas.reta.visible = true;
    b.sobrancelhas[0].rotation.z = -0.32;
    b.sobrancelhas[1].rotation.z = 0.32;
  } else if (tipo === "pensativo") {
    b.bocas.reta.visible = true;
    b.sobrancelhas[0].position.y = 0.23;
    b.sobrancelhas[1].rotation.z = 0.18;
  } else {
    b.bocas.sorriso.visible = true;
  }
}

/**
 * Anima a boca do avatar sincronizada com as palavras e sílabas da narração (lip-sync).
 * Lê automaticamente `window.__SPEECH_TIMELINE__` (gerado a partir do alinhamento ElevenLabs)
 * ou aplica cadência silábica procedural caso não haja timeline global carregada.
 */
export function falar(b, tLocal = 0, offsetGlobal = 0) {
  if (!b || !b.bocas || !b.bocas.fala) return;
  const tGlobal = offsetGlobal + tLocal;
  const speech = typeof window !== "undefined" ? window.__SPEECH_TIMELINE__ : null;

  let palavraAtiva = null;
  if (Array.isArray(speech) && speech.length > 0) {
    for (let i = 0; i < speech.length; i++) {
      const w = speech[i];
      if (tGlobal >= w.s - 0.015 && tGlobal <= w.e + 0.025) {
        palavraAtiva = w;
        break;
      }
    }
  } else {
    // Fallback procedural quando visualizado isoladamente sem window.__SPEECH_TIMELINE__
    const emFrase = (tLocal % 3.6) < 3.15 && tLocal > 0.12;
    if (emFrase) {
      palavraAtiva = {
        s: Math.floor(tLocal * 3.2) / 3.2,
        e: Math.floor(tLocal * 3.2) / 3.2 + 0.28,
        sil: 2,
        ab: 1.0,
      };
    }
  }

  // Em pausa entre palavras ou frases: mantém a expressão facial do humor atual
  if (!palavraAtiva) {
    return;
  }

  const durPalavra = Math.max(0.06, palavraAtiva.e - palavraAtiva.s);
  const u = clamp((tGlobal - palavraAtiva.s) / durPalavra, 0, 1);
  const numSilabas = Math.max(1, palavraAtiva.sil || 2);
  const fatorVogal = palavraAtiva.ab || 1.0;

  // Onda silábica: abre nas vogais de cada sílaba e fecha nas consoantes entre sílabas
  const faseSilaba = u * numSilabas * Math.PI;
  const ondaSilaba = Math.pow(Math.abs(Math.sin(faseSilaba)), 1.35);
  const abertura = clamp(ondaSilaba * fatorVogal, 0, 1.35);

  b.bocas.sorriso.visible = false;
  b.bocas.triste.visible = false;
  b.bocas.oh.visible = false;
  b.bocas.reta.visible = false;
  b.bocas.fala.visible = false;

  if (abertura > 0.26) {
    b.bocas.fala.visible = true;
    const escalaY = 0.25 + abertura * 1.05;
    const escalaX = 0.82 + Math.sin(faseSilaba * 0.5) * 0.25 + (1.1 - abertura * 0.3) * 0.14;
    b.bocas.fala.scale.set(escalaX, escalaY, 1.0);
    // Micro-movimento natural de mandíbula/cabeça acompanhando a sílaba tônica
    b.cabeca.rotation.x += abertura * 0.045;
  } else {
    // Fechamento labial nítido entre sílabas (consoantes p, b, m, t, d, s)
    b.bocas.reta.visible = true;
    b.bocas.reta.scale.set(0.84, 0.95, 1.0);
  }
}

export function olharCamera(b, camera, forca = 0.7) {
  const dx = camera.position.x - b.raiz.position.x;
  const dz = camera.position.z - b.raiz.position.z;
  const angAlvo = Math.atan2(dx, dz);
  let diff = angAlvo - b.raiz.rotation.y;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  b.cabeca.rotation.y = clamp(diff, -0.75, 0.75) * forca;
}

export function andar(b, t, tIni, tFim, de, para, passo = 9) {
  const u = suave(faixa(t, tIni, tFim));
  const p = lerp3(de, para, u);
  b.raiz.position.set(p[0], p[1], p[2]);
  const dx = para[0] - de[0];
  const dz = para[2] - de[2];
  if (Math.hypot(dx, dz) > 0.001) {
    b.raiz.rotation.y = Math.atan2(dx, dz);
  }
  if (t >= tIni && t <= tFim) {
    const fase = (t - tIni) * passo;
    const amp = Math.sin(u * Math.PI);
    b.pernaE.rotation.x = Math.sin(fase) * 0.65 * amp;
    b.pernaD.rotation.x = -Math.sin(fase) * 0.65 * amp;
    b.bracoE.rotation.x = -Math.sin(fase) * 0.5 * amp;
    b.bracoD.rotation.x = Math.sin(fase) * 0.5 * amp;
    b.corpo.position.y = Math.abs(Math.sin(fase)) * 0.08 * amp;
  }
}

export function correr(b, t, tIni, tFim, de, para) {
  andar(b, t, tIni, tFim, de, para, 15);
  if (t >= tIni && t <= tFim) {
    b.corpo.rotation.x = 0.22;
  }
}

export function pular(b, t, tIni, dur = 0.6, altura = 0.85) {
  if (t < tIni || t > tIni + dur) return;
  const u = faixa(t, tIni, tIni + dur);
  b.corpo.position.y += pulso(u) * altura;
  b.bracoE.rotation.z = 2.4 * pulso(u);
  b.bracoD.rotation.z = -2.4 * pulso(u);
}

export function acenar(b, t, tIni, tFim, mao = "D") {
  if (t < tIni || t > tIni + tFim) return;
  const env = pulso(faixa(t, tIni, tFim));
  const braco = mao === "E" ? b.bracoE : b.bracoD;
  const s = mao === "E" ? 1 : -1;
  braco.rotation.z = s * (2.35 + Math.sin(t * 14) * 0.32) * env;
}

export function comemorar(b, t, tIni, tFim) {
  if (t < tIni || t > tFim) return;
  humor(b, "feliz");
  const fase = (t - tIni) * 11;
  b.corpo.position.y = Math.abs(Math.sin(fase)) * 0.28;
  b.bracoE.rotation.z = 2.5 + Math.sin(fase) * 0.25;
  b.bracoD.rotation.z = -2.5 - Math.sin(fase) * 0.25;
}

export function apontar(b, pontoAlvo, mao = "D") {
  const braco = mao === "E" ? b.bracoE : b.bracoD;
  const dx = pontoAlvo[0] - b.raiz.position.x;
  const dy = pontoAlvo[1] - (b.raiz.position.y + 1.35);
  const dz = pontoAlvo[2] - b.raiz.position.z;
  const distH = Math.hypot(dx, dz);
  braco.rotation.x = -Math.PI / 2 - Math.atan2(dy, Math.max(0.2, distH)) * 0.6;
  braco.rotation.z = (mao === "E" ? 1 : -1) * 0.35;
}

export function pensar(b, t, tIni, tFim) {
  if (t < tIni || t > tFim) return;
  humor(b, "pensativo");
  b.bracoD.rotation.x = -1.85;
  b.bracoD.rotation.z = -0.35;
  b.cabeca.rotation.z = 0.16 + Math.sin(t * 3) * 0.04;
}

export function suar(b, t, tIni, tFim) {
  if (t < tIni || t > tFim) return;
  b.gotaSuor.visible = true;
  const ciclo = ((t - tIni) * 2.2) % 1;
  b.gotaSuor.position.y = 0.24 - ciclo * 0.26;
}

export function segurar(b, obj, abertura = 0.32) {
  b.bracoE.rotation.x = -1.15;
  b.bracoD.rotation.x = -1.15;
  b.bracoE.rotation.z = abertura;
  b.bracoD.rotation.z = -abertura;
  if (obj) {
    const yaw = b.raiz.rotation.y;
    obj.position.set(
      b.raiz.position.x + Math.sin(yaw) * 0.58,
      b.raiz.position.y + 1.12 + b.corpo.position.y,
      b.raiz.position.z + Math.cos(yaw) * 0.58
    );
    obj.rotation.y = yaw;
  }
}

export function capacete(b, ativo = true) {
  b.capaceteObra.visible = !!ativo;
}

export function capaceteEspacial(b, ativo = true) {
  b.capaceteEspaco.visible = !!ativo;
}
