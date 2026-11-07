// motor/2d/motor2d.global.js — Kit 2D vetorial (SVG + GSAP) do Motor 2.0. Expõe window.Motor2D.
// Alternativa 100% 2D ao Kit 3D: sem Three.js, sem WebGL. Tudo é função pura do tempo local `t`
// (determinístico para seek/render do HyperFrames): cenas SVG, mascote 2D com lip-sync e medidor de sinal.
(function (global) {
  "use strict";

  // ───────────────────────── utilidades matemáticas ─────────────────────────
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function faixa(t, a, b) { return b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a), 0, 1); }
  function suave(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function f2(n) { return Math.round(n * 100) / 100; }
  function hex2rgb(h) {
    var m = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.exec(h);
    if (m) return [+m[1], +m[2], +m[3]];
    h = h.replace("#", "");
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  function mixCor(a, b, u) {
    var A = hex2rgb(a), B = hex2rgb(b);
    u = clamp(u, 0, 1);
    return "rgb(" + Math.round(lerp(A[0], B[0], u)) + "," + Math.round(lerp(A[1], B[1], u)) + "," + Math.round(lerp(A[2], B[2], u)) + ")";
  }
  // Pseudo-aleatório determinístico (0..1) a partir de uma semente numérica.
  function ruido(n) { var s = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); }

  // ───────────────────────── construção de SVG por string ─────────────────────────
  function T(nome, attrs, interno) {
    var s = "<" + nome;
    for (var k in attrs) { if (attrs[k] !== undefined && attrs[k] !== null) s += " " + k + '="' + attrs[k] + '"'; }
    return s + (interno === undefined ? "/>" : ">" + interno + "</" + nome + ">");
  }
  function G(attrs) {
    var interno = "";
    for (var i = 1; i < arguments.length; i++) {
      if (arguments[i] !== undefined && arguments[i] !== null) interno += arguments[i];
    }
    return T("g", attrs, interno);
  }
  function pegar(raiz, sel) {
    var r = typeof raiz === "string" ? document.querySelector(raiz) : raiz;
    return sel ? r.querySelector(sel) : r;
  }
  function setar(elm, attrs) { for (var k in attrs) elm.setAttribute(k, attrs[k]); }
  function montar(container, html) {
    var c = pegar(container);
    c.innerHTML = html;
    return c;
  }
  function svgBase(w, h, interno) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" style="display:block;overflow:visible">' + interno + "</svg>";
  }

  // Arco de circunferência (graus; 0 = direita, sentido horário positivo).
  function arco(cx, cy, r, a0, a1) {
    var d2r = Math.PI / 180;
    var x0 = cx + r * Math.cos(a0 * d2r), y0 = cy + r * Math.sin(a0 * d2r);
    var x1 = cx + r * Math.cos(a1 * d2r), y1 = cy + r * Math.sin(a1 * d2r);
    return "M" + f2(x0) + " " + f2(y0) + " A" + f2(r) + " " + f2(r) + " 0 " + (Math.abs(a1 - a0) > 180 ? 1 : 0) + " 1 " + f2(x1) + " " + f2(y1);
  }

  // Ondas que se expandem a partir de (cx,cy). `lista` = elementos <path> (arcos) ou <circle>.
  // cfg: { periodo, r0, rMax, a0, a1, cor(r,ph)|string, opac(r,ph,i), largura, circulo }
  function animarOndas(lista, cx, cy, t, cfg) {
    var n = lista.length;
    for (var i = 0; i < n; i++) {
      var ph = (((t / cfg.periodo + i / n) % 1) + 1) % 1;
      var r = cfg.r0 + (cfg.rMax - cfg.r0) * ph;
      var op = cfg.opac ? cfg.opac(r, ph, i) : 1 - ph;
      var cor = typeof cfg.cor === "function" ? cfg.cor(r, ph) : cfg.cor;
      var p = lista[i];
      if (cfg.circulo) {
        p.setAttribute("cx", f2(cx)); p.setAttribute("cy", f2(cy)); p.setAttribute("r", f2(r));
      } else {
        p.setAttribute("d", arco(cx, cy, r, cfg.a0, cfg.a1));
      }
      p.setAttribute("stroke", cor);
      p.setAttribute("stroke-opacity", f2(clamp(op, 0, 1)));
      p.setAttribute("stroke-width", cfg.largura || 6);
    }
  }
  function criarOndas(prefixo, n, circulo) {
    var s = "";
    for (var i = 0; i < n; i++) {
      s += T(circulo ? "circle" : "path", { id: prefixo + i, fill: "none", "stroke-linecap": "round", "stroke-opacity": 0 });
    }
    return s;
  }
  function pegarLista(raiz, prefixo, n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(pegar(raiz, "#" + prefixo + i));
    return out;
  }

  // ───────────────────────── objetos 2D reutilizáveis ─────────────────────────
  // Roteador (origem = centro da base). `pref` gera ids para LEDs: pref-led0..2
  function roteadorSVG(x, y, s, pref) {
    var ant = "";
    var pontas = [[-40, -92, -48], [0, -104, 0], [40, -92, 48]];
    for (var i = 0; i < 3; i++) {
      ant += T("line", { x1: pontas[i][0], y1: -26, x2: pontas[i][2], y2: pontas[i][1], stroke: "#cbd5e1", "stroke-width": 9, "stroke-linecap": "round" });
      ant += T("circle", { cx: pontas[i][2], cy: pontas[i][1], r: 7, fill: "#e2e8f0" });
    }
    var corpo = T("rect", { x: -64, y: -28, width: 128, height: 28, rx: 9, fill: "#e2e8f0" }) +
      T("rect", { x: -64, y: -9, width: 128, height: 9, rx: 4, fill: "#94a3b8" });
    var leds = "";
    for (var j = 0; j < 3; j++) leds += T("circle", { id: pref + "-led" + j, cx: -32 + j * 16, cy: -17, r: 4, fill: "#22c55e" });
    return G({ transform: "translate(" + x + " " + y + ") scale(" + s + ")" }, ant + corpo + leds);
  }
  function piscarLeds(raiz, pref, t, cor) {
    for (var j = 0; j < 3; j++) {
      var e = pegar(raiz, "#" + pref + "-led" + j);
      if (!e) continue;
      var on = Math.sin(t * 7 + j * 2.1) > -0.3 ? 1 : 0.25;
      e.setAttribute("fill", cor || "#22c55e");
      e.setAttribute("opacity", on);
    }
  }
  // Celular em pé (origem = canto superior esquerdo). Retorna svg-string com ids pref-tela.
  function celularSVG(x, y, w, h, pref, conteudo) {
    return G({ transform: "translate(" + x + " " + y + ")" },
      T("rect", { x: 0, y: 0, width: w, height: h, rx: 30, fill: "#0b1220", stroke: "#94a3b8", "stroke-width": 6 }) +
      T("rect", { x: 12, y: 18, width: w - 24, height: h - 36, rx: 20, fill: "#111c33", id: pref + "-tela" }) +
      T("rect", { x: w / 2 - 22, y: 6, width: 44, height: 6, rx: 3, fill: "#334155" }) +
      (conteudo || ""));
  }

  // ───────────────────────── mascote 2D ─────────────────────────
  var PELE = "#e8a87c", PELE_SOMBRA = "#c98a5e", CABELO = "#1a1a2e";

  function mascoteSVG() {
    var corpo =
      T("ellipse", { cx: 150, cy: 408, rx: 98, ry: 10, fill: "#000", "fill-opacity": 0.38, class: "m2-sombra" }) +
      G({ class: "m2-todo" },
        // pernas + tênis
        T("rect", { x: 108, y: 262, width: 38, height: 106, rx: 12, fill: "#1e293b" }) +
        T("rect", { x: 154, y: 262, width: 38, height: 106, rx: 12, fill: "#1e293b" }) +
        T("rect", { x: 96, y: 362, width: 60, height: 30, rx: 13, fill: "#dc2626" }) +
        T("rect", { x: 144, y: 362, width: 60, height: 30, rx: 13, fill: "#dc2626" }) +
        T("rect", { x: 94, y: 386, width: 64, height: 10, rx: 5, fill: "#f8fafc" }) +
        T("rect", { x: 142, y: 386, width: 64, height: 10, rx: 5, fill: "#f8fafc" }) +
        // tronco (camisa azul)
        G({ class: "m2-corpo" },
          T("rect", { x: 136, y: 150, width: 28, height: 34, rx: 8, fill: PELE_SOMBRA }) +
          T("rect", { x: 86, y: 172, width: 128, height: 108, rx: 32, fill: "#1d4ed8" }) +
          T("rect", { x: 86, y: 262, width: 128, height: 18, rx: 9, fill: "#1e3a8a" }) +
          T("circle", { cx: 150, cy: 222, r: 17, fill: "#facc15" }) +
          T("path", { d: arco(150, 230, 6, -135, -45), stroke: "#1e3a8a", "stroke-width": 3, fill: "none", "stroke-linecap": "round" }) +
          T("path", { d: arco(150, 230, 11, -135, -45), stroke: "#1e3a8a", "stroke-width": 3, fill: "none", "stroke-linecap": "round" }) +
          T("circle", { cx: 150, cy: 230, r: 2.4, fill: "#1e3a8a" }) +
          // braços articulados (pivô no ombro)
          G({ class: "m2-braco-e" },
            T("rect", { x: 76, y: 180, width: 34, height: 92, rx: 17, fill: "#1d4ed8" }) +
            T("rect", { x: 78, y: 258, width: 30, height: 11, rx: 5, fill: "#1e3a8a" }) +
            T("circle", { cx: 93, cy: 284, r: 16, fill: PELE })) +
          G({ class: "m2-braco-d" },
            T("rect", { x: 190, y: 180, width: 34, height: 92, rx: 17, fill: "#1d4ed8" }) +
            T("rect", { x: 192, y: 258, width: 30, height: 11, rx: 5, fill: "#1e3a8a" }) +
            T("circle", { cx: 207, cy: 284, r: 16, fill: PELE }))) +
        // cabeça
        G({ class: "m2-cabeca" },
          T("circle", { cx: 80, cy: 100, r: 14, fill: PELE_SOMBRA }) +
          T("circle", { cx: 220, cy: 100, r: 14, fill: PELE_SOMBRA }) +
          T("ellipse", { cx: 150, cy: 94, rx: 71, ry: 68, fill: PELE }) +
          // cabelo
          T("path", { d: "M78 90 C72 36 118 18 150 20 C184 18 228 38 222 90 C212 66 190 58 150 58 C112 58 90 68 78 90 Z", fill: CABELO }) +
          T("path", { d: "M126 28 L134 2 L148 24 L166 0 L172 30 Z", fill: CABELO }) +
          // olhos
          G({ class: "m2-olho-e" },
            T("ellipse", { cx: 122, cy: 98, rx: 19, ry: 21, fill: "#fff" }) +
            G({ class: "m2-pupila-e" },
              T("circle", { cx: 122, cy: 100, r: 11, fill: "#2563eb" }) +
              T("circle", { cx: 122, cy: 100, r: 6, fill: "#0f172a" }) +
              T("circle", { cx: 117, cy: 94, r: 3, fill: "#fff" }))) +
          G({ class: "m2-olho-d" },
            T("ellipse", { cx: 178, cy: 98, rx: 19, ry: 21, fill: "#fff" }) +
            G({ class: "m2-pupila-d" },
              T("circle", { cx: 178, cy: 100, r: 11, fill: "#2563eb" }) +
              T("circle", { cx: 178, cy: 100, r: 6, fill: "#0f172a" }) +
              T("circle", { cx: 173, cy: 94, r: 3, fill: "#fff" }))) +
          // sobrancelhas
          T("line", { class: "m2-sobr-e", x1: 104, y1: 70, x2: 140, y2: 70, stroke: CABELO, "stroke-width": 7, "stroke-linecap": "round" }) +
          T("line", { class: "m2-sobr-d", x1: 160, y1: 70, x2: 196, y2: 70, stroke: CABELO, "stroke-width": 7, "stroke-linecap": "round" }) +
          // bochechas e nariz
          T("ellipse", { cx: 98, cy: 126, rx: 15, ry: 9, fill: "#f87171", "fill-opacity": 0.5 }) +
          T("ellipse", { cx: 202, cy: 126, rx: 15, ry: 9, fill: "#f87171", "fill-opacity": 0.5 }) +
          T("path", { d: "M145 114 Q150 121 155 114", stroke: PELE_SOMBRA, "stroke-width": 3, fill: "none", "stroke-linecap": "round" }) +
          // boca: linha (humor), "oh" (surpresa) e aberta (fala)
          T("path", { class: "m2-boca-linha", d: "M136 142 Q150 146 164 142", stroke: "#7f1d1d", "stroke-width": 6, fill: "none", "stroke-linecap": "round" }) +
          T("ellipse", { class: "m2-boca-oh", cx: 150, cy: 144, rx: 9, ry: 12, fill: "#5b1a2b", opacity: 0 }) +
          G({ class: "m2-boca-aberta", opacity: 0 },
            T("ellipse", { cx: 150, cy: 142, rx: 21, ry: 15, fill: "#5b1a2b" }) +
            T("rect", { x: 133, y: 128, width: 34, height: 8, rx: 4, fill: "#fff" }) +
            T("ellipse", { cx: 150, cy: 151, rx: 12, ry: 6, fill: "#f87171" })) +
          // capacete (opcional) e gota de suor
          G({ class: "m2-capacete", opacity: 0 },
            T("path", { d: "M70 80 C72 26 228 26 230 80 Z", fill: "#facc15" }) +
            T("rect", { x: 140, y: 30, width: 20, height: 46, rx: 6, fill: "#eab308" }) +
            T("rect", { x: 58, y: 76, width: 184, height: 13, rx: 6, fill: "#eab308" })) +
          T("path", { class: "m2-suor", d: "M218 52 Q228 68 218 80 Q208 68 218 52 Z", fill: "#7dd3fc", opacity: 0 })));
    return svgBase(300, 420, corpo);
  }

  var BOCAS = {
    neutro: "M136 142 Q150 146 164 142",
    feliz: "M128 134 Q150 160 172 134",
    bravo: "M134 150 Q150 134 166 150",
    triste: "M134 150 Q150 134 166 150",
    surpreso: "M136 142 Q150 146 164 142",
  };
  var SOBR = { // [rotE, rotD, dy]
    neutro: [0, 0, 0], feliz: [0, 0, -4], surpreso: [0, 0, -13], bravo: [17, -17, 3], triste: [-15, 15, 0],
  };

  // Abertura da boca (0..1.35) para o instante global `tg`, a partir de window.__SPEECH_TIMELINE__.
  function aberturaFala(tg) {
    var speech = global.__SPEECH_TIMELINE__;
    if (!Array.isArray(speech) || !speech.length) return -1;
    var w = null;
    for (var i = 0; i < speech.length; i++) {
      if (tg >= speech[i].s - 0.015 && tg <= speech[i].e + 0.025) { w = speech[i]; break; }
    }
    if (!w) return -1;
    var dur = Math.max(0.06, w.e - w.s);
    var u = clamp((tg - w.s) / dur, 0, 1);
    var sil = Math.max(1, w.sil || 2);
    var onda = Math.pow(Math.abs(Math.sin(u * sil * Math.PI)), 1.35);
    return clamp(onda * (w.ab || 1), 0, 1.35);
  }

  function mascote(container) {
    var c = montar(container, mascoteSVG());
    var q = function (s) { return c.querySelector(s); };
    var E = {
      todo: q(".m2-todo"), sombra: q(".m2-sombra"), corpo: q(".m2-corpo"), cabeca: q(".m2-cabeca"),
      bracoE: q(".m2-braco-e"), bracoD: q(".m2-braco-d"),
      olhoE: q(".m2-olho-e"), olhoD: q(".m2-olho-d"), pupE: q(".m2-pupila-e"), pupD: q(".m2-pupila-d"),
      sobrE: q(".m2-sobr-e"), sobrD: q(".m2-sobr-d"),
      linha: q(".m2-boca-linha"), oh: q(".m2-boca-oh"), aberta: q(".m2-boca-aberta"),
      capacete: q(".m2-capacete"), suor: q(".m2-suor"),
    };
    return {
      el: c,
      // estado: { humor, bracoD, bracoE (elevação em graus: 0 = caído, 90 = horizontal, 180 = para cima),
      //           pulo (px), olhar:[dx,dy], capacete:boolean, tremer:number }
      atualizar: function (t, offsetGlobal, estado) {
        estado = estado || {};
        var humor = estado.humor || "neutro";
        var pulo = estado.pulo || 0;
        var tremor = estado.tremer ? Math.sin(t * 55) * estado.tremer : 0;
        var bob = Math.sin(t * 2.4) * 2.5;
        E.todo.setAttribute("transform", "translate(" + f2(tremor) + " " + f2(bob - pulo) + ")");
        E.sombra.setAttribute("transform", "translate(150 408) scale(" + f2(1 - pulo / 260) + " 1) translate(-150 -408)");
        E.sombra.setAttribute("fill-opacity", f2(0.38 - pulo / 500));
        E.cabeca.setAttribute("transform", "rotate(" + f2(Math.sin(t * 1.1) * 1.6 + (estado.inclinar || 0)) + " 150 160)");
        // braços (esquerdo gira +, direito gira -)
        E.bracoE.setAttribute("transform", "rotate(" + f2(estado.bracoE || 4) + " 93 190)");
        E.bracoD.setAttribute("transform", "rotate(" + f2(-(estado.bracoD || 4)) + " 207 190)");
        // sobrancelhas / olhos por humor
        var sb = SOBR[humor] || SOBR.neutro;
        E.sobrE.setAttribute("transform", "translate(0 " + sb[2] + ") rotate(" + sb[0] + " 122 70)");
        E.sobrD.setAttribute("transform", "translate(0 " + sb[2] + ") rotate(" + sb[1] + " 178 70)");
        var fase = t % 3.7;
        var piscar = fase > 3.52 ? 1 - Math.sin(((fase - 3.52) / 0.18) * Math.PI) : 1;
        var sy = (humor === "bravo" ? 0.74 : humor === "surpreso" ? 1.16 : 1) * Math.max(0.08, piscar);
        E.olhoE.setAttribute("transform", "translate(122 98) scale(1 " + f2(sy) + ") translate(-122 -98)");
        E.olhoD.setAttribute("transform", "translate(178 98) scale(1 " + f2(sy) + ") translate(-178 -98)");
        var ol = estado.olhar || [0, 0];
        var tr = "translate(" + ol[0] + " " + ol[1] + ")";
        E.pupE.setAttribute("transform", tr); E.pupD.setAttribute("transform", tr);
        // boca: linha/oh conforme humor; fala sobrepõe
        E.linha.setAttribute("d", BOCAS[humor] || BOCAS.neutro);
        var ab = aberturaFala(offsetGlobal + t);
        var falando = ab > 0.26;
        E.aberta.setAttribute("opacity", falando ? 1 : 0);
        if (falando) E.aberta.setAttribute("transform", "translate(150 130) scale(1 " + f2(0.3 + ab * 0.95) + ") translate(-150 -130)");
        var oh = humor === "surpreso" && !falando;
        E.oh.setAttribute("opacity", oh ? 1 : 0);
        E.linha.setAttribute("opacity", falando || oh ? 0 : 1);
        E.capacete.setAttribute("opacity", estado.capacete ? 1 : 0);
        var suando = humor === "surpreso" || humor === "bravo" || humor === "triste";
        E.suor.setAttribute("opacity", suando ? 0.95 : 0);
        E.suor.setAttribute("transform", "translate(0 " + f2(((t * 18) % 22)) + ")");
      },
    };
  }

  // ───────────────────────── medidor de sinal Wi-Fi (HUD) ─────────────────────────
  function medidor(container) {
    var c = pegar(container);
    var arcos = "";
    var raios = [34, 64, 94, 124];
    for (var i = 0; i < 4; i++) {
      arcos += T("path", { class: "m2-med-arco", d: arco(100, 148, raios[i], -135, -45), fill: "none", stroke: "#22c55e", "stroke-width": 15, "stroke-linecap": "round" });
    }
    var icone = svgBase(200, 170, arcos + T("circle", { class: "m2-med-ponto", cx: 100, cy: 148, r: 12, fill: "#22c55e" }));
    c.innerHTML =
      '<div style="display:flex;align-items:center;gap:22px;height:100%;padding:0 30px">' +
      '<div style="width:190px;flex:none">' + icone + "</div>" +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
      '<span class="m2-med-rotulo" style="font:700 22px Inter,sans-serif;letter-spacing:.1em;color:#cbd5e1"></span>' +
      '<span class="m2-med-valor" style="font:700 84px Inter,sans-serif;line-height:1;color:#f8fafc"></span>' +
      '<span class="m2-med-estado" style="font:700 24px Inter,sans-serif;letter-spacing:.08em"></span>' +
      "</div></div>";
    var arcosEls = c.querySelectorAll(".m2-med-arco");
    var ponto = c.querySelector(".m2-med-ponto");
    var rot = c.querySelector(".m2-med-rotulo"), val = c.querySelector(".m2-med-valor"), est = c.querySelector(".m2-med-estado");
    return {
      atualizar: function (nivel, rotulo) {
        nivel = clamp(nivel, 0, 4);
        var cor = nivel >= 3 ? "#22c55e" : nivel >= 2 ? "#facc15" : nivel >= 1 ? "#fb923c" : "#f87171";
        var texto = nivel >= 3 ? "FORTE" : nivel >= 2 ? "OK" : nivel >= 1 ? "FRACO" : "QUASE SEM SINAL";
        for (var i = 0; i < arcosEls.length; i++) {
          var luz = clamp(nivel - i, 0, 1);
          arcosEls[i].setAttribute("stroke", cor);
          arcosEls[i].setAttribute("stroke-opacity", f2(0.14 + 0.86 * luz));
        }
        ponto.setAttribute("fill", cor);
        rot.textContent = rotulo;
        val.textContent = Math.round((nivel / 4) * 100) + "%";
        est.textContent = texto;
        est.style.color = cor;
      },
    };
  }

  // ───────────────────────── medidor de bateria horizontal (HUD) ─────────────────────────
  function medidorBateria(container) {
    var c = pegar(container);
    var svg = svgBase(190, 110,
      T("rect", { x: 10, y: 15, width: 148, height: 80, rx: 18, fill: "#0b1220", stroke: "#e2e8f0", "stroke-width": 7 }) +
      T("rect", { x: 162, y: 38, width: 14, height: 34, rx: 6, fill: "#94a3b8" }) +
      T("rect", { class: "m2-bat-fill", x: 20, y: 25, width: 128, height: 60, rx: 10, fill: "#22c55e" }) +
      G({ class: "m2-bat-raio", opacity: 0 },
        T("path", { d: "M88 28 L74 54 L88 54 L80 82 L98 48 L84 48 Z", fill: "#fde047" })
      )
    );
    c.innerHTML =
      '<div style="display:flex;align-items:center;gap:22px;height:100%;padding:0 30px">' +
      '<div style="width:190px;flex:none">' + svg + "</div>" +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
      '<span class="m2-bat-rotulo" style="font:700 22px Inter,sans-serif;letter-spacing:.1em;color:#cbd5e1"></span>' +
      '<span class="m2-bat-valor" style="font:700 84px Inter,sans-serif;line-height:1;color:#f8fafc;font-variant-numeric:tabular-nums"></span>' +
      '<span class="m2-bat-estado" style="font:700 24px Inter,sans-serif;letter-spacing:.08em"></span>' +
      "</div></div>";
    var fill = c.querySelector(".m2-bat-fill");
    var raio = c.querySelector(".m2-bat-raio");
    var rot = c.querySelector(".m2-bat-rotulo"), val = c.querySelector(".m2-bat-valor"), est = c.querySelector(".m2-bat-estado");
    return {
      atualizar: function (pct, rotulo, carregando) {
        pct = clamp(pct, 0, 100);
        var cor = pct > 45 ? "#22c55e" : pct > 20 ? "#facc15" : pct > 5 ? "#f97316" : "#ef4444";
        var texto = pct > 45 ? "CARGA BOA" : pct > 20 ? "MODO NORMAL" : pct > 5 ? "ZONA DE PERIGO" : "APAGANDO...";
        fill.setAttribute("width", f2((pct / 100) * 128));
        fill.setAttribute("fill", cor);
        raio.setAttribute("opacity", carregando ? 1 : 0);
        rot.textContent = rotulo || "NÍVEL DA BATERIA";
        val.textContent = Math.round(pct) + "%";
        est.textContent = texto;
        est.style.color = cor;
      },
    };
  }

  // ───────────────────────── medidor de barra (HUD temático) ─────────────────────────
  // Painel de telemetria genérico: rótulo, valor grande, barra proporcional e estado.
  // cfg: { rotulo, unidade, max, cor, decimais }
  function medidorBarra(container, cfg) {
    cfg = cfg || {};
    var c = pegar(container);
    var max = cfg.max || 100;
    var cor = cfg.cor || "#38bdf8";
    var dec = cfg.decimais != null ? cfg.decimais : 0;
    c.innerHTML =
      '<div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:22px 28px;gap:13px">' +
      '<div style="display:flex;align-items:baseline;justify-content:space-between">' +
      '<span class="m2-barra-rotulo" style="font:700 20px Inter,sans-serif;letter-spacing:.10em;color:#f8fafc"></span>' +
      '<span class="m2-barra-pct" style="font:700 19px Inter,sans-serif;color:#cbd5e1;font-variant-numeric:tabular-nums">0%</span>' +
      "</div>" +
      '<div style="display:flex;align-items:baseline;gap:10px">' +
      '<span class="m2-barra-valor" style="font:700 76px Inter,sans-serif;line-height:1;color:#f8fafc;font-variant-numeric:tabular-nums">0</span>' +
      '<span class="m2-barra-unidade" style="font:700 26px Inter,sans-serif;color:#cbd5e1">' + (cfg.unidade || "") + "</span>" +
      "</div>" +
      '<div style="height:22px;background:#0b1220;border:1px solid rgba(203,213,225,.3);border-radius:12px;overflow:hidden">' +
      '<div class="m2-barra-fill" style="height:100%;width:0%;background:' + cor + ';border-radius:11px"></div>' +
      "</div>" +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<span class="m2-barra-estado" style="font:700 22px Inter,sans-serif;letter-spacing:.06em;color:' + cor + '"></span>' +
      '<span style="font:600 15px Inter,sans-serif;color:#cbd5e1">ESCALA 0–' + max + "</span>" +
      "</div></div>";
    var rot = c.querySelector(".m2-barra-rotulo");
    var val = c.querySelector(".m2-barra-valor");
    var pctEl = c.querySelector(".m2-barra-pct");
    var fill = c.querySelector(".m2-barra-fill");
    var est = c.querySelector(".m2-barra-estado");
    rot.textContent = cfg.rotulo || "TELEMETRIA";
    return {
      atualizar: function (valor, estado, corAtual) {
        var v = clamp(valor, 0, max);
        var pct = (v / max) * 100;
        var cc = corAtual || cor;
        val.textContent = dec > 0 ? v.toFixed(dec) : String(Math.round(v));
        pctEl.textContent = Math.round(pct) + "%";
        fill.style.width = f2(pct) + "%";
        fill.style.background = cc;
        fill.style.boxShadow = "0 0 18px " + cc;
        est.textContent = estado || "";
        est.style.color = cc;
      },
    };
  }

  // ───────────────────────── runtime: liga uma função de cena ao tempo da timeline ─────────────────────────
  function conectar(tl, fnCena, opcoes) {
    opcoes = opcoes || {};
    var duracao = opcoes.duracao != null ? opcoes.duracao : 7.5;
    var offsetGlobal = opcoes.offsetGlobal || 0;
    function renderizarEm(tLocal) { fnCena(clamp(tLocal, 0, duracao), offsetGlobal); }
    if (tl) {
      var proxy = { t: 0 };
      tl.to(proxy, { t: duracao, duration: duracao, ease: "none", onUpdate: function () { renderizarEm(proxy.t); } }, 0);
    }
    renderizarEm(0);
    if (typeof window !== "undefined") {
      window.addEventListener("hf-seek", function (ev) {
        var g = ev && ev.detail && ev.detail.time;
        if (typeof g === "number") {
          var l = g - offsetGlobal;
          if (l >= -0.05 && l <= duracao + 0.05) renderizarEm(l);
        }
      });
    }
  }

  global.Motor2D = {
    clamp: clamp, faixa: faixa, suave: suave, lerp: lerp, mixCor: mixCor, ruido: ruido, f2: f2,
    T: T, G: G, pegar: pegar, setar: setar, montar: montar, svgBase: svgBase, arco: arco,
    criarOndas: criarOndas, pegarLista: pegarLista, animarOndas: animarOndas,
    roteadorSVG: roteadorSVG, piscarLeds: piscarLeds, celularSVG: celularSVG,
    mascote: mascote, medidor: medidor, medidorBateria: medidorBateria, medidorBarra: medidorBarra, conectar: conectar,
  };
})(typeof window !== "undefined" ? window : globalThis);
