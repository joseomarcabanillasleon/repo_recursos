/* =====================================================================
   Movimientos de cada ejercicio (fotogramas clave para Figura)
   Vista lateral mirando a la derecha. Suelo en y = 188.
   ===================================================================== */
(() => {
  "use strict";
  const side = (o) => Object.assign({ view: "side", T: 180, H: 180 }, o);
  const front = (o) => Object.assign({ view: "front", P: [100, 103], T: 180, aL: [8, 6], aR: [8, 6], lL: [3, 2], lR: [3, 2] }, o);
  // De pie, vista lateral
  const stand = (x, o = {}) => side(Object.assign({
    P: [x, 103], aB: [-3, -2], aF: [4, 8],
    lB: { to: [x - 3, 183], ft: 90 }, lF: { to: [x + 4, 183], ft: 90 }
  }, o));
  // Sentado en la silla (silla con respaldo en x = 66)
  const seated = (o = {}) => side(Object.assign({
    P: [80, 140], T: 176, H: 178,
    aB: { to: [104, 133] }, aF: { to: [109, 134] },
    lB: { to: [117, 183], ft: 90 }, lF: { to: [122, 183], ft: 90 }
  }, o));
  // De pie detrás de una silla, sujetando el respaldo (silla en x = 132)
  const holding = (o = {}) => stand(92, Object.assign({ aB: { to: [126, 100] }, aF: { to: [131, 98] } }, o));

  window.MOV = {
    marcha: {
      frames: [
        { pose: stand(92), t: 420 },
        { pose: stand(92, { lF: { to: [114, 150], ft: 78 }, aF: [-28, -14], aB: [34, 72] }), t: 420, hold: 80 },
        { pose: stand(92), t: 420 },
        { pose: stand(92, { lB: { to: [110, 150], ft: 78 }, aB: [-28, -14], aF: [34, 72] }), t: 420, hold: 80 }
      ],
      peak: 1, cue: { j: "KF", off: [8, 0], bow: -10 }, noGhost: true
    },
    brazos: {
      frames: [
        { pose: front(), t: 1300, hold: 500 },
        { pose: front({ aL: [92, 94], aR: [92, 94] }), t: 1300, hold: 600 }
      ],
      peak: 1, cue: { j: "HdR", off: [8, 4], bow: -22 }, focus: { j: "SR", off: [-2, 2], r: 13 }
    },
    omoplatos: {
      frames: [
        { pose: front({ back: true, sw: 15, aL: [10, 8], aR: [10, 8] }), t: 900, hold: 300 },
        { pose: front({ back: true, sw: 11, aL: [5, 2], aR: [5, 2] }), t: 900, hold: 900 }
      ],
      peak: 1, cuePaths: ["M62 80 L78 80", "M138 80 L122 80"], focus: { j: "N", off: [0, 24], r: 20 }, noGhost: true
    },
    giro: {
      frames: [
        { pose: front({ P: [100, 128], aL: { to: [110, 92] }, aR: { to: [90, 92] }, lL: [12, 2, 0.35], lR: [12, 2, 0.35] }), t: 900, hold: 200 },
        { pose: front({ P: [100, 128], rot: 38, aL: { to: [118, 93] }, aR: { to: [98, 91] }, lL: [12, 2, 0.35], lR: [12, 2, 0.35] }), t: 1000, hold: 500 },
        { pose: front({ P: [100, 128], aL: { to: [110, 92] }, aR: { to: [90, 92] }, lL: [12, 2, 0.35], lR: [12, 2, 0.35] }), t: 1000, hold: 200 },
        { pose: front({ P: [100, 128], rot: -38, aL: { to: [102, 91] }, aR: { to: [82, 93] }, lL: [12, 2, 0.35], lR: [12, 2, 0.35] }), t: 1000, hold: 500 }
      ],
      peak: 1, cuePaths: ["M80 40 Q100 30 120 40", "M120 44 Q100 54 80 44"], noGhost: true
    },
    levantarse: {
      frames: [
        { pose: seated(), t: 700, hold: 500 },
        { pose: seated({ T: 146, H: 150, aB: { to: [118, 126] }, aF: { to: [123, 126] } }), t: 650 },
        { pose: seated({ P: [100, 122], T: 150, H: 156, aB: { to: [124, 120] }, aF: { to: [129, 120] } }), t: 650 },
        { pose: seated({ P: [116, 103], T: 178, H: 180, aB: { to: [113, 152] }, aF: { to: [120, 152] } }), t: 700, hold: 700 },
        { pose: seated({ P: [100, 122], T: 150, H: 156, aB: { to: [124, 120] }, aF: { to: [129, 120] } }), t: 800 },
        { pose: seated({ T: 146, H: 150, aB: { to: [118, 126] }, aF: { to: [123, 126] } }), t: 700 }
      ],
      peak: 3, props: [["chair", 66]], cue: { j: "P", off: [-10, 0], bow: 22 }, focus: { j: "KF", off: [-14, -6], r: 15 }
    },
    talones: {
      frames: [
        { pose: holding({ P: [92, 104], lB: { toe: [105, 184], ft: 90 }, lF: { toe: [109, 184], ft: 90 } }), t: 900, hold: 300 },
        { pose: holding({ P: [92, 95], lB: { toe: [105, 184], ft: 52 }, lF: { toe: [109, 184], ft: 52 }, aB: { to: [126, 98] }, aF: { to: [131, 96] } }), t: 900, hold: 700 }
      ],
      peak: 1, props: [["chairFront", 132]], cue: { j: "HeelF", off: [-8, 2], bow: -8 }, focus: { j: "KF", off: [-3, 18], r: 13 }
    },
    rodilla: {
      frames: [
        { pose: seated(), t: 900, hold: 400 },
        { pose: seated({ lF: { to: [158, 131], ft: 160 } }), t: 900, hold: 700 }
      ],
      peak: 1, props: [["chair", 66]], cue: { j: "ToeF", off: [6, 6], bow: -16 }, focus: { j: "KF", off: [-16, -6], r: 14 }
    },
    pared: {
      frames: [
        { pose: side({ P: [103, 108], T: 160, H: 162, aB: { to: [171, 73] }, aF: { to: [173, 70] }, lB: { to: [74, 183], ft: 90 }, lF: { to: [78, 183], ft: 90 } }), t: 900, hold: 300 },
        { pose: side({ P: [114, 113], T: 154, H: 158, aB: { to: [171, 73] }, aF: { to: [173, 70] }, lB: { to: [74, 183], ft: 90 }, lF: { to: [78, 183], ft: 90 } }), t: 900, hold: 500 }
      ],
      peak: 1, az: 6, tx: 0.2, props: [["wall", 176]], cue: { j: "N", off: [0, -16], bow: -8 }, focus: { j: "S", off: [8, 10], r: 14 }
    },
    paso: {
      frames: [
        { pose: holding({ lB: { to: [89, 183], ft: 90 } }), t: 800, hold: 300 },
        { pose: holding({ P: [94, 104], lB: { to: [66, 175], ft: 58 } }), t: 800, hold: 500 }
      ],
      peak: 1, props: [["chairFront", 132]], cue: { j: "AB", off: [0, -8], bow: 10 }, focus: { j: "P", off: [-6, 6], r: 14 }
    },
    lado: {
      frames: [
        { pose: front({ aR: { to: [150, 98] } }), t: 900, hold: 300 },
        { pose: front({ aR: { to: [150, 98] }, lR: [19, 19] }), t: 900, hold: 500 }
      ],
      peak: 1, props: [["chairSide", 140]], cue: { j: "AR", off: [4, -6], bow: 10 }, focus: { j: "HR", off: [6, -2], r: 12 }
    },
    rodillas: {
      frames: [
        { pose: seated(), t: 700, hold: 250 },
        { pose: seated({ lF: { to: [114, 160], ft: 78 } }), t: 700, hold: 350 }
      ],
      peak: 1, props: [["chair", 66]], cue: { j: "KF", off: [8, 0], bow: -10 }, focus: { j: "P", off: [14, -2], r: 12 }
    },
    equilibrio: {
      frames: [
        { pose: stand(92, { lB: { to: [86, 183], ft: 90 }, lF: { to: [104, 183], ft: 90 }, aF: { to: [126, 102] } }), t: 1400 },
        { pose: stand(92, { P: [95, 103], T: 178, lB: { to: [86, 183], ft: 90 }, lF: { to: [104, 183], ft: 90 }, aF: { to: [126, 100] } }), t: 1400 },
        { pose: stand(92, { P: [90, 103], T: 182, lB: { to: [86, 183], ft: 90 }, lF: { to: [104, 183], ft: 90 }, aF: { to: [126, 103] } }), t: 1400 }
      ],
      peak: 0, props: [["chairFront", 132]], focus: { j: "AF", off: [-8, -2], r: 14 }, noGhost: true
    },
    calma: {
      frames: [
        { pose: front(), t: 2200, hold: 400 },
        { pose: front({ aL: [150, 158], aR: [150, 158] }), t: 2200, hold: 500 }
      ],
      peak: 1, cue: { j: "HdR", off: [10, 0], bow: -26 }
    }
  };
})();
