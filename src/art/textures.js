// Arte procedural: todas as texturas são desenhadas com Graphics e "assadas"
// com generateTexture no boot. Sem arquivos de imagem, sem licenças de terceiros.
// Paleta inspirada na referência: céu claro, montanhas azuladas, lago,
// floresta verde e castelo de pedra com telhados vermelhos.

const C = {
  skyTop: 0x5fb3ea,
  skyBottom: 0xd9f1ff,
  mountainFar: 0x8fb0d6,
  mountainNear: 0x6f93c4,
  snow: 0xf4f8ff,
  lake: 0x7cc7e8,
  lakeLight: 0xb4e2f4,
  hill: 0x7cbf5a,
  hillDark: 0x5ea347,
  treeDark: 0x2f6b3a,
  tree: 0x3f8a46,
  treeLight: 0x5aa957,
  trunk: 0x6b4426,
  grass: 0x63b548,
  grassLight: 0x86cf5c,
  dirt: 0x8b5a34,
  dirtDark: 0x6e4527,
  stone: 0xb9b2a6,
  stoneDark: 0x8f877b,
  roof: 0xc8453b,
  roofDark: 0x9e3029,
  skin: 0xf2c29b,
  hair: 0x6b3f1d,
  tunic: 0x3b6fb6,
  tunicDark: 0x2c548c,
  cape: 0xd9622b,
  leather: 0x8a5a2b,
  boot: 0x4a2f1a,
  steel: 0xdfe6ee,
  steelDark: 0x9aa7b4,
  gold: 0xe8b84a,
};

function bake(scene, key, w, h, draw) {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

function lerpColor(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (
    (Math.round(ar + (br - ar) * t) << 16) |
    (Math.round(ag + (bg - ag) * t) << 8) |
    Math.round(ab + (bb - ab) * t)
  );
}

// Gerador pseudoaleatório com semente: a arte sai igual em toda execução.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------------------------------------------------------------- cenário

function sky(scene) {
  bake(scene, 'sky', 960, 540, (g) => {
    const bands = 54;
    for (let i = 0; i < bands; i++) {
      g.fillStyle(lerpColor(C.skyTop, C.skyBottom, i / (bands - 1)));
      g.fillRect(0, i * 10, 960, 10);
    }
  });
}

function cloud(scene) {
  bake(scene, 'cloud', 240, 100, (g) => {
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(60, 62, 34);
    g.fillCircle(105, 45, 44);
    g.fillCircle(155, 55, 38);
    g.fillCircle(190, 68, 26);
    g.fillRect(40, 62, 170, 30);
    g.fillStyle(0xe3f1fb, 1);
    g.fillRect(40, 84, 170, 8);
  });
}

function mountains(scene) {
  // 1024 px que repetem sem emenda (primeiro e último pico iguais nas bordas).
  bake(scene, 'mountains', 1024, 300, (g) => {
    const peaks = [
      [0, 120, 260, C.mountainFar],
      [170, 60, 300, C.mountainNear],
      [380, 110, 240, C.mountainFar],
      [560, 40, 320, C.mountainNear],
      [800, 95, 260, C.mountainFar],
      [1024, 120, 260, C.mountainFar],
    ];
    for (const [x, top, half, color] of peaks) {
      g.fillStyle(color);
      g.fillTriangle(x - half, 260, x, top, x + half, 260);
      g.fillStyle(C.snow);
      const capH = 38;
      const capW = (half * capH) / (260 - top);
      g.fillTriangle(x - capW, top + capH, x, top, x + capW, top + capH);
      g.fillStyle(lerpColor(color, 0x000000, 0.12));
      g.fillTriangle(x, top, x + half, 260, x + half * 0.35, 260);
    }
    // lago na base das montanhas
    g.fillStyle(C.lake);
    g.fillRect(0, 245, 1024, 55);
    g.fillStyle(C.lakeLight);
    const r = rng(7);
    for (let i = 0; i < 26; i++) g.fillRect(r() * 1000, 252 + r() * 40, 20 + r() * 50, 2);
  });
}

function hills(scene) {
  bake(scene, 'hills', 1024, 220, (g) => {
    g.fillStyle(C.hillDark);
    for (const [x, r] of [[0, 150], [260, 170], [520, 140], [760, 180], [1024, 150]]) {
      g.fillCircle(x, 210, r);
    }
    g.fillStyle(C.hill);
    for (const [x, r] of [[120, 120], [390, 130], [640, 115], [900, 125]]) g.fillCircle(x, 230, r);
    g.fillRect(0, 190, 1024, 30);
  });
}

function pine(g, x, base, h, color) {
  g.fillStyle(C.trunk);
  g.fillRect(x - 4, base - 18, 8, 18);
  g.fillStyle(color);
  for (let i = 0; i < 3; i++) {
    const w = h * (0.42 - i * 0.09);
    const y = base - 14 - i * h * 0.26;
    g.fillTriangle(x - w, y, x, y - h * 0.42, x + w, y);
  }
}

function roundTree(g, x, base, r, color) {
  g.fillStyle(C.trunk);
  g.fillRect(x - 5, base - r, 10, r);
  g.fillStyle(color);
  g.fillCircle(x, base - r * 1.3, r);
  g.fillCircle(x - r * 0.6, base - r * 1.0, r * 0.7);
  g.fillCircle(x + r * 0.6, base - r * 1.0, r * 0.7);
}

function forestBand(scene) {
  bake(scene, 'forest', 1024, 260, (g) => {
    const r = rng(42);
    g.fillStyle(C.treeDark);
    g.fillRect(0, 225, 1024, 35);
    for (let x = 10; x < 1024; x += 46 + r() * 30) {
      if (r() > 0.45) pine(g, x, 240, 120 + r() * 90, r() > 0.5 ? C.treeDark : C.tree);
      else roundTree(g, x, 240, 30 + r() * 18, r() > 0.5 ? C.tree : C.treeLight);
    }
  });
}

function bigTree(scene) {
  bake(scene, 'tree', 180, 280, (g) => {
    g.fillStyle(C.trunk);
    g.fillRect(80, 150, 22, 130);
    g.fillTriangle(70, 280, 91, 240, 112, 280);
    g.fillStyle(C.treeDark);
    g.fillCircle(90, 110, 70);
    g.fillStyle(C.tree);
    g.fillCircle(60, 120, 50);
    g.fillCircle(125, 115, 52);
    g.fillCircle(92, 70, 52);
    g.fillStyle(C.treeLight);
    g.fillCircle(75, 60, 22);
    g.fillCircle(120, 90, 18);
  });
}

function bush(scene) {
  bake(scene, 'bush', 110, 56, (g) => {
    g.fillStyle(C.tree);
    g.fillCircle(30, 36, 22);
    g.fillCircle(58, 28, 28);
    g.fillCircle(84, 36, 20);
    g.fillRect(10, 36, 92, 20);
    g.fillStyle(C.treeLight);
    g.fillCircle(52, 20, 9);
    g.fillStyle(0xf06a7a);
    g.fillCircle(36, 30, 3);
    g.fillCircle(76, 34, 3);
  });
}

function ground(scene) {
  bake(scene, 'ground', 64, 96, (g) => {
    g.fillStyle(C.dirt);
    g.fillRect(0, 0, 64, 96);
    g.fillStyle(C.dirtDark);
    g.fillCircle(14, 40, 5);
    g.fillCircle(46, 62, 6);
    g.fillCircle(30, 84, 4);
    g.fillStyle(C.grass);
    g.fillRect(0, 0, 64, 16);
    g.fillStyle(C.grassLight);
    g.fillRect(0, 0, 64, 5);
    g.fillStyle(C.grass);
    for (let x = 2; x < 64; x += 8) g.fillTriangle(x, 16, x + 4, 24, x + 8, 16);
  });
}

function ledge(scene) {
  bake(scene, 'ledge', 64, 34, (g) => {
    g.fillStyle(C.stoneDark);
    g.fillRect(0, 6, 64, 28);
    g.fillStyle(C.stone);
    g.fillRect(0, 6, 64, 18);
    g.fillStyle(C.stoneDark);
    g.fillRect(30, 6, 2, 18);
    g.fillStyle(C.grass);
    g.fillRect(0, 0, 64, 8);
    g.fillStyle(C.grassLight);
    g.fillRect(0, 0, 64, 3);
  });
}

function fence(scene) {
  bake(scene, 'fence', 44, 150, (g) => {
    for (const x of [4, 18, 32]) {
      g.fillStyle(0x7a4b26);
      g.fillRect(x, 16, 10, 134);
      g.fillTriangle(x, 16, x + 5, 2, x + 10, 16);
      g.fillStyle(0x5c381b);
      g.fillRect(x + 7, 16, 3, 134);
    }
    g.fillStyle(0x5c381b);
    g.fillRect(0, 50, 44, 8);
    g.fillRect(0, 110, 44, 8);
  });
}

function castle(scene) {
  // Portão centralizado em x=260; base em y=440.
  bake(scene, 'castle', 520, 440, (g) => {
    const tower = (x, w, top, roofH) => {
      g.fillStyle(C.stone);
      g.fillRect(x, top, w, 440 - top);
      g.fillStyle(C.stoneDark);
      g.fillRect(x + w - 8, top, 8, 440 - top);
      for (let y = top + 30; y < 440; y += 34) g.fillRect(x + 6, y, w - 18, 3);
      g.fillStyle(0x3d4a5c);
      g.fillRect(x + w / 2 - 6, top + 34, 12, 20);
      g.fillStyle(C.roof);
      g.fillTriangle(x - 8, top, x + w / 2, top - roofH, x + w + 8, top);
      g.fillStyle(C.roofDark);
      g.fillTriangle(x + w / 2, top - roofH, x + w + 8, top, x + w / 2, top);
      g.fillStyle(0x6b4426);
      g.fillRect(x + w / 2 - 1, top - roofH - 26, 3, 26);
      g.fillStyle(C.gold);
      g.fillTriangle(x + w / 2 + 2, top - roofH - 26, x + w / 2 + 24, top - roofH - 19, x + w / 2 + 2, top - roofH - 12);
    };
    // muralha
    g.fillStyle(C.stone);
    g.fillRect(40, 250, 440, 190);
    g.fillStyle(C.stoneDark);
    for (let x = 40; x < 480; x += 28) g.fillRect(x, 236, 16, 18);
    for (let y = 280; y < 440; y += 30) g.fillRect(40, y, 440, 3);
    tower(10, 70, 200, 90);
    tower(440, 70, 200, 90);
    tower(205, 110, 90, 130);
    tower(130, 60, 170, 70);
    tower(330, 60, 170, 70);
    // portão
    g.fillStyle(0x2a2420);
    g.fillRect(225, 340, 70, 100);
    g.fillCircle(260, 340, 35);
    g.fillStyle(0x7a4b26);
    for (let x = 230; x < 292; x += 12) g.fillRect(x, 330, 6, 110);
  });
  // versão distante (silhueta azulada) para o horizonte
  bake(scene, 'castleFar', 520, 440, (g) => {
    g.fillStyle(0x9db8d8);
    g.fillRect(40, 250, 440, 190);
    for (const [x, w, top, rh] of [[10, 70, 200, 90], [440, 70, 200, 90], [205, 110, 90, 130], [130, 60, 170, 70], [330, 60, 170, 70]]) {
      g.fillStyle(0x9db8d8);
      g.fillRect(x, top, w, 440 - top);
      g.fillStyle(0xc87a7a);
      g.fillTriangle(x - 8, top, x + w / 2, top - rh, x + w + 8, top);
    }
  });
}

function fruit(scene) {
  bake(scene, 'fruit', 26, 28, (g) => {
    g.fillStyle(0xd8343a);
    g.fillCircle(9, 17, 9);
    g.fillCircle(17, 17, 9);
    g.fillStyle(0xff7b7b);
    g.fillCircle(8, 13, 3);
    g.fillStyle(0x6b4426);
    g.fillRect(12, 2, 3, 8);
    g.fillStyle(C.grass);
    g.fillTriangle(15, 6, 24, 2, 20, 10);
  });
}

function heart(scene) {
  bake(scene, 'heart', 28, 26, (g) => {
    g.fillStyle(0xe5394a);
    g.fillCircle(8, 9, 8);
    g.fillCircle(20, 9, 8);
    g.fillTriangle(0, 11, 28, 11, 14, 26);
    g.fillStyle(0xff9aa5);
    g.fillCircle(7, 7, 3);
  });
}

function fx(scene) {
  bake(scene, 'spark', 10, 10, (g) => {
    g.fillStyle(0xffffff);
    g.fillCircle(5, 5, 5);
  });
  bake(scene, 'dust', 12, 12, (g) => {
    g.fillStyle(0xe8d6b5);
    g.fillCircle(6, 6, 6);
  });
  bake(scene, 'slash', 110, 110, (g) => {
    // crescente: arco grosso branco com bordas mais transparentes
    for (let i = 0; i < 6; i++) {
      g.lineStyle(14 - i * 2, 0xffffff, 0.25 + i * 0.13);
      g.beginPath();
      g.arc(30, 55, 62 - i * 2, -1.15, 1.15, false);
      g.strokePath();
    }
  });
  bake(scene, 'pixel', 4, 4, (g) => {
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 4, 4);
  });
}

// ---------------------------------------------------------------- herói

function hero(scene) {
  // 48x64, virado para a direita, pés em y=64.
  const frame = (key, { legA, legB, bob = 0, armUp = false, jump = false }) =>
    bake(scene, key, 48, 64, (g) => {
      const y = bob;
      // capa (atrás)
      g.fillStyle(C.cape);
      g.fillTriangle(16, 22 + y, 22, 22 + y, jump ? 2 : 5, 50 + y);
      g.fillTriangle(16, 22 + y, 5, 50 + y, 18, 46 + y);
      // mochila
      g.fillStyle(C.leather);
      g.fillRect(10, 23 + y, 9, 17);
      g.fillStyle(0x6e4420);
      g.fillRect(10, 28 + y, 9, 3);
      // pernas
      g.fillStyle(C.tunicDark);
      g.fillRect(19 + legA, 42 + y, 6, 14 - y);
      g.fillRect(25 + legB, 42 + y, 6, 14 - y);
      g.fillStyle(C.boot);
      g.fillRect(18 + legA, 56, 9, 8);
      g.fillRect(24 + legB, 56, 9, 8);
      // tronco
      g.fillStyle(C.tunic);
      g.fillRect(18, 22 + y, 14, 22);
      g.fillStyle(C.tunicDark);
      g.fillRect(28, 22 + y, 4, 22);
      g.fillStyle(0x5b3a1e);
      g.fillRect(18, 36 + y, 14, 4);
      g.fillStyle(C.gold);
      g.fillRect(24, 36 + y, 3, 4);
      // braço
      g.fillStyle(C.tunic);
      if (armUp) g.fillRect(29, 20 + y, 6, 10);
      else g.fillRect(29, 24 + y, 6, 12);
      g.fillStyle(C.skin);
      if (armUp) g.fillCircle(33, 19 + y, 3.5);
      else g.fillCircle(32, 37 + y, 3.5);
      // cabeça
      g.fillStyle(C.skin);
      g.fillCircle(25, 13 + y, 8);
      g.fillStyle(C.hair);
      g.fillRect(17, 4 + y, 16, 6);
      g.fillTriangle(17, 6 + y, 21, 6 + y, 15, 17 + y);
      g.fillStyle(0x1d1d28);
      g.fillRect(28, 12 + y, 2, 3);
    });

  frame('hero-idle', { legA: 0, legB: 0 });
  frame('hero-idle2', { legA: 0, legB: 0, bob: 1 });
  frame('hero-run1', { legA: -4, legB: 4, bob: 0 });
  frame('hero-run2', { legA: 0, legB: 0, bob: -2 });
  frame('hero-run3', { legA: 4, legB: -4, bob: 0 });
  frame('hero-jump', { legA: -3, legB: 3, jump: true, armUp: true });
  frame('hero-attack', { legA: -3, legB: 4, armUp: true });

  bake(scene, 'hero-dead', 64, 32, (g) => {
    g.fillStyle(C.cape);
    g.fillTriangle(10, 14, 40, 10, 34, 28);
    g.fillStyle(C.tunic);
    g.fillRect(16, 14, 24, 14);
    g.fillStyle(C.boot);
    g.fillRect(40, 18, 16, 8);
    g.fillStyle(C.skin);
    g.fillCircle(10, 20, 8);
    g.fillStyle(C.hair);
    g.fillRect(2, 12, 6, 16);
  });

  // espada separada para girar com tween (origem no cabo)
  bake(scene, 'sword', 50, 12, (g) => {
    g.fillStyle(C.leather);
    g.fillRect(0, 4, 9, 4);
    g.fillStyle(C.gold);
    g.fillRect(9, 0, 4, 12);
    g.fillStyle(C.steel);
    g.fillRect(13, 3, 30, 6);
    g.fillTriangle(43, 3, 50, 6, 43, 9);
    g.fillStyle(C.steelDark);
    g.fillRect(13, 6, 30, 2);
  });
}

// ---------------------------------------------------------------- dinos

function raptor(scene) {
  const frame = (key, { step = 0, windup = false, hurt = false }) =>
    bake(scene, key, 72, 48, (g) => {
      const body = hurt ? 0xffffff : 0x4f9a3a;
      const dark = hurt ? 0xffffff : 0x356f27;
      const belly = hurt ? 0xffffff : 0xb9d98a;
      const headY = windup ? 20 : 12;
      // cauda
      g.fillStyle(body);
      g.fillTriangle(0, 16, 24, 20, 24, 32);
      // pernas
      g.fillStyle(dark);
      g.fillRect(28 + step, 32, 6, 14);
      g.fillRect(40 - step, 32, 6, 14);
      g.fillRect(26 + step, 44, 10, 4);
      g.fillRect(38 - step, 44, 10, 4);
      // corpo
      g.fillStyle(body);
      g.fillEllipse(38, 26, 40, 20);
      g.fillStyle(belly);
      g.fillEllipse(40, 31, 26, 8);
      g.fillStyle(dark);
      for (const x of [26, 34, 42]) g.fillTriangle(x, 17, x + 4, 22, x + 8, 17);
      // pescoço e cabeça
      g.fillStyle(body);
      g.fillTriangle(46, 18, 58, headY + 2, 54, 30);
      g.fillEllipse(60, headY + 4, 22, 12);
      if (windup) {
        g.fillStyle(0xb8323a);
        g.fillTriangle(56, headY + 6, 72, headY + 3, 72, headY + 12);
        g.fillStyle(0xffffff);
        g.fillTriangle(62, headY + 5, 64, headY + 9, 66, headY + 5);
      }
      g.fillStyle(0xffe14a);
      g.fillCircle(62, headY + 1, 2.5);
      g.fillStyle(0x1d1d28);
      g.fillCircle(63, headY + 1, 1.2);
      // braço
      g.fillStyle(dark);
      g.fillRect(50, 26, 6, 3);
    });
  frame('raptor-walk1', { step: -3 });
  frame('raptor-walk2', { step: 3 });
  frame('raptor-windup', { windup: true });
}

function trike(scene) {
  const frame = (key, { step = 0, windup = false }) =>
    bake(scene, key, 112, 66, (g) => {
      const body = 0xc2803f;
      const dark = 0x8f5a28;
      const headDrop = windup ? 8 : 0;
      g.fillStyle(body);
      g.fillTriangle(0, 30, 24, 28, 24, 42);
      g.fillStyle(dark);
      g.fillRect(28 + step, 44, 12, 20);
      g.fillRect(46 - step, 44, 12, 20);
      g.fillRect(62 + step, 44, 12, 20);
      g.fillStyle(body);
      g.fillEllipse(50, 38, 76, 40);
      g.fillStyle(0xe3b57a);
      g.fillEllipse(52, 48, 50, 10);
      g.fillStyle(dark);
      for (const x of [30, 44, 58]) g.fillCircle(x, 26, 4);
      // folho (frill) e cabeça
      g.fillStyle(0xe0a95f);
      g.fillCircle(84, 26 + headDrop, 22);
      g.fillStyle(0xb5723a);
      g.fillCircle(84, 26 + headDrop, 15);
      g.fillStyle(body);
      g.fillEllipse(96, 38 + headDrop, 28, 20);
      g.fillStyle(0xf8efd8);
      g.fillTriangle(94, 26 + headDrop, 112, 18 + headDrop, 98, 32 + headDrop);
      g.fillTriangle(100, 40 + headDrop, 112, 38 + headDrop, 104, 44 + headDrop);
      g.fillStyle(0x1d1d28);
      g.fillCircle(98, 33 + headDrop, 2);
      if (windup) {
        g.fillStyle(0xffffff, 0.8);
        g.fillTriangle(0, 60, 10, 52, 14, 62);
      }
    });
  frame('trike-walk1', { step: -3 });
  frame('trike-walk2', { step: 3 });
  frame('trike-windup', { windup: true });
}

function rex(scene) {
  const frame = (key, { step = 0, windup = false }) =>
    bake(scene, key, 176, 132, (g) => {
      const body = 0x7a4a8c;
      const dark = 0x56306a;
      const belly = 0xc9a6d6;
      // cauda
      g.fillStyle(body);
      g.fillTriangle(0, 56, 60, 48, 60, 84);
      // pernas
      g.fillStyle(dark);
      g.fillRect(58 + step, 86, 22, 40);
      g.fillRect(92 - step, 86, 22, 40);
      g.fillRect(54 + step, 122, 32, 10);
      g.fillRect(88 - step, 122, 32, 10);
      // corpo
      g.fillStyle(body);
      g.fillEllipse(88, 72, 96, 66);
      g.fillStyle(belly);
      g.fillEllipse(100, 86, 54, 26);
      g.fillStyle(dark);
      for (const x of [60, 76, 92, 108]) g.fillTriangle(x, 42, x + 7, 30, x + 14, 42);
      // cabeça
      const hy = windup ? 30 : 18;
      g.fillStyle(body);
      g.fillTriangle(110, 50, 128, hy + 10, 130, 70);
      g.fillRoundedRect(118, hy, 58, 30, 10);
      if (windup) {
        g.fillStyle(0xb8323a);
        g.fillTriangle(124, hy + 24, 176, hy + 22, 176, hy + 46);
        g.fillStyle(body);
        g.fillRoundedRect(122, hy + 36, 50, 12, 5);
        g.fillStyle(0xffffff);
        for (let x = 134; x < 172; x += 8) g.fillTriangle(x, hy + 26, x + 3, hy + 32, x + 6, hy + 26);
      } else {
        g.fillStyle(dark);
        g.fillRect(126, hy + 24, 48, 4);
        g.fillStyle(0xffffff);
        for (let x = 134; x < 172; x += 8) g.fillTriangle(x, hy + 22, x + 3, hy + 27, x + 6, hy + 22);
      }
      g.fillStyle(0xffb13b);
      g.fillCircle(138, hy + 10, 4.5);
      g.fillStyle(0x1d1d28);
      g.fillRect(138, hy + 7, 2, 7);
      g.fillStyle(dark);
      g.fillTriangle(128, hy + 2, 144, hy - 6, 146, hy + 4);
      // braço curto
      g.fillStyle(dark);
      g.fillRect(124, 70, 14, 5);
    });
  frame('rex-walk1', { step: -4 });
  frame('rex-walk2', { step: 4 });
  frame('rex-windup', { windup: true });
}

export function buildTextures(scene) {
  sky(scene);
  cloud(scene);
  mountains(scene);
  hills(scene);
  forestBand(scene);
  bigTree(scene);
  bush(scene);
  ground(scene);
  ledge(scene);
  fence(scene);
  castle(scene);
  fruit(scene);
  heart(scene);
  fx(scene);
  hero(scene);
  raptor(scene);
  trike(scene);
  rex(scene);
}

export function buildAnimations(scene) {
  const a = scene.anims;
  const keys = (...k) => k.map((key) => ({ key }));
  a.create({ key: 'hero-idle', frames: keys('hero-idle', 'hero-idle2'), frameRate: 2, repeat: -1 });
  a.create({ key: 'hero-run', frames: keys('hero-run1', 'hero-run2', 'hero-run3', 'hero-run2'), frameRate: 11, repeat: -1 });
  for (const t of ['raptor', 'trike', 'rex']) {
    a.create({ key: `${t}-walk`, frames: keys(`${t}-walk1`, `${t}-walk2`), frameRate: t === 'raptor' ? 9 : 5, repeat: -1 });
  }
}
