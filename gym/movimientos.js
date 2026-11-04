/* =====================================================================
   Movimientos de los 42 ejercicios (fotogramas clave para Figura)
   Basados en «La Reforma Pro-Salud», Tomo I, ejercicios 1–42.
   Vista lateral mirando a la derecha (x+). Suelo en y = 188.
   Ángulos: 0 = abajo, 90 = adelante, 180 = arriba, 270 = atrás.
   En vista lateral, «z» indica la profundidad en 3D (metros):
   F = lado cercano a la cámara (+), B = lado lejano (−).
   ===================================================================== */
(() => {
  "use strict";
  const RAD = Math.PI / 180;
  const dir = (a) => [Math.sin(a * RAD), Math.cos(a * RAD)];
  const add = (p, v, l = 1) => [p[0] + v[0] * l, p[1] + v[1] * l];
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const deg = (x, y) => Math.atan2(x, y) / RAD;
  const Sof = (P, T = 180) => add(P, dir(T), 45);
  const HCof = (P, T = 180, H = T) => add(add(P, dir(T), 50), dir(H), 17);

  const Z0 = { SF: 0.165, SB: -0.165, EF: 0.165, EB: -0.165, WF: 0.165, WB: -0.165, KF: 0.088, KB: -0.088, AF: 0.088, AB: -0.088, HC: 0 };
  const side = (o) => Object.assign({ view: "side", T: 180, H: 180 }, o, { z: Object.assign({}, Z0, o.z) });
  const front = (o) => Object.assign({ view: "front", P: [100, 103], T: 180, aL: [8, 6], aR: [8, 6], lL: [3, 2], lR: [3, 2] }, o);
  const stand = (x, o = {}) => side(Object.assign({
    P: [x, 103], aB: [-3, -2], aF: [4, 8],
    lB: { to: [x - 3, 183], ft: 90 }, lF: { to: [x + 4, 183], ft: 90 }
  }, o));
  // Sentado en un taburete (centro en x = 80)
  const stool = (o = {}) => side(Object.assign({
    P: [80, 140], aB: [-2, -4], aF: [2, 6],
    lB: { to: [116, 182], ft: 90 }, lF: { to: [121, 182], ft: 90 }
  }, o));
  // Tumbado boca arriba: cabeza a la izquierda, pies a la derecha
  const supine = (x, o = {}) => side(Object.assign({
    P: [x, 178], T: 270, H: 270, aF: [90, 92], aB: [90, 92], lF: [90, 90, 180], lB: [90, 90, 180]
  }, o));

  /* --- brazos explícitos (codo y muñeca) + profundidad --- */
  // Manos en la cintura, codos hacia fuera
  const waist = (P) => ({
    aF: { E: [P[0] - 5, P[1] - 31], W: [P[0] + 1, P[1] - 15] }, aB: { E: [P[0] - 5, P[1] - 31], W: [P[0] + 1, P[1] - 15] },
    zA: { EF: 0.34, EB: -0.34, WF: 0.18, WB: -0.18 }
  });
  // Brazos en cruz (horizontales hacia los lados)
  const cross = (S) => ({ aF: { E: S, W: S }, aB: { E: S, W: S }, zA: { EF: 0.45, EB: -0.45, WF: 0.74, WB: -0.74 } });
  // Brazos arriba, manos juntas
  const upJoin = (S) => ({ aF: { E: [S[0], S[1] - 29], W: [S[0], S[1] - 55] }, aB: { E: [S[0], S[1] - 29], W: [S[0], S[1] - 55] }, zA: { EF: 0.12, EB: -0.12, WF: 0.03, WB: -0.03 } });
  // Brazos abajo, junto al cuerpo
  const down = (S) => ({ aF: { E: [S[0] - 1, S[1] + 29], W: [S[0] + 1, S[1] + 55] }, aB: { E: [S[0] - 1, S[1] + 29], W: [S[0] + 1, S[1] + 55] }, zA: { EF: 0.2, EB: -0.2, WF: 0.21, WB: -0.21 } });
  // Manos en la nuca
  const nape = (P, T, H = T) => {
    const S = Sof(P, T), HC = HCof(P, T, H), f = [-Math.cos(H * RAD), Math.sin(H * RAD)];
    const W = add(HC, f, -7), E = add(mid(S, HC), f, 12);
    return { aF: { E, W }, aB: { E, W }, zA: { EF: 0.27, EB: -0.27, WF: 0.06, WB: -0.06 } };
  };
  // Une una pose con un juego de brazos explícitos
  const withArms = (pose, arms) => {
    const o = Object.assign({}, pose, { aF: arms.aF, aB: arms.aB });
    o.z = Object.assign({}, pose.z, arms.zA);
    return o;
  };
  // Cuerpo recto (plancha) desde el tobillo o la rodilla con ángulo th respecto al suelo
  const plank = (A, th, legLen) => {
    const u = [Math.cos(th * RAD), -Math.sin(th * RAD)];
    const P = add(A, u, legLen), T = deg(u[0], u[1]), legA = deg(-u[0], -u[1]);
    return { P, T, legA, S: add(P, u, 45) };
  };

  const M = {};

  /* 1 · Brazos arriba por delante */
  M.e1 = {
    frames: [
      { pose: stand(100), t: 1500, hold: 300 },
      { pose: stand(100, { aF: [178, 178], aB: [182, 182] }), t: 1500, hold: 500 }
    ],
    peak: 1, cue: { j: "HdF", off: [10, 0], bow: -24 }, focus: { j: "S", off: [8, 12], r: 16 }
  };

  /* 2 · Giro de cintura con bastón */
  {
    const b = { aF: [90, 90], aB: [90, 90], lB: { to: [97, 183], ft: 90 }, lF: { to: [104, 183], ft: 90 }, z: { WF: 0.2, WB: -0.2, EF: 0.18, EB: -0.18, KF: 0.1, KB: -0.1, AF: 0.12, AB: -0.12 } };
    M.e2 = {
      frames: [
        { pose: stand(100, Object.assign({ yaw: 0 }, b)), t: 900, hold: 150 },
        { pose: stand(100, Object.assign({ yaw: 48 }, b)), t: 900, hold: 350 },
        { pose: stand(100, Object.assign({ yaw: 0 }, b)), t: 900, hold: 150 },
        { pose: stand(100, Object.assign({ yaw: -48 }, b)), t: 900, hold: 350 }
      ],
      peak: 1, stick: true, noGhost: true, focus: { j: "P", off: [0, -18], r: 17 }, cam: { az: 62 }
    };
  }

  /* 3 · Flexión de piernas de puntillas, manos en la nuca */
  {
    const P0 = [98, 103], P1 = [96, 140];
    M.e3 = {
      frames: [
        { pose: withArms(stand(98, { lB: { toe: [112, 183], ft: 90 }, lF: { toe: [116, 183], ft: 90 } }), nape(P0, 180)), t: 1300, hold: 300 },
        { pose: withArms(stand(98, { P: P1, T: 172, H: 178, lB: { toe: [112, 186], ft: 38 }, lF: { toe: [116, 186], ft: 38 } }), nape(P1, 172, 178)), t: 1300, hold: 500 }
      ],
      peak: 1, focus: { j: "KF", off: [-6, -4], r: 16 }
    };
  }

  /* 4 · Rodilla al pecho tumbado */
  {
    const base = { z: { WF: 0.165, WB: -0.165 } };
    const kneeF = { lF: [222, 70, 140], aF: { to: [84, 150], bend: -1 }, aB: { to: [86, 148], bend: -1 }, z: { WF: 0.13, WB: 0.04, EF: 0.24, EB: -0.12 } };
    const kneeB = { lB: [222, 70, 140], aF: { to: [84, 150], bend: -1 }, aB: { to: [86, 148], bend: -1 }, z: { WF: -0.04, WB: -0.13, EF: 0.12, EB: -0.24 } };
    const rest = { aF: { to: [114, 182], bend: -1 }, aB: { to: [114, 182], bend: -1 } };
    M.e4 = {
      frames: [
        { pose: supine(105, Object.assign({}, rest, base)), t: 900, hold: 200 },
        { pose: supine(105, kneeF), t: 1000, hold: 600 },
        { pose: supine(105, Object.assign({}, rest, base)), t: 900, hold: 200 },
        { pose: supine(105, kneeB), t: 1000, hold: 600 }
      ],
      peak: 1, noGhost: true, focus: { j: "P", off: [-14, -6], r: 16 }
    };
  }

  /* 5 · Patada a la mano contraria */
  {
    const st = { P: [96, 103], lF: [0, 0, 90], lB: [-2, -2, 90], aF: { to: [146, 92] }, aB: { to: [143, 94] } };
    M.e5 = {
      frames: [
        { pose: side(Object.assign({}, st)), t: 700, hold: 150 },
        { pose: side(Object.assign({}, st, { T: 150, H: 160, lF: [90, 90, 176], aB: { to: [172, 88] }, aF: { to: [118, 128] }, z: { WB: 0.06, EB: -0.05, AF: 0.05, KF: 0.07 } })), t: 700, hold: 300 },
        { pose: side(Object.assign({}, st)), t: 700, hold: 150 },
        { pose: side(Object.assign({}, st, { T: 150, H: 160, lB: [90, 90, 176], aF: { to: [172, 88] }, aB: { to: [118, 128] }, z: { WF: -0.06, EF: 0.05, AB: -0.05, KB: -0.07 } })), t: 700, hold: 300 }
      ],
      peak: 1, noGhost: true, focus: { j: "P", off: [4, 2], r: 15 }
    };
  }

  /* 6 · Elevación de talones sobre un libro */
  M.e6 = {
    frames: [
      { pose: stand(102, { P: [103, 102], lB: { toe: [118, 178], ft: 106 }, lF: { toe: [122, 178], ft: 106 } }), t: 1000, hold: 300 },
      { pose: stand(102, { P: [107, 87], lB: { toe: [118, 178], ft: 46 }, lF: { toe: [122, 178], ft: 46 } }), t: 1000, hold: 500 }
    ],
    peak: 1, props: [["book", 122]], cue: { j: "HeelF", off: [-8, 2], bow: -8 }, focus: { j: "KF", off: [-3, 18], r: 14 }
  };

  /* 7 · Codos atrás para abrir el pecho */
  M.e7 = {
    frames: [
      { pose: stand(100, { aF: { E: [97, 60], W: [113, 62] }, aB: { E: [97, 60], W: [113, 62] }, z: { EF: 0.43, EB: -0.43, WF: 0.12, WB: -0.12 } }), t: 700, hold: 300 },
      { pose: stand(100, { aF: { E: [91, 59], W: [80, 61] }, aB: { E: [91, 59], W: [80, 61] }, z: { EF: 0.42, EB: -0.42, WF: 0.64, WB: -0.64 } }), t: 600, hold: 500 }
    ],
    peak: 1, focus: { j: "S", off: [8, 12], r: 16 }, cam: { az: 48 }
  };

  /* 8 · Bicicleta en el suelo (piernas arriba, manos en la espalda) */
  {
    const b = { P: [95, 135], T: 330, H: 270, aF: { to: [104, 146], bend: 1 }, aB: { to: [104, 146], bend: 1 } };
    M.e8 = {
      frames: [
        { pose: side(Object.assign({}, b, { lF: [178, 178, 200], lB: [206, 118, 170] })), t: 550 },
        { pose: side(Object.assign({}, b, { lF: [206, 118, 170], lB: [178, 178, 200] })), t: 550 }
      ],
      peak: 0, noGhost: true, focus: { j: "P", off: [-6, -4], r: 16 }
    };
  }

  /* 9 · Inclinación lateral con bastón, brazos arriba */
  {
    const a = { aL: [170, 176], aR: [170, 176], PT: 180 };
    M.e9 = {
      frames: [
        { pose: front(Object.assign({}, a)), t: 1000, hold: 150 },
        { pose: front(Object.assign({}, a, { T: 162, H: 164 })), t: 1000, hold: 350 },
        { pose: front(Object.assign({}, a)), t: 1000, hold: 150 },
        { pose: front(Object.assign({}, a, { T: 198, H: 196 })), t: 1000, hold: 350 }
      ],
      peak: 1, stick: true, noGhost: true, focus: { j: "HR", off: [-4, -22], r: 16 }
    };
  }

  /* 10 · Puños al cuello desde los brazos en cruz */
  M.e10 = {
    frames: [
      { pose: front({ aL: [90, 90], aR: [90, 90] }), t: 700, hold: 250 },
      { pose: front({ aL: [92, -122], aR: [92, -122] }), t: 600, hold: 400 }
    ],
    peak: 1, cue: { j: "HdR", off: [0, -8], bow: 16 }, focus: { j: "ER", off: [-12, 0], r: 13 }
  };

  /* 11 · Paso adelante con las manos en la cintura */
  {
    const P0 = [92, 103], P1 = [110, 130];
    M.e11 = {
      frames: [
        { pose: withArms(stand(92, { P: P0, lB: { toe: [104, 183], ft: 90 }, lF: { toe: [110, 183], ft: 90 } }), waist(P0)), t: 900, hold: 250 },
        { pose: withArms(stand(92, { P: P1, lB: { toe: [104, 186], ft: 52 }, lF: { toe: [156, 183], ft: 90 } }), waist(P1)), t: 900, hold: 500 }
      ],
      peak: 1, focus: { j: "KF", off: [-12, -4], r: 15 }
    };
  }

  /* 12 · Elevación de las dos piernas tumbado */
  M.e12 = {
    frames: [
      { pose: supine(100), t: 1500, hold: 300 },
      { pose: supine(100, { lF: [178, 178, 250], lB: [178, 178, 250] }), t: 1500, hold: 400 }
    ],
    peak: 1, cue: { j: "AF", off: [8, -6], bow: -18 }, focus: { j: "P", off: [-16, -8], r: 16 }
  };

  /* 13 · Rodilla al pecho de pie */
  {
    const st = { P: [96, 103], lF: [0, 0, 90], lB: [-1, -1, 90], aF: [4, 8], aB: [-3, -2] };
    const up = (k) => ({ T: 174, ["l" + k]: [150, 16, 80], aF: { to: [123, 80] }, aB: { to: [121, 82] },
      z: k === "F" ? { WF: 0.14, WB: 0.03, EF: 0.24, EB: -0.12 } : { WF: -0.03, WB: -0.14, EF: 0.12, EB: -0.24 } });
    M.e13 = {
      frames: [
        { pose: side(Object.assign({}, st, { aF: { to: [101, 112] }, aB: { to: [99, 112] } })), t: 800, hold: 200 },
        { pose: side(Object.assign({}, st, up("F"))), t: 900, hold: 500 },
        { pose: side(Object.assign({}, st, { aF: { to: [101, 112] }, aB: { to: [99, 112] } })), t: 800, hold: 200 },
        { pose: side(Object.assign({}, st, up("B"))), t: 900, hold: 500 }
      ],
      peak: 1, noGhost: true, focus: { j: "P", off: [10, -4], r: 15 }
    };
  }

  /* 14 · Rotación de cuello */
  {
    const P0 = [100, 103], b = withArms(stand(100), waist(P0));
    const h = (H, zc) => Object.assign({}, b, { H, z: Object.assign({}, b.z, { HC: zc }) });
    M.e14 = {
      frames: [
        { pose: h(158, 0), t: 1100 },
        { pose: h(180, 0.065), t: 1100 },
        { pose: h(200, 0), t: 1100 },
        { pose: h(180, -0.065), t: 1100 }
      ],
      peak: 0, noGhost: true, focus: { j: "N", off: [0, -4], r: 11 }, cam: { az: 50 }
    };
  }

  /* 15 · Brazos cruzados que se abren en cruz */
  const XL = { aL: { E: [90, 82], W: [106, 100] }, aR: { E: [110, 82], W: [94, 100] }, z: { EL: 0.15, WL: 0.25, ER: 0.15, WR: 0.3 } };
  M.e15 = {
    frames: [
      { pose: front(XL), t: 1300, hold: 300 },
      { pose: front({ aL: { E: [57, 58], W: [31, 58] }, aR: { E: [143, 58], W: [169, 58] }, z: { EL: 0, WL: 0, ER: 0, WR: 0 } }), t: 1300, hold: 500 }
    ],
    peak: 1, focus: { j: "N", off: [0, 16], r: 18 }
  };

  /* 16 · Flexiones apoyado en una silla */
  {
    const A = [28, 175], up = plank(A, 42, 80), dn = plank(A, 18.2, 80);
    const pose = (k) => side({ P: k.P, T: k.T, H: k.T - 4, lF: [k.legA, k.legA, 56], lB: [k.legA, k.legA, 56],
      aF: { to: [139, 140], bend: 1 }, aB: { to: [137, 140], bend: 1 }, z: { WF: 0.2, WB: -0.2, EF: 0.25, EB: -0.25 } });
    M.e16 = {
      frames: [{ pose: pose(up), t: 1000, hold: 250 }, { pose: pose(dn), t: 1000, hold: 300 }],
      peak: 1, props: [["chairRev", 134]], focus: { j: "S", off: [-4, 6], r: 15 }
    };
  }

  /* 17 · Mano a la rodilla contraria */
  {
    const S0 = Sof([100, 103]), legs = { lB: { to: [98, 183], ft: 90 }, lF: { to: [103, 183], ft: 90 } };
    const zl = { KF: 0.12, KB: -0.12, AF: 0.15, AB: -0.15 };
    const base = withArms(stand(100, Object.assign({ z: zl }, legs)), cross(S0));
    const bend = (s) => stand(100, Object.assign({}, legs, {
      P: [96, 104], T: 125, H: 138, yaw: 32 * s, yawA: false,
      aF: s > 0 ? { E: [118, 117], W: [104, 140] } : { E: [124, 102], W: [112, 78] },
      aB: s > 0 ? { E: [124, 102], W: [112, 78] } : { E: [118, 117], W: [104, 140] },
      z: Object.assign({}, zl, s > 0 ? { EF: 0.03, WF: -0.09, EB: -0.4, WB: -0.52 } : { EF: 0.4, WF: 0.52, EB: -0.03, WB: 0.09 })
    }));
    M.e17 = {
      frames: [
        { pose: Object.assign({ yaw: 0, yawA: false }, base), t: 1000, hold: 150 },
        { pose: bend(1), t: 1000, hold: 400 },
        { pose: Object.assign({ yaw: 0, yawA: false }, base), t: 1000, hold: 150 },
        { pose: bend(-1), t: 1000, hold: 400 }
      ],
      peak: 1, noGhost: true, focus: { j: "P", off: [6, -10], r: 16 }
    };
  }

  /* 18 · Posición de salida de velocista, cambiando de pierna */
  {
    const b = { P: [107.7, 143.4], T: 110, H: 122, aF: { to: [153, 180] }, aB: { to: [149, 180] }, z: { WF: 0.17, WB: -0.17 } };
    const fwd = { toe: [136, 186], ft: 30 }, back = { toe: [22, 186], ft: 315 };
    M.e18 = {
      frames: [
        { pose: side(Object.assign({}, b, { lF: fwd, lB: back })), t: 450, hold: 250 },
        { pose: side(Object.assign({}, b, { lF: back, lB: fwd })), t: 450, hold: 250 }
      ],
      peak: 0, noGhost: true, focus: { j: "P", off: [0, 0], r: 16 }
    };
  }

  /* 19 · Molinos con los brazos, sentado en un taburete */
  {
    const a = (f) => stool({ aF: [f, f], aB: [f + 180, f + 180] });
    M.e19 = {
      frames: [
        { pose: a(0), t: 1 },
        { pose: a(90), t: 650 },
        { pose: a(180), t: 650 },
        { pose: a(270), t: 650 },
        { pose: a(360), t: 650 }
      ],
      peak: 2, noGhost: true, props: [["stool", 80]], focus: { j: "S", off: [0, 8], r: 15 }
    };
  }

  /* 20 · Piernas alternas sentado en el suelo */
  {
    const b = { P: [100, 176], T: 202, H: 186, aF: { to: [70, 180] }, aB: { to: [66, 180] } };
    M.e20 = {
      frames: [
        { pose: side(Object.assign({}, b, { lF: [82, 82, 160], lB: [140, 56, 150] })), t: 650 },
        { pose: side(Object.assign({}, b, { lF: [140, 56, 150], lB: [82, 82, 160] })), t: 650 }
      ],
      peak: 0, noGhost: true, focus: { j: "P", off: [-6, -14], r: 15 }
    };
  }

  /* 21 · Incorporarse hasta los pies desde tumbado */
  M.e21 = {
    frames: [
      { pose: supine(105, { aF: { to: [6, 178] }, aB: { to: [6, 178] } }), t: 900, hold: 300 },
      { pose: supine(105, { T: 222, H: 214, aF: { to: [124, 150] }, aB: { to: [122, 150] } }), t: 900 },
      { pose: supine(105, { T: 124, H: 112, aF: { to: [184, 166] }, aB: { to: [182, 166] } }), t: 800, hold: 500 },
      { pose: supine(105, { T: 222, H: 214, aF: { to: [124, 150] }, aB: { to: [122, 150] } }), t: 900 }
    ],
    peak: 2, noGhost: true, focus: { j: "P", off: [-12, -8], r: 16 }
  };

  /* 22 · Brazos en cruz */
  M.e22 = {
    frames: [
      { pose: front(), t: 1200, hold: 300 },
      { pose: front({ aL: [90, 90], aR: [90, 90] }), t: 1200, hold: 500 }
    ],
    peak: 1, cue: { j: "HdR", off: [8, 4], bow: -22 }, focus: { j: "SR", off: [-2, 2], r: 13 }
  };

  /* 23 · Mano al pie contrario con las piernas separadas */
  {
    const P0 = [100, 108], S0 = Sof(P0), legs = { lB: { to: [100, 183], ft: 90 }, lF: { to: [102, 183], ft: 90 } };
    const zl = { KF: 0.17, KB: -0.17, AF: 0.3, AB: -0.3 };
    const base = withArms(stand(100, Object.assign({ P: P0, z: zl, yaw: 0, yawA: false }, legs)), cross(S0));
    const bend = (s) => stand(100, Object.assign({}, legs, {
      P: [94, 111], T: 98, H: 84, yaw: 36 * s, yawA: false,
      aF: s > 0 ? { E: [124, 150], W: [110, 178] } : { E: [136, 92], W: [134, 66] },
      aB: s > 0 ? { E: [136, 92], W: [134, 66] } : { E: [124, 150], W: [110, 178] },
      z: Object.assign({}, zl, s > 0 ? { EF: -0.04, WF: -0.25, EB: -0.34, WB: -0.44 } : { EF: 0.34, WF: 0.44, EB: 0.04, WB: 0.25 })
    }));
    M.e23 = {
      frames: [
        { pose: base, t: 1100, hold: 150 },
        { pose: bend(1), t: 1100, hold: 400 },
        { pose: base, t: 1100, hold: 150 },
        { pose: bend(-1), t: 1100, hold: 400 }
      ],
      peak: 1, noGhost: true, focus: { j: "P", off: [8, -8], r: 16 }
    };
  }

  /* 24 · Flexiones con las rodillas apoyadas */
  {
    const K = [62, 182], up = plank(K, 36.9, 40), dn = plank(K, 11.5, 40);
    const pose = (k) => side({ P: k.P, T: k.T, H: k.T - 2, lF: [k.legA, 261, 300], lB: [k.legA, 261, 300],
      aF: { to: [137, 180], bend: 1 }, aB: { to: [135, 180], bend: 1 }, z: { WF: 0.22, WB: -0.22, EF: 0.27, EB: -0.27 } });
    M.e24 = {
      frames: [{ pose: pose(up), t: 1000, hold: 250 }, { pose: pose(dn), t: 1000, hold: 300 }],
      peak: 1, focus: { j: "S", off: [-4, 6], r: 15 }
    };
  }

  /* 25 · Balanceo de pierna */
  {
    const P0 = [96, 103];
    const p = (a, T) => withArms(side({ P: P0, T, H: 180, lB: [-1, -1, 90], lF: a }), waist(P0));
    M.e25 = {
      frames: [
        { pose: p([0, 0, 90], 180), t: 450 },
        { pose: p([72, 72, 150], 186), t: 550, hold: 120 },
        { pose: p([0, 0, 90], 180), t: 450 },
        { pose: p([-32, -32, 50], 172), t: 550, hold: 120 }
      ],
      peak: 1, noGhost: true, focus: { j: "P", off: [4, 4], r: 15 }
    };
  }

  /* 26 · Piernas por encima de la cabeza (arado) */
  M.e26 = {
    frames: [
      { pose: supine(112), t: 1300, hold: 300 },
      { pose: supine(112, { lF: [180, 180, 250], lB: [180, 180, 250] }), t: 1300, hold: 200 },
      { pose: supine(112, { P: [70.7, 128.8], T: 350, lF: [309, 309, 280], lB: [309, 309, 280] }), t: 1400, hold: 500 },
      { pose: supine(112, { lF: [180, 180, 250], lB: [180, 180, 250] }), t: 1300, hold: 200 }
    ],
    peak: 2, noGhost: true, focus: { j: "P", off: [0, 6], r: 16 }, cam: { r: 3.8 }
  };

  /* 27 · Brazos cruzados que suben y se abren */
  M.e27 = {
    frames: [
      { pose: front(XL), t: 1200, hold: 200 },
      { pose: front({ aL: { E: [92, 34], W: [106, 10] }, aR: { E: [108, 34], W: [94, 10] }, z: { EL: 0.12, WL: 0.16, ER: 0.12, WR: 0.21 } }), t: 1300, hold: 150 },
      { pose: front({ aL: { E: [71.5, 33], W: [58.5, 10.4] }, aR: { E: [128.5, 33], W: [141.5, 10.4] }, z: { EL: 0, WL: 0, ER: 0, WR: 0 } }), t: 900, hold: 500 }
    ],
    peak: 2, focus: { j: "N", off: [0, 16], r: 18 }
  };

  /* 28 · Flexiones completas */
  {
    const A = [36, 176], up = plank(A, 21.1, 80), dn = plank(A, 5, 80);
    const pose = (k) => side({ P: k.P, T: k.T, H: k.T - 2, lF: [k.legA, k.legA, 45], lB: [k.legA, k.legA, 45],
      aF: { to: [157, 180], bend: 1 }, aB: { to: [155, 180], bend: 1 }, z: { WF: 0.22, WB: -0.22, EF: 0.28, EB: -0.28 } });
    M.e28 = {
      frames: [{ pose: pose(up), t: 1000, hold: 250 }, { pose: pose(dn), t: 1000, hold: 300 }],
      peak: 1, focus: { j: "S", off: [-4, 6], r: 15 }
    };
  }

  /* 29 · Tocar el suelo con las piernas rectas */
  M.e29 = {
    frames: [
      { pose: stand(96, { aF: [178, 178], aB: [182, 182] }), t: 1600, hold: 300 },
      { pose: stand(96, { P: [90, 108], T: 58, H: 66, aF: [12, 12], aB: [10, 10], lB: { to: [94, 183], ft: 90 }, lF: { to: [99, 183], ft: 90 } }), t: 1600, hold: 500 }
    ],
    peak: 1, focus: { j: "KF", off: [-6, 4], r: 15 }
  };

  /* 30 · Incorporarse con los pies en una silla baja */
  {
    const leg = [116, 116, 160];
    M.e30 = {
      frames: [
        { pose: supine(96, { lF: leg, lB: leg, aF: { to: [-4, 178] }, aB: { to: [-4, 178] } }), t: 900, hold: 300 },
        { pose: supine(96, { lF: leg, lB: leg, T: 214, H: 206, aF: { to: [120, 146] }, aB: { to: [118, 146] } }), t: 900 },
        { pose: supine(96, { lF: leg, lB: leg, T: 125, H: 112, aF: { to: [166, 140] }, aB: { to: [164, 140] } }), t: 800, hold: 500 },
        { pose: supine(96, { lF: leg, lB: leg, T: 214, H: 206, aF: { to: [120, 146] }, aB: { to: [118, 146] } }), t: 900 }
      ],
      peak: 2, noGhost: true, props: [["box", 172, 40]], focus: { j: "P", off: [-12, -8], r: 16 }
    };
  }

  /* 31 · Inclinación lateral sentado, manos en la nuca */
  {
    const P = [100, 134];
    const p = (T) => {
      const HC = HCof(P, T, T), L2 = { lL: [12, 2, 0.35, 0.88], lR: [12, 2, 0.35, 0.88] };
      return front(Object.assign({ P, T, H: T, PT: 180, aL: { to: [HC[0] - 5, HC[1] + 3], dz: -1 }, aR: { to: [HC[0] + 5, HC[1] + 3], dz: -1 } }, L2));
    };
    M.e31 = {
      frames: [
        { pose: p(180), t: 1000, hold: 150 },
        { pose: p(160), t: 1000, hold: 350 },
        { pose: p(180), t: 1000, hold: 150 },
        { pose: p(200), t: 1000, hold: 350 }
      ],
      peak: 1, noGhost: true, props: [["stool", 100]], focus: { j: "HR", off: [-4, -22], r: 15 }
    };
  }

  /* 32 · Abdominal completo con los pies sujetos */
  {
    const P = [100, 178];
    const p = (T, H) => withArms(supine(100, { T, H }), nape(P, T, H));
    M.e32 = {
      frames: [
        { pose: p(270, 270), t: 1000, hold: 250 },
        { pose: p(212, 204), t: 900 },
        { pose: p(118, 104), t: 800, hold: 400 },
        { pose: p(212, 204), t: 900 }
      ],
      peak: 2, noGhost: true, props: [["bench", 178]], focus: { j: "P", off: [-14, -8], r: 16 }
    };
  }

  /* 33 · Saltitos con las piernas flexionadas */
  {
    const P0 = [96, 122], P1 = [96, 107];
    M.e33 = {
      frames: [
        { pose: withArms(stand(96, { P: P0, T: 172, lB: { toe: [108, 183], ft: 90 }, lF: { toe: [112, 183], ft: 90 } }), waist(P0)), t: 330, hold: 80 },
        { pose: withArms(stand(96, { P: P1, T: 174, lB: { toe: [108, 182], ft: 54 }, lF: { toe: [112, 182], ft: 54 } }), waist(P1)), t: 300, hold: 40 }
      ],
      peak: 1, noGhost: true, focus: { j: "KF", off: [-8, -4], r: 15 }
    };
  }

  /* 34 · Tijeras en el suelo */
  {
    const b = { H: 262, aF: { to: [110, 185], bend: -1 }, aB: { to: [110, 185], bend: -1 } };
    M.e34 = {
      frames: [
        { pose: supine(105, Object.assign({}, b, { lF: [146, 146, 228], lB: [122, 122, 205] })), t: 520 },
        { pose: supine(105, Object.assign({}, b, { lF: [122, 122, 205], lB: [146, 146, 228] })), t: 520 }
      ],
      peak: 0, noGhost: true, focus: { j: "P", off: [-14, -8], r: 16 }
    };
  }

  /* 35 · Arriba de puntillas y abajo en cruz */
  {
    const P0 = [100, 103], P1 = [104, 95], P2 = [98, 150];
    const toes = (ft) => ({ lB: { toe: [114, ft === 90 ? 183 : 186], ft }, lF: { toe: [118, ft === 90 ? 183 : 186], ft } });
    M.e35 = {
      frames: [
        { pose: withArms(stand(100, Object.assign({ P: P0 }, toes(90))), down(Sof(P0))), t: 1200, hold: 250 },
        { pose: withArms(stand(100, Object.assign({ P: P1 }, toes(45))), upJoin(Sof(P1))), t: 1300, hold: 500 },
        { pose: withArms(stand(100, Object.assign({ P: P2, T: 176 }, toes(45))), cross(Sof(P2, 176))), t: 1300, hold: 500 },
        { pose: withArms(stand(100, Object.assign({ P: P1 }, toes(45))), upJoin(Sof(P1))), t: 1300, hold: 300 }
      ],
      peak: 1, noGhost: true, focus: { j: "KF", off: [-6, 6], r: 15 }
    };
  }

  /* 36 · Elevación de cadera sentado en el suelo */
  M.e36 = {
    frames: [
      { pose: side({ P: [96, 176], T: 205, H: 192, aF: { to: [62, 181] }, aB: { to: [58, 181] }, lF: { to: [142, 182], ft: 90 }, lB: { to: [138, 182], ft: 90 } }), t: 1100, hold: 250 },
      { pose: side({ P: [108, 131], T: 270, H: 250, aF: { to: [62, 181] }, aB: { to: [58, 181] }, lF: { to: [142, 182], ft: 90 }, lB: { to: [138, 182], ft: 90 } }), t: 1100, hold: 500 }
    ],
    peak: 1, focus: { j: "P", off: [0, 0], r: 16 }
  };

  /* 37 · Fondos en una silla */
  {
    const legs = { lF: { to: [168, 181], ft: 160 }, lB: { to: [165, 181], ft: 160 } };
    M.e37 = {
      frames: [
        { pose: side(Object.assign({ P: [100, 137], T: 180, H: 178, aF: { to: [92, 142], bend: -1 }, aB: { to: [90, 142], bend: -1 } }, legs)), t: 1000, hold: 250 },
        { pose: side(Object.assign({ P: [104, 170], T: 182, H: 176, aF: { to: [92, 142], bend: -1 }, aB: { to: [90, 142], bend: -1 } }, legs)), t: 1000, hold: 400 }
      ],
      peak: 1, props: [["chair", 48]], focus: { j: "EF", off: [0, 0], r: 13 }
    };
  }

  /* 38 · Giro sentado en el suelo hasta el pie contrario */
  {
    const P0 = [86, 176], legs = { lF: [90, 90, 180], lB: [90, 90, 180] }, zl = { KF: 0.2, KB: -0.2, AF: 0.34, AB: -0.34 };
    const base = withArms(side(Object.assign({ P: P0, yaw: 0, yawA: false, z: zl }, legs)), cross(Sof(P0)));
    const bend = (s) => side(Object.assign({}, legs, {
      P: P0, T: 116, H: 104, yaw: 34 * s, yawA: false,
      aF: s > 0 ? { E: [146, 158], W: [164, 166] } : { E: [120, 128], W: [108, 104] },
      aB: s > 0 ? { E: [120, 128], W: [108, 104] } : { E: [146, 158], W: [164, 166] },
      z: Object.assign({}, zl, s > 0 ? { EF: -0.06, WF: -0.3, EB: -0.3, WB: -0.4 } : { EF: 0.3, WF: 0.4, EB: 0.06, WB: 0.3 })
    }));
    M.e38 = {
      frames: [
        { pose: base, t: 1000, hold: 150 },
        { pose: bend(1), t: 1000, hold: 400 },
        { pose: base, t: 1000, hold: 150 },
        { pose: bend(-1), t: 1000, hold: 400 }
      ],
      peak: 1, noGhost: true, focus: { j: "P", off: [6, -12], r: 16 }
    };
  }

  /* 39 · Sentadilla a una pierna con apoyo en una silla */
  M.e39 = {
    frames: [
      { pose: side({ P: [96, 103], lB: { to: [96, 183], ft: 90 }, lF: [26, 26, 110], aB: { to: [100, 96] }, aF: [60, 70], z: { WB: -0.4, EB: -0.3 } }), t: 1300, hold: 300 },
      { pose: side({ P: [90, 150], T: 160, H: 168, lB: { to: [96, 183], ft: 90 }, lF: [90, 90, 176], aB: { to: [100, 96] }, aF: [80, 84], z: { WB: -0.4, EB: -0.36 } }), t: 1300, hold: 400 }
    ],
    peak: 1, props: [["chairFar", 100]], focus: { j: "KB", off: [-6, -4], r: 15 }
  };

  /* 40 · Cabeza a la rodilla, sentado con las piernas separadas */
  {
    const P0 = [86, 176], legs = { lF: [90, 90, 180], lB: [90, 90, 180] }, zl = { KF: 0.2, KB: -0.2, AF: 0.34, AB: -0.34 };
    const p = (T, H, yaw) => withArms(side(Object.assign({ P: P0, T, H, yaw, z: zl }, legs)), nape(P0, T, H));
    M.e40 = {
      frames: [
        { pose: p(180, 180, 0), t: 1000, hold: 150 },
        { pose: p(112, 84, 30), t: 1100, hold: 400 },
        { pose: p(180, 180, 0), t: 1000, hold: 150 },
        { pose: p(112, 84, -30), t: 1100, hold: 400 }
      ],
      peak: 1, noGhost: true, focus: { j: "P", off: [6, -12], r: 16 }
    };
  }

  /* 41 · Caminar a cuatro patas con brazos y piernas rectos */
  {
    const b = { T: 60, H: 26 };
    M.e41 = {
      frames: [
        { pose: side(Object.assign({}, b, { P: [90, 110], aF: { to: [160, 180] }, aB: { to: [148, 180] }, lF: { to: [58, 183], ft: 90 }, lB: { to: [68, 183], ft: 90 } })), t: 450 },
        { pose: side(Object.assign({}, b, { P: [94, 110], aF: { to: [152, 180] }, aB: { to: [162, 180] }, lF: { to: [70, 183], ft: 90 }, lB: { to: [60, 183], ft: 90 } })), t: 450 }
      ],
      peak: 0, noGhost: true, focus: { j: "S", off: [0, 0], r: 15 }
    };
  }

  /* 42 · Bastón por encima de la cabeza, sentado en un taburete */
  {
    const S = Sof([80, 140]), zg = { EF: 0.25, EB: -0.25, WF: 0.28, WB: -0.28 };
    const g = (E, W) => stool({ aF: { E, W }, aB: { E, W }, z: zg });
    const chest = g([84, 122], [101, 109]), over = g([S[0] + 1, S[1] - 29], [S[0] + 2, S[1] - 55]), behind = g([63.4, 71.2], [48.5, 49.9]);
    M.e42 = {
      frames: [
        { pose: chest, t: 1000, hold: 200 },
        { pose: over, t: 1000, hold: 150 },
        { pose: behind, t: 900, hold: 400 },
        { pose: over, t: 900, hold: 150 }
      ],
      peak: 2, stick: true, noGhost: true, props: [["stool", 80]], focus: { j: "S", off: [-4, 6], r: 15 }
    };
  }

  /* Activación: correr en el sitio de puntillas (complemento del ejercicio 6) */
  {
    const b = { P: [100, 97], T: 176 };
    M.act = {
      frames: [
        { pose: side(Object.assign({}, b, { lF: [38, -12, 48], lB: [-2, -4, 52], aF: [-28, 62], aB: [32, 112] })), t: 330 },
        { pose: side(Object.assign({}, b, { lF: [-2, -4, 52], lB: [38, -12, 48], aF: [32, 112], aB: [-28, 62] })), t: 330 }
      ],
      peak: 0, noGhost: true
    };
  }
  /* Vuelta a la calma: el ejercicio 1, muy lento */
  M.calma = Object.assign({}, M.e1, { frames: M.e1.frames.map((f) => Object.assign({}, f, { t: 2600, hold: 600 })), cue: null });

  window.MOV = M;
})();
