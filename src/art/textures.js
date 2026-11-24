// Arte procedural pintada com Canvas 2D (degradês, curvas, contornos e luz).
// Tudo é gerado no boot: sem arquivos de imagem, sem licenças de terceiros.
//
// Direção de arte (skill `create-game-assets`):
// - Vista lateral, luz vinda do sol no alto à direita (lado direito das formas mais claro).
// - Personagens: contorno escuro quente (#2a1d24, 2 px), sombreamento em degradê de cima
//   para baixo, um brilho de borda. Silhuetas legíveis em escala 1:1 sobre a floresta.
// - Cenário: perspectiva atmosférica. Quanto mais longe, mais azulado, claro e sem contorno.
// - Paleta da referência: céu azul claro, montanhas azul-lavanda com neve, lago turquesa,
//   floresta verde em três valores, pedra clara, telhados vermelhos.

const OUT = '#2a1d24';
const TAU = Math.PI * 2;

// ------------------------------------------------------------------ utilitários

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function canvasTex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const t = scene.textures.createCanvas(key, w, h);
  const ctx = t.getContext();
  draw(ctx, w, h);
  t.refresh();
  return t;
}

/** Folha de quadros nomeados lado a lado numa única textura. */
function sheet(scene, key, fw, fh, names, drawFrame) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const t = scene.textures.createCanvas(key, fw * names.length, fh);
  const ctx = t.getContext();
  names.forEach((name, i) => {
    ctx.save();
    ctx.translate(i * fw, 0);
    ctx.beginPath();
    ctx.rect(0, 0, fw, fh);
    ctx.clip();
    drawFrame(ctx, name, i);
    ctx.restore();
    t.add(name, 0, i * fw, 0, fw, fh);
  });
  t.refresh();
}

function lin(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}

function rad(ctx, x, y, r0, r1, stops, x1 = x, y1 = y) {
  const g = ctx.createRadialGradient(x, y, r0, x1, y1, r1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}

/** Preenche o caminho atual e contorna. */
function paint(ctx, fill, stroke = OUT, width = 2) {
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

/** Membro arredondado (linha grossa com contorno) passando pelos pontos. */
function limb(ctx, pts, w, color, outline = true) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  };
  if (outline) {
    path();
    ctx.strokeStyle = OUT;
    ctx.lineWidth = w + 3;
    ctx.stroke();
  }
  path();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
}

/** Perna de dois segmentos: ângulos absolutos a partir da vertical (positivo = para frente). */
function legPoints(hx, hy, thighA, shinA, l1, l2) {
  const kx = hx + Math.sin(thighA) * l1;
  const ky = hy + Math.cos(thighA) * l1;
  return [
    [hx, hy],
    [kx, ky],
    [kx + Math.sin(shinA) * l2, ky + Math.cos(shinA) * l2],
  ];
}

function ellipse(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
}

// Desenha algo em x e nas cópias deslocadas, para texturas que repetem sem emenda.
function wrapX(w, x, fn) {
  fn(x);
  fn(x - w);
  fn(x + w);
}

// ------------------------------------------------------------------ céu e luz

function sky(scene) {
  canvasTex(scene, 'sky', 960, 540, (ctx) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, 540, [
      [0, '#3f8fd8'],
      [0.35, '#7dbcec'],
      [0.62, '#c4e5f8'],
      [0.8, '#eef8ff'],
      [1, '#f6fbff'],
    ]);
    ctx.fillRect(0, 0, 960, 540);
    // brilho do sol
    ctx.fillStyle = rad(ctx, 780, 70, 0, 340, [
      [0, 'rgba(255,251,226,0.95)'],
      [0.12, 'rgba(255,246,210,0.75)'],
      [0.4, 'rgba(255,240,200,0.22)'],
      [1, 'rgba(255,240,200,0)'],
    ]);
    ctx.fillRect(0, 0, 960, 540);
    ctx.fillStyle = 'rgba(255,255,245,0.95)';
    ellipse(ctx, 780, 70, 26, 26);
    ctx.fill();
  });

  canvasTex(scene, 'rays', 960, 540, (ctx) => {
    const sx = 780;
    const sy = 40;
    for (const [a, w, alpha] of [[2.05, 0.06, 0.22], [2.25, 0.04, 0.16], [2.45, 0.08, 0.2], [2.7, 0.05, 0.14], [1.85, 0.04, 0.12]]) {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(a - w) * 900, sy + Math.sin(a - w) * 900);
      ctx.lineTo(sx + Math.cos(a + w) * 900, sy + Math.sin(a + w) * 900);
      ctx.closePath();
      ctx.fillStyle = lin(ctx, sx, sy, sx + Math.cos(a) * 700, sy + Math.sin(a) * 700, [
        [0, `rgba(255,248,215,${alpha})`],
        [1, 'rgba(255,248,215,0)'],
      ]);
      ctx.fill();
    }
  });

  canvasTex(scene, 'vignette', 960, 540, (ctx) => {
    ctx.fillStyle = rad(ctx, 480, 300, 260, 640, [
      [0, 'rgba(20,24,40,0)'],
      [1, 'rgba(20,24,40,0.38)'],
    ]);
    ctx.fillRect(0, 0, 960, 540);
  });
}

function cloud(scene, key, seed, w, h) {
  canvasTex(scene, key, w, h, (ctx) => {
    const r = rng(seed);
    const puffs = [];
    const n = 7;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = 30 + t * (w - 60);
      const rr = (Math.sin(t * Math.PI) * 0.6 + 0.4) * h * 0.42 + r() * 8;
      puffs.push([x, h - 24 - rr * 0.55 - r() * 10, rr]);
    }
    // massa com sombra embaixo
    ctx.save();
    ctx.beginPath();
    for (const [x, y, rr] of puffs) {
      ctx.moveTo(x + rr, y);
      ctx.arc(x, y, rr, 0, TAU);
    }
    ctx.rect(24, h - 40, w - 48, 22);
    ctx.fillStyle = lin(ctx, 0, 10, 0, h - 16, [
      [0, '#ffffff'],
      [0.6, '#f3f8fd'],
      [1, '#c9dcef'],
    ]);
    ctx.fill();
    ctx.restore();
    // realces do lado do sol
    for (const [x, y, rr] of puffs) {
      ctx.fillStyle = rad(ctx, x + rr * 0.3, y - rr * 0.35, 0, rr * 0.8, [
        [0, 'rgba(255,255,255,0.9)'],
        [1, 'rgba(255,255,255,0)'],
      ]);
      ellipse(ctx, x + rr * 0.3, y - rr * 0.35, rr * 0.8, rr * 0.8);
      ctx.fill();
    }
  });
}

// ------------------------------------------------------------------ montanhas e lago

function peak(ctx, x, top, half, base, body, shadow, snowDepth, seed) {
  const r = rng(seed);
  const left = [];
  const right = [];
  const steps = 7;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    left.push([x - half * t + (r() - 0.5) * 18, top + (base - top) * t + (r() - 0.5) * 10]);
    right.push([x + half * t + (r() - 0.5) * 18, top + (base - top) * t + (r() - 0.5) * 10]);
  }
  ctx.beginPath();
  ctx.moveTo(x - half, base);
  for (let i = left.length - 1; i >= 0; i--) ctx.lineTo(...left[i]);
  ctx.lineTo(x, top);
  for (const p of right) ctx.lineTo(...p);
  ctx.lineTo(x + half, base);
  ctx.closePath();
  ctx.fillStyle = lin(ctx, x - half, top, x + half, base, body);
  ctx.fill();

  // face na sombra (lado esquerdo, longe do sol)
  ctx.beginPath();
  ctx.moveTo(x, top);
  for (let i = 0; i < left.length; i++) ctx.lineTo(left[i][0] + (x - left[i][0]) * 0.35 * (1 - i / left.length), left[i][1]);
  ctx.lineTo(x - half, base);
  ctx.lineTo(x - half * 0.15, base);
  ctx.closePath();
  ctx.fillStyle = shadow;
  ctx.fill();

  // neve com borda irregular
  const sd = snowDepth;
  ctx.beginPath();
  ctx.moveTo(x, top);
  const cap = (base - top) * sd;
  const capHalf = half * sd;
  ctx.lineTo(x + capHalf, top + cap);
  for (let i = 6; i >= -6; i--) {
    const px = x + (capHalf * i) / 6;
    const py = top + cap * (0.75 + 0.25 * Math.abs(i / 6)) + (i % 2 ? 10 : -4) * (1 - Math.abs(i / 6));
    ctx.lineTo(px, py);
  }
  ctx.lineTo(x - capHalf, top + cap);
  ctx.closePath();
  ctx.fillStyle = lin(ctx, x - capHalf, top, x + capHalf, top + cap, [
    [0, '#dfe8f7'],
    [0.55, '#ffffff'],
    [1, '#f3f7ff'],
  ]);
  ctx.fill();
}

function mountains(scene) {
  const W = 1024;
  canvasTex(scene, 'mountains', W, 300, (ctx) => {
    // cordilheira distante (mais clara, mais azul)
    const far = [[60, 70, 210], [330, 40, 250], [610, 80, 200], [860, 55, 230]];
    far.forEach(([x, top, half], i) =>
      wrapX(W, x, (xx) =>
        peak(ctx, xx, top, half, 250, [[0, '#b9cdea'], [1, '#9db6dc']], 'rgba(120,140,190,0.28)', 0.3, 11 + i),
      ),
    );
    // névoa entre as cordilheiras
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = lin(ctx, 0, 120, 0, 260, [[0, 'rgba(230,242,252,0)'], [1, 'rgba(230,242,252,0.75)']]);
    ctx.fillRect(0, 120, W, 140);
    ctx.globalCompositeOperation = 'source-over';
    // cordilheira próxima
    const near = [[190, 95, 230, 21], [480, 70, 260, 22], [760, 110, 220, 23], [1010, 90, 240, 24]];
    near.forEach(([x, top, half, s]) =>
      wrapX(W, x, (xx) =>
        peak(ctx, xx, top, half, 262, [[0, '#8ea8d6'], [1, '#6c86bd']], 'rgba(60,70,130,0.3)', 0.28, s),
      ),
    );
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = lin(ctx, 0, 190, 0, 262, [[0, 'rgba(225,238,250,0)'], [1, 'rgba(225,238,250,0.65)']]);
    ctx.fillRect(0, 190, W, 72);
    ctx.globalCompositeOperation = 'source-over';

    // lago
    ctx.fillStyle = lin(ctx, 0, 250, 0, 300, [[0, '#a9def3'], [0.4, '#79c4e6'], [1, '#4fa6d6']]);
    ctx.fillRect(0, 250, W, 50);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(0, 250, W, 2);
    const r = rng(77);
    for (let i = 0; i < 70; i++) {
      const x = r() * W;
      const y = 256 + r() * 40;
      const len = 8 + r() * 40;
      ctx.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.45})`;
      wrapX(W, x, (xx) => ctx.fillRect(xx, y, len, 1.5));
    }
  });
}

// ------------------------------------------------------------------ colinas e floresta

function hills(scene) {
  const W = 1024;
  canvasTex(scene, 'hills', W, 220, (ctx) => {
    const ridge = (y0, amp, phase, fill, seed) => {
      ctx.beginPath();
      ctx.moveTo(0, 220);
      for (let x = 0; x <= W; x += 8) {
        const t = (x / W) * TAU;
        ctx.lineTo(x, y0 + Math.sin(t * 2 + phase) * amp + Math.sin(t * 3 + phase * 2) * amp * 0.5);
      }
      ctx.lineTo(W, 220);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      // árvores minúsculas no cume
      const r = rng(seed);
      for (let i = 0; i < 46; i++) {
        const x = r() * W;
        const t = (x / W) * TAU;
        const y = y0 + Math.sin(t * 2 + phase) * amp + Math.sin(t * 3 + phase * 2) * amp * 0.5 + 6 + r() * 30;
        wrapX(W, x, (xx) => {
          ctx.fillStyle = 'rgba(40,100,60,0.55)';
          ellipse(ctx, xx, y, 5 + r() * 3, 7 + r() * 4);
          ctx.fill();
        });
      }
    };
    ridge(70, 18, 0.4, lin(ctx, 0, 40, 0, 220, [[0, '#9fd07e'], [1, '#6aac55']]), 5);
    // névoa só sobre o que já foi pintado (não sobre o céu transparente)
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(220,240,250,0.35)';
    ctx.fillRect(0, 0, W, 220);
    ctx.globalCompositeOperation = 'source-over';
    ridge(120, 14, 2.1, lin(ctx, 0, 100, 0, 220, [[0, '#8cc867'], [1, '#559a43']]), 6);
    // trilha clara serpenteando
    ctx.strokeStyle = 'rgba(240,225,180,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const t = (x / W) * TAU;
      const y = 175 + Math.sin(t * 2 + 1) * 12;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
}

function conifer(ctx, x, base, h, dark, mid, light) {
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(x - 3, base - h * 0.16, 6, h * 0.16);
  const tiers = 4;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const w = h * (0.32 - t * 0.06);
    const y = base - h * 0.12 - t * h * 0.24;
    const top = y - h * 0.36;
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x - w * 0.4, y - h * 0.08, x, top);
    ctx.quadraticCurveTo(x + w * 0.4, y - h * 0.08, x + w, y);
    ctx.quadraticCurveTo(x, y + h * 0.05, x - w, y);
    ctx.fillStyle = lin(ctx, x - w, top, x + w, y, [[0, dark], [0.55, mid], [1, light]]);
    ctx.fill();
  }
}

function roundCanopy(ctx, x, base, r, dark, mid, light, seed) {
  const rr = rng(seed);
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(x - r * 0.12, base - r * 1.1, r * 0.24, r * 1.1);
  const blobs = [[0, -1.5, 1], [-0.6, -1.15, 0.75], [0.6, -1.2, 0.78], [0.1, -2.0, 0.7]];
  for (const [dx, dy, s] of blobs) {
    ctx.fillStyle = dark;
    ellipse(ctx, x + dx * r, base + dy * r, r * s, r * s * 0.9);
    ctx.fill();
  }
  for (const [dx, dy, s] of blobs) {
    ctx.fillStyle = mid;
    ellipse(ctx, x + dx * r + r * 0.12, base + dy * r - r * 0.12, r * s * 0.75, r * s * 0.65);
    ctx.fill();
  }
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = light;
    ellipse(ctx, x + (rr() * 0.9) * r, base - r * (1.3 + rr() * 0.8), r * 0.22, r * 0.18);
    ctx.fill();
  }
}

function forestBand(scene) {
  const W = 1024;
  canvasTex(scene, 'forest', W, 260, (ctx) => {
    const r = rng(42);
    // fileira de trás, azulada pela distância
    for (let x = 0; x < W; x += 34 + r() * 20) {
      const h = 110 + r() * 70;
      wrapX(W, x, (xx) => conifer(ctx, xx, 235, h, '#3d6f63', '#4e8670', '#6aa284'));
    }
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(200,230,240,0.25)';
    ctx.fillRect(0, 0, W, 260);
    ctx.globalCompositeOperation = 'source-over';
    // fileira da frente
    for (let x = 10; x < W; x += 46 + r() * 34) {
      const seed = Math.floor(r() * 1e6);
      if (r() > 0.45) {
        const h = 130 + r() * 90;
        wrapX(W, x, (xx) => conifer(ctx, xx, 250, h, '#1f4f30', '#2f6e3c', '#5aa457'));
      } else {
        const rr = 26 + r() * 16;
        wrapX(W, x, (xx) => roundCanopy(ctx, xx, 250, rr, '#2c6436', '#3f8a45', '#7cc062', seed));
      }
    }
    ctx.fillStyle = lin(ctx, 0, 215, 0, 260, [[0, 'rgba(30,70,40,0)'], [1, '#24502f']]);
    ctx.fillRect(0, 215, W, 45);
  });
}

function bigTree(scene) {
  canvasTex(scene, 'tree', 210, 300, (ctx) => {
    // tronco e raízes
    ctx.beginPath();
    ctx.moveTo(88, 300);
    ctx.quadraticCurveTo(96, 220, 92, 150);
    ctx.lineTo(118, 150);
    ctx.quadraticCurveTo(114, 220, 124, 300);
    ctx.quadraticCurveTo(140, 296, 150, 300);
    ctx.lineTo(60, 300);
    ctx.quadraticCurveTo(74, 296, 88, 300);
    paint(ctx, lin(ctx, 90, 0, 124, 0, [[0, '#4a2e1a'], [0.6, '#7a5030'], [1, '#5a3a22']]), OUT, 2);
    ctx.strokeStyle = 'rgba(40,25,15,0.5)';
    ctx.lineWidth = 1.5;
    for (const x of [100, 108, 113]) {
      ctx.beginPath();
      ctx.moveTo(x, 160);
      ctx.quadraticCurveTo(x + 3, 220, x - 2, 290);
      ctx.stroke();
    }
    // copa: massa de sombra, meio-tom, luz
    const r = rng(9);
    const blobs = [[105, 120, 70], [60, 135, 48], [150, 130, 50], [80, 80, 52], [135, 80, 50], [108, 52, 44]];
    ctx.beginPath();
    for (const [x, y, rr] of blobs) {
      ctx.moveTo(x + rr, y);
      ctx.arc(x, y, rr, 0, TAU);
    }
    ctx.fillStyle = '#2a5f34';
    ctx.fill();
    for (const [x, y, rr] of blobs) {
      ctx.fillStyle = '#3d8444';
      ellipse(ctx, x + rr * 0.15, y - rr * 0.15, rr * 0.78, rr * 0.7);
      ctx.fill();
    }
    for (const [x, y, rr] of blobs) {
      ctx.fillStyle = 'rgba(120,195,95,0.9)';
      ellipse(ctx, x + rr * 0.35, y - rr * 0.38, rr * 0.38, rr * 0.3);
      ctx.fill();
    }
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = r() > 0.5 ? 'rgba(160,220,120,0.6)' : 'rgba(25,70,35,0.45)';
      ellipse(ctx, 40 + r() * 140, 20 + r() * 150, 3 + r() * 3, 2 + r() * 2, r() * 3);
      ctx.fill();
    }
  });
}

function bush(scene) {
  canvasTex(scene, 'bush', 130, 66, (ctx) => {
    const blobs = [[34, 44, 24], [64, 34, 30], [96, 44, 24], [50, 50, 20], [82, 52, 20]];
    ctx.beginPath();
    for (const [x, y, r] of blobs) {
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
    ctx.rect(14, 46, 102, 20);
    ctx.fillStyle = lin(ctx, 0, 6, 0, 66, [[0, '#4f9a48'], [1, '#2a6233']]);
    ctx.fill();
    for (const [x, y, r] of blobs) {
      ctx.fillStyle = 'rgba(140,210,100,0.75)';
      ellipse(ctx, x + r * 0.25, y - r * 0.4, r * 0.45, r * 0.3);
      ctx.fill();
    }
    const r = rng(3);
    for (let i = 0; i < 9; i++) {
      const x = 22 + r() * 86;
      const y = 26 + r() * 30;
      ctx.fillStyle = ['#f6d4e8', '#ffe68a', '#ff8fa3'][i % 3];
      for (let p = 0; p < 5; p++) {
        ellipse(ctx, x + Math.cos((p / 5) * TAU) * 2.5, y + Math.sin((p / 5) * TAU) * 2.5, 2, 2);
        ctx.fill();
      }
      ctx.fillStyle = '#e8a030';
      ellipse(ctx, x, y, 1.4, 1.4);
      ctx.fill();
    }
  });
}

// ------------------------------------------------------------------ chão, plataformas, cercas

function ground(scene) {
  const W = 128;
  canvasTex(scene, 'ground', W, 96, (ctx) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, 96, [[0, '#9c6a3c'], [0.5, '#7c522e'], [1, '#5a3a20']]);
    ctx.fillRect(0, 0, W, 96);
    const r = rng(5);
    // pedras com luz
    for (let i = 0; i < 9; i++) {
      const x = r() * W;
      const y = 34 + r() * 56;
      const rx = 4 + r() * 6;
      const ry = rx * 0.7;
      wrapX(W, x, (xx) => {
        ellipse(ctx, xx, y, rx, ry);
        ctx.fillStyle = '#6b4a30';
        ctx.fill();
        ellipse(ctx, xx - rx * 0.2, y - ry * 0.3, rx * 0.6, ry * 0.45);
        ctx.fillStyle = '#b79a78';
        ctx.fill();
      });
    }
    // sombra embaixo da grama
    ctx.fillStyle = lin(ctx, 0, 14, 0, 30, [[0, 'rgba(40,25,10,0.55)'], [1, 'rgba(40,25,10,0)']]);
    ctx.fillRect(0, 14, W, 16);
    // faixa de grama
    ctx.fillStyle = lin(ctx, 0, 0, 0, 18, [[0, '#8fd166'], [1, '#4f9a3c']]);
    ctx.fillRect(0, 0, W, 16);
    for (let x = 0; x < W; x += 4) {
      const h = 5 + ((x * 7) % 9);
      ctx.beginPath();
      ctx.moveTo(x, 14);
      ctx.quadraticCurveTo(x + 2, 14 + h * 0.4, x + 3, 14 + h);
      ctx.lineTo(x + 5, 14);
      ctx.fillStyle = '#4f9a3c';
      ctx.fill();
    }
    for (let i = 0; i < 40; i++) {
      const x = r() * W;
      const h = 4 + r() * 7;
      wrapX(W, x, (xx) => {
        ctx.strokeStyle = r() > 0.4 ? '#a6e07a' : '#5fae48';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(xx, 6);
        ctx.quadraticCurveTo(xx + 1, 3, xx + 2 * (r() - 0.5), 6 - h);
        ctx.stroke();
      });
    }
    ctx.fillStyle = 'rgba(255,255,230,0.35)';
    ctx.fillRect(0, 0, W, 2);
  });
}

function ledge(scene) {
  const W = 128;
  canvasTex(scene, 'ledge', W, 34, (ctx) => {
    ctx.fillStyle = lin(ctx, 0, 6, 0, 34, [[0, '#d2cbbd'], [0.6, '#a8a092'], [1, '#7d7568']]);
    ctx.fillRect(0, 6, W, 28);
    ctx.strokeStyle = 'rgba(70,60,55,0.6)';
    ctx.lineWidth = 1.5;
    for (const x of [30, 74, 110]) {
      ctx.beginPath();
      ctx.moveTo(x, 8);
      ctx.lineTo(x + 3, 20);
      ctx.lineTo(x - 2, 33);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(0, 9, W, 2);
    // musgo
    ctx.fillStyle = lin(ctx, 0, 0, 0, 10, [[0, '#9ad66e'], [1, '#4f9a3c']]);
    ctx.fillRect(0, 0, W, 8);
    for (let x = 2; x < W; x += 9) {
      ctx.beginPath();
      ctx.ellipse(x + 3, 8, 4, 3 + ((x * 13) % 4), 0, 0, Math.PI);
      ctx.fillStyle = '#4f9a3c';
      ctx.fill();
    }
  });
}

function fence(scene) {
  canvasTex(scene, 'fence', 52, 152, (ctx) => {
    for (const x of [6, 21, 36]) {
      ctx.beginPath();
      ctx.moveTo(x, 152);
      ctx.lineTo(x, 18);
      ctx.lineTo(x + 5, 3);
      ctx.lineTo(x + 10, 18);
      ctx.lineTo(x + 10, 152);
      ctx.closePath();
      paint(ctx, lin(ctx, x, 0, x + 10, 0, [[0, '#5a3820'], [0.45, '#9a6a3c'], [1, '#6e4628']]));
      ctx.strokeStyle = 'rgba(40,25,15,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 4, 30);
      ctx.lineTo(x + 4, 140);
      ctx.stroke();
    }
    for (const y of [48, 112]) {
      ctx.beginPath();
      ctx.rect(1, y, 50, 9);
      paint(ctx, lin(ctx, 0, y, 0, y + 9, [[0, '#a5753f'], [1, '#6e4628']]));
      // amarração de corda
      for (const x of [11, 26, 41]) {
        ctx.strokeStyle = '#d9c08a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 2);
        ctx.lineTo(x + 4, y + 11);
        ctx.stroke();
      }
    }
  });
}

// ------------------------------------------------------------------ castelo

function drawCastle(ctx) {
  const stone = (x, y, w, h) => lin(ctx, x, y, x + w, y + h, [[0, '#cfc8bb'], [0.6, '#b4ac9e'], [1, '#8d8578']]);
  const roof = (x, top, w, rh) => {
    ctx.beginPath();
    ctx.moveTo(x - 10, top + 2);
    ctx.quadraticCurveTo(x + w / 2, top - rh * 0.4, x + w / 2, top - rh);
    ctx.quadraticCurveTo(x + w / 2, top - rh * 0.4, x + w + 10, top + 2);
    ctx.closePath();
    paint(ctx, lin(ctx, x, top - rh, x + w, top, [[0, '#a8322b'], [0.5, '#d9503f'], [1, '#e8705a']]));
    ctx.strokeStyle = 'rgba(110,25,20,0.45)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 10 + (i * (w + 20)) / 5, top + 2);
      ctx.lineTo(x + w / 2, top - rh);
      ctx.stroke();
    }
  };
  const flag = (x, y) => {
    ctx.strokeStyle = '#4a3020';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 1, y - 30);
    ctx.quadraticCurveTo(x + 14, y - 34, x + 26, y - 26);
    ctx.quadraticCurveTo(x + 14, y - 20, x + 1, y - 18);
    paint(ctx, lin(ctx, x, 0, x + 26, 0, [[0, '#e8b84a'], [1, '#ffd978']]), OUT, 1.5);
  };
  const window = (x, y, w = 10, h = 16) => {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + w / 2);
    ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    paint(ctx, lin(ctx, 0, y, 0, y + h, [[0, '#ffe8a0'], [1, '#f0a040']]), '#4a4038', 1.5);
  };
  const tower = (x, w, top, rh, windows = 2) => {
    ctx.beginPath();
    ctx.rect(x, top, w, 440 - top);
    paint(ctx, stone(x, top, w, 440 - top));
    ctx.strokeStyle = 'rgba(90,80,70,0.35)';
    ctx.lineWidth = 1;
    for (let y = top + 18, row = 0; y < 440; y += 18, row++) {
      ctx.beginPath();
      ctx.moveTo(x + 2, y);
      ctx.lineTo(x + w - 2, y);
      ctx.stroke();
      for (let bx = x + (row % 2 ? 12 : 4); bx < x + w - 4; bx += 18) {
        ctx.beginPath();
        ctx.moveTo(bx, y);
        ctx.lineTo(bx, y + 18);
        ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(60,50,60,0.18)';
    ctx.fillRect(x, top, w * 0.3, 440 - top);
    for (let i = 0; i < windows; i++) window(x + w / 2 - 5, top + 26 + i * 60);
    roof(x, top, w, rh);
    flag(x + w / 2, top - rh);
  };
  // muralha com ameias
  ctx.beginPath();
  ctx.rect(40, 262, 440, 178);
  paint(ctx, stone(40, 262, 440, 178));
  for (let x = 44; x < 476; x += 26) {
    ctx.beginPath();
    ctx.rect(x, 244, 15, 20);
    paint(ctx, '#c4bcae', OUT, 1.5);
  }
  ctx.strokeStyle = 'rgba(90,80,70,0.3)';
  ctx.lineWidth = 1;
  for (let y = 280; y < 440; y += 20) {
    ctx.beginPath();
    ctx.moveTo(42, y);
    ctx.lineTo(478, y);
    ctx.stroke();
  }
  // hera
  const r = rng(31);
  for (let i = 0; i < 140; i++) {
    const x = 60 + r() * 140 + (r() > 0.5 ? 260 : 0);
    const y = 330 + r() * 108;
    ctx.fillStyle = r() > 0.5 ? 'rgba(70,140,60,0.85)' : 'rgba(40,100,45,0.85)';
    ellipse(ctx, x, y, 4, 3, r() * 3);
    ctx.fill();
  }
  tower(10, 74, 205, 96);
  tower(436, 74, 205, 96);
  tower(130, 62, 170, 76);
  tower(328, 62, 170, 76);
  tower(200, 120, 92, 134, 3);
  // portão
  ctx.beginPath();
  ctx.moveTo(222, 440);
  ctx.lineTo(222, 352);
  ctx.arc(260, 352, 38, Math.PI, 0);
  ctx.lineTo(298, 440);
  ctx.closePath();
  paint(ctx, '#3a2e28');
  ctx.beginPath();
  ctx.moveTo(228, 440);
  ctx.lineTo(228, 354);
  ctx.arc(260, 354, 32, Math.PI, 0);
  ctx.lineTo(292, 440);
  ctx.closePath();
  paint(ctx, lin(ctx, 228, 0, 292, 0, [[0, '#5a3820'], [0.5, '#8a5a32'], [1, '#5a3820']]), OUT, 1.5);
  ctx.strokeStyle = '#3a2a22';
  ctx.lineWidth = 3;
  for (const y of [372, 404]) {
    ctx.beginPath();
    ctx.moveTo(228, y);
    ctx.lineTo(292, y);
    ctx.stroke();
  }
  ctx.lineWidth = 1.2;
  for (let x = 236; x < 292; x += 9) {
    ctx.beginPath();
    ctx.moveTo(x, 330);
    ctx.lineTo(x, 440);
    ctx.stroke();
  }
  // estandartes
  for (const x of [180, 318]) {
    ctx.beginPath();
    ctx.moveTo(x, 282);
    ctx.lineTo(x + 22, 282);
    ctx.lineTo(x + 22, 330);
    ctx.lineTo(x + 11, 320);
    ctx.lineTo(x, 330);
    ctx.closePath();
    paint(ctx, lin(ctx, x, 0, x + 22, 0, [[0, '#a8322b'], [1, '#d9503f']]), OUT, 1.5);
    ctx.fillStyle = '#ffd978';
    ellipse(ctx, x + 11, 298, 5, 5);
    ctx.fill();
  }
}

function castle(scene) {
  canvasTex(scene, 'castle', 520, 440, (ctx) => drawCastle(ctx));
  canvasTex(scene, 'castleFar', 520, 440, (ctx) => {
    drawCastle(ctx);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(176,200,232,0.62)';
    ctx.fillRect(0, 0, 520, 440);
    ctx.globalCompositeOperation = 'source-over';
  });
}

// ------------------------------------------------------------------ itens e efeitos

function items(scene) {
  canvasTex(scene, 'fruit', 30, 32, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(15, 10);
    ctx.bezierCurveTo(4, 2, -2, 16, 6, 26);
    ctx.bezierCurveTo(10, 32, 14, 29, 15, 28);
    ctx.bezierCurveTo(16, 29, 20, 32, 24, 26);
    ctx.bezierCurveTo(32, 16, 26, 2, 15, 10);
    paint(ctx, rad(ctx, 11, 14, 1, 16, [[0, '#ff8a80'], [0.45, '#e0393a'], [1, '#9e1f28']]));
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ellipse(ctx, 9, 13, 3, 2, -0.6);
    ctx.fill();
    limb(ctx, [[15, 10], [16, 3]], 2.5, '#6b4426', false);
    ctx.beginPath();
    ctx.moveTo(16, 6);
    ctx.quadraticCurveTo(22, 0, 28, 4);
    ctx.quadraticCurveTo(22, 9, 16, 6);
    paint(ctx, lin(ctx, 16, 0, 28, 8, [[0, '#4f9a3c'], [1, '#9ad66e']]), OUT, 1.2);
  });

  canvasTex(scene, 'heart', 32, 30, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(16, 28);
    ctx.bezierCurveTo(2, 18, 0, 8, 6, 4);
    ctx.bezierCurveTo(11, 0, 16, 4, 16, 8);
    ctx.bezierCurveTo(16, 4, 21, 0, 26, 4);
    ctx.bezierCurveTo(32, 8, 30, 18, 16, 28);
    paint(ctx, rad(ctx, 11, 9, 1, 20, [[0, '#ff9aa5'], [0.5, '#e5394a'], [1, '#a31d2c']]));
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ellipse(ctx, 9, 9, 3, 2, -0.6);
    ctx.fill();
  });

  canvasTex(scene, 'spark', 16, 16, (ctx) => {
    ctx.fillStyle = rad(ctx, 8, 8, 0, 8, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,250,210,0.9)'], [1, 'rgba(255,220,120,0)']]);
    ctx.fillRect(0, 0, 16, 16);
  });
  canvasTex(scene, 'dust', 18, 18, (ctx) => {
    ctx.fillStyle = rad(ctx, 9, 9, 0, 9, [[0, 'rgba(240,225,195,0.95)'], [1, 'rgba(240,225,195,0)']]);
    ctx.fillRect(0, 0, 18, 18);
  });
  canvasTex(scene, 'pixel', 10, 7, (ctx) => {
    // folhinha
    ctx.beginPath();
    ctx.moveTo(0, 3.5);
    ctx.quadraticCurveTo(5, -2, 10, 3.5);
    ctx.quadraticCurveTo(5, 9, 0, 3.5);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  });
  canvasTex(scene, 'mote', 10, 10, (ctx) => {
    ctx.fillStyle = rad(ctx, 5, 5, 0, 5, [[0, 'rgba(255,252,220,1)'], [1, 'rgba(255,252,220,0)']]);
    ctx.fillRect(0, 0, 10, 10);
  });
  canvasTex(scene, 'shadow', 80, 18, (ctx) => {
    ctx.fillStyle = rad(ctx, 40, 9, 0, 40, [[0, 'rgba(20,30,20,0.42)'], [1, 'rgba(20,30,20,0)']]);
    ctx.setTransform(1, 0, 0, 0.22, 0, 7);
    ctx.fillRect(0, -40, 80, 80);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });
  canvasTex(scene, 'slash', 130, 130, (ctx) => {
    ctx.shadowColor = 'rgba(190,235,255,0.9)';
    ctx.shadowBlur = 10;
    for (let i = 0; i < 7; i++) {
      ctx.strokeStyle = `rgba(${230 + i * 3},${245},255,${0.15 + i * 0.12})`;
      ctx.lineWidth = 16 - i * 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(34, 65, 70 - i * 1.5, -1.2 + i * 0.04, 1.2 - i * 0.04);
      ctx.stroke();
    }
  });
}

// ------------------------------------------------------------------ herói

const HERO_W = 60;
const HERO_H = 80;

const SKIN = '#f2c29b';
const TUNIC = ['#5b8fd6', '#3b6fb6', '#2a4f8a'];
const PANTS = '#3b4a6b';
const BOOT = '#5a3820';
const CAPE = ['#f08a4a', '#d9622b', '#a8441c'];
const HAIR = ['#8a5528', '#6b3f1d', '#4a2a12'];

function drawHero(ctx, p) {
  const b = p.bob ?? 0;
  const lean = p.lean ?? 0;
  ctx.save();
  ctx.translate(HERO_W / 2, HERO_H - 1);

  const hipY = -27 + b;
  const shoulder = [lean + 1, -47 + b];

  // perna de trás
  const back = legPoints(-3, hipY, p.legB[0], p.legB[1], 13, 13);
  limb(ctx, back, 7, '#2f3c58');
  boot(ctx, back[2], p.legB[1], '#4a2e1a');

  // braço de trás
  const bh = p.armB ?? [-7, -33];
  limb(ctx, [[shoulder[0] - 3, shoulder[1] + 2], [(shoulder[0] - 3 + bh[0]) / 2 - 2, (shoulder[1] + bh[1] + b) / 2 + 1], [bh[0], bh[1] + b]], 5, TUNIC[2]);
  ctx.fillStyle = '#7a4a28';
  ellipse(ctx, bh[0], bh[1] + b, 3.2, 3.2);
  ctx.fill();

  // capa (balança com o movimento)
  const flow = p.cape ?? 0;
  ctx.beginPath();
  ctx.moveTo(shoulder[0] + 3, shoulder[1] - 1);
  ctx.bezierCurveTo(-8, -48 + b, -14 - flow * 6, -34 + b - flow * 4, -19 - flow * 9, -14 + b - flow * 10);
  ctx.quadraticCurveTo(-12 - flow * 4, -12 + b - flow * 6, -6, -18 + b);
  ctx.quadraticCurveTo(-4, -30 + b, shoulder[0] - 2, shoulder[1] + 6);
  ctx.closePath();
  paint(ctx, lin(ctx, 0, -50, -18, -14, [[0, CAPE[0]], [0.5, CAPE[1]], [1, CAPE[2]]]));

  // mochila
  ctx.beginPath();
  ctx.roundRect(-15 + lean, -49 + b, 11, 19, 3);
  paint(ctx, lin(ctx, -15, 0, -4, 0, [[0, '#6e4420'], [1, '#a5733f']]));
  ctx.fillStyle = '#5a3418';
  ctx.fillRect(-15 + lean, -42 + b, 11, 3);
  ctx.fillStyle = '#e8b84a';
  ctx.fillRect(-11 + lean, -42 + b, 3, 3);

  // tronco (túnica)
  ctx.beginPath();
  ctx.moveTo(-6 + lean, -50 + b);
  ctx.lineTo(7 + lean, -50 + b);
  ctx.quadraticCurveTo(9 + lean * 0.5, -38 + b, 9, -24 + b);
  ctx.lineTo(-8, -24 + b);
  ctx.quadraticCurveTo(-8 + lean * 0.5, -38 + b, -6 + lean, -50 + b);
  ctx.closePath();
  paint(ctx, lin(ctx, -8, -50, 9, -24, [[0, TUNIC[2]], [0.45, TUNIC[1]], [1, TUNIC[0]]]));
  // alça da mochila e cinto
  limb(ctx, [[-5 + lean, -49 + b], [6, -33 + b]], 2.5, '#7a4a28', false);
  ctx.beginPath();
  ctx.rect(-8, -32 + b, 17, 4);
  paint(ctx, '#5b3a1e', OUT, 1.2);
  ctx.fillStyle = '#ffd978';
  ctx.fillRect(1, -32 + b, 4, 4);

  // perna da frente
  const front = legPoints(3, hipY, p.legF[0], p.legF[1], 13, 13);
  limb(ctx, front, 7.5, PANTS);
  boot(ctx, front[2], p.legF[1], BOOT);

  // cabeça
  const hx = 3 + lean * 1.3;
  const hy = -60 + b;
  ctx.beginPath();
  ctx.rect(hx - 3, hy + 7, 6, 5);
  ctx.fillStyle = '#d9a47c';
  ctx.fill();
  ellipse(ctx, hx, hy, 10, 10.5);
  paint(ctx, rad(ctx, hx + 3, hy - 3, 1, 12, [[0, '#ffdcbc'], [0.7, SKIN], [1, '#d9a47c']]));
  // orelha
  ellipse(ctx, hx - 3, hy + 1, 2.5, 3.2);
  paint(ctx, '#e8b08a', OUT, 1.2);
  // cabelo
  ctx.beginPath();
  ctx.moveTo(hx - 11, hy + 4);
  ctx.quadraticCurveTo(hx - 13, hy - 10, hx - 2, hy - 12);
  ctx.quadraticCurveTo(hx + 8, hy - 14, hx + 11, hy - 4);
  ctx.lineTo(hx + 6, hy - 6);
  ctx.lineTo(hx + 3, hy - 3);
  ctx.lineTo(hx - 1, hy - 6);
  ctx.quadraticCurveTo(hx - 5, hy - 2, hx - 6, hy + 4);
  ctx.lineTo(hx - 9, hy + 8);
  ctx.closePath();
  paint(ctx, lin(ctx, hx - 10, hy - 12, hx + 10, hy + 4, [[0, HAIR[2]], [0.5, HAIR[1]], [1, HAIR[0]]]));
  // faixa de tecido na testa
  limb(ctx, [[hx - 9, hy - 5], [hx + 9, hy - 7]], 2.5, '#d9622b', false);
  // rosto
  const blink = p.blink;
  ctx.fillStyle = OUT;
  if (blink) ctx.fillRect(hx + 5, hy, 3, 1.2);
  else {
    ellipse(ctx, hx + 6, hy, 1.4, 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(hx + 6, hy - 1.5, 1, 1);
  }
  ctx.fillStyle = 'rgba(230,120,110,0.45)';
  ellipse(ctx, hx + 6, hy + 4, 2.2, 1.4);
  ctx.fill();
  ctx.strokeStyle = '#8a4a3a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(hx + 5, hy + 6);
  ctx.lineTo(hx + 8, hy + 6 + (p.mouth ?? 0));
  ctx.stroke();

  // braço da frente (mão que segura a espada)
  const fh = p.armF ?? [10, -36];
  const sx = shoulder[0] + 4;
  const sy = shoulder[1] + 2;
  const ex = (sx + fh[0]) / 2 + (p.elbow?.[0] ?? -1);
  const ey = (sy + fh[1] + b) / 2 + (p.elbow?.[1] ?? 3);
  limb(ctx, [[sx, sy], [ex, ey]], 6, TUNIC[0]);
  limb(ctx, [[ex, ey], [fh[0], fh[1] + b]], 5, SKIN);
  ellipse(ctx, fh[0], fh[1] + b, 3.6, 3.6);
  paint(ctx, '#8a5a32', OUT, 1.5);

  ctx.restore();
}

function boot(ctx, [x, y], shinA, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-shinA * 0.5);
  ctx.beginPath();
  ctx.roundRect(-4, -3, 11, 6, 2.5);
  paint(ctx, color, OUT, 1.5);
  ctx.restore();
}

function hero(scene) {
  const frames = {};
  for (let i = 0; i < 4; i++) {
    const br = Math.sin((i / 4) * TAU);
    frames[`idle${i}`] = { legF: [0.05, 0.02], legB: [-0.06, -0.04], bob: br > 0 ? 1 : 0, cape: 0.15 + br * 0.15, blink: i === 3 };
  }
  for (let i = 0; i < 6; i++) {
    const ph = (i / 6) * TAU;
    const leg = (q) => {
      const th = 0.62 * Math.sin(q);
      return [th, th - (0.15 + 0.95 * Math.max(0, Math.cos(q)))];
    };
    const swing = Math.sin(ph);
    frames[`run${i}`] = {
      legF: leg(ph),
      legB: leg(ph + Math.PI),
      bob: -Math.round(Math.abs(Math.cos(ph)) * 2),
      lean: 1.5,
      cape: 0.8 + Math.abs(swing) * 0.3,
      armF: [10 + swing * 3, -36],
      armB: [-7 - swing * 4, -34],
    };
  }
  // corrida golpeando: mesmas pernas da corrida, braço da espada erguido
  for (let i = 0; i < 6; i++) {
    frames[`atkrun${i}`] = { ...frames[`run${i}`], lean: 3, armF: [15, -46], elbow: [2, 2], mouth: 1, cape: 1 };
  }
  frames.jump = { legF: [0.9, -0.2], legB: [-0.1, -1.0], bob: 0, cape: 1.2, armF: [12, -44], armB: [-11, -44], mouth: 1 };
  frames.fall = { legF: [0.3, 0.1], legB: [-0.25, -0.1], bob: 0, cape: -0.6, armF: [12, -40], armB: [-12, -46] };
  frames.attack = { legF: [0.6, 0.15], legB: [-0.55, -0.25], bob: 2, lean: 3, cape: 0.9, armF: [15, -46], armB: [-10, -38], mouth: 1, elbow: [2, 2] };
  frames.hurt = { legF: [0.2, -0.3], legB: [-0.4, -0.5], bob: 1, lean: -3, cape: 0.5, armF: [4, -50], armB: [-14, -48], blink: true, mouth: 2 };

  const names = Object.keys(frames);
  sheet(scene, 'hero', HERO_W, HERO_H, names, (ctx, name) => drawHero(ctx, frames[name]));

  canvasTex(scene, 'hero-dead', 84, 34, (ctx) => {
    ctx.save();
    ctx.translate(42, 30);
    ctx.beginPath();
    ctx.moveTo(-8, -8);
    ctx.quadraticCurveTo(10, -16, 26, -6);
    ctx.lineTo(18, 2);
    ctx.lineTo(-10, 2);
    ctx.closePath();
    paint(ctx, lin(ctx, 0, -16, 0, 2, [[0, CAPE[0]], [1, CAPE[2]]]));
    ctx.beginPath();
    ctx.roundRect(-14, -10, 24, 11, 3);
    paint(ctx, lin(ctx, 0, -10, 0, 2, [[0, TUNIC[0]], [1, TUNIC[2]]]));
    limb(ctx, [[8, -4], [22, -2], [32, -4]], 7, PANTS);
    ellipse(ctx, -22, -5, 9.5, 9);
    paint(ctx, rad(ctx, -20, -8, 1, 11, [[0, '#ffdcbc'], [1, '#d9a47c']]));
    ctx.beginPath();
    ctx.moveTo(-31, -2);
    ctx.quadraticCurveTo(-34, -14, -22, -15);
    ctx.quadraticCurveTo(-18, -12, -16, -14);
    ctx.lineTo(-24, -4);
    ctx.closePath();
    paint(ctx, HAIR[1]);
    ctx.fillStyle = OUT;
    ctx.fillRect(-21, -6, 3, 1.2);
    ctx.restore();
  });

  // espada (separada, gira com tween; origem no cabo)
  canvasTex(scene, 'sword', 64, 16, (ctx) => {
    ctx.beginPath();
    ctx.roundRect(1, 6, 13, 4, 2);
    paint(ctx, '#6e4420', OUT, 1.2);
    ctx.strokeStyle = '#a5733f';
    ctx.lineWidth = 1;
    for (let x = 3; x < 13; x += 3) {
      ctx.beginPath();
      ctx.moveTo(x, 6);
      ctx.lineTo(x + 2, 10);
      ctx.stroke();
    }
    ellipse(ctx, 2, 8, 2.5, 2.5);
    paint(ctx, '#e8b84a', OUT, 1);
    ctx.beginPath();
    ctx.roundRect(13, 1, 5, 14, 2);
    paint(ctx, lin(ctx, 13, 0, 18, 0, [[0, '#c88a2a'], [0.5, '#ffd978'], [1, '#c88a2a']]), OUT, 1.2);
    ctx.beginPath();
    ctx.moveTo(18, 4.5);
    ctx.lineTo(54, 4.5);
    ctx.lineTo(63, 8);
    ctx.lineTo(54, 11.5);
    ctx.lineTo(18, 11.5);
    ctx.closePath();
    paint(ctx, lin(ctx, 0, 4, 0, 12, [[0, '#ffffff'], [0.45, '#dfe6ee'], [0.55, '#aab6c3'], [1, '#7f8c99']]), OUT, 1.3);
    ctx.strokeStyle = 'rgba(120,135,150,0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 8);
    ctx.lineTo(50, 8);
    ctx.stroke();
  });
}

// ------------------------------------------------------------------ dinossauros

function stripes(ctx, pts, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (const [x, y, len] of pts) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - 2, y + len * 0.5, x + 1, y + len);
    ctx.stroke();
  }
}

function eye(ctx, x, y, r, iris = '#ffd23f') {
  ellipse(ctx, x, y, r, r * 0.85);
  paint(ctx, iris, OUT, 1.2);
  ctx.fillStyle = OUT;
  ellipse(ctx, x + r * 0.2, y, r * 0.35, r * 0.7);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, x - r * 0.25, y - r * 0.3, r * 0.25, r * 0.25);
  ctx.fill();
}

function drawRaptor(ctx, f) {
  const { ph = 0, windup = false } = f;
  const sway = Math.sin(ph) * 2;
  const bob = windup ? 3 : -Math.abs(Math.cos(ph)) * 1.5;
  const body = ['#7cc35a', '#4f9a3a', '#2f6b2a'];
  const legA = (q) => [0.55 * Math.sin(q), 0.55 * Math.sin(q) - 0.6 - 0.5 * Math.max(0, Math.cos(q))];

  // perna de trás
  const lb = legA(ph + Math.PI);
  const backLeg = legPoints(40, 32 + bob, lb[0], lb[1], 11, 12);
  limb(ctx, backLeg.slice(0, 2), 8, '#3f7f30');
  limb(ctx, backLeg.slice(1), 4.5, '#3f7f30');
  limb(ctx, [backLeg[2], [backLeg[2][0] + 7, backLeg[2][1] + 1]], 3.5, '#3f7f30');

  // cauda
  ctx.beginPath();
  ctx.moveTo(36, 24 + bob);
  ctx.bezierCurveTo(22, 20 + bob, 10, 16 + sway, 2, 18 + sway);
  ctx.bezierCurveTo(10, 24 + sway, 22, 32 + bob, 38, 36 + bob);
  ctx.closePath();
  paint(ctx, lin(ctx, 0, 14, 0, 36, [[0, body[0]], [1, body[2]]]));

  // tronco
  ellipse(ctx, 44, 30 + bob, 17, 10.5, -0.15);
  paint(ctx, lin(ctx, 0, 19 + bob, 0, 41 + bob, [[0, body[0]], [0.5, body[1]], [1, body[2]]]));
  ellipse(ctx, 46, 35 + bob, 11, 4.5, -0.1);
  ctx.fillStyle = '#d7ea9e';
  ctx.fill();
  stripes(ctx, [[36, 21 + bob, 7], [42, 20 + bob, 8], [48, 21 + bob, 7]], 'rgba(40,85,30,0.85)');

  // pescoço e cabeça
  const hy = windup ? 21 : 12 + bob;
  const hx = windup ? 60 : 62;
  limb(ctx, [[54, 26 + bob], [hx, hy + 6]], 9, body[1]);
  ctx.save();
  ctx.translate(hx, hy);
  // mandíbula
  ctx.save();
  ctx.rotate(windup ? 0.45 : 0.05);
  ctx.beginPath();
  ctx.moveTo(-2, 4);
  ctx.lineTo(18, 5);
  ctx.quadraticCurveTo(19, 9, 14, 9);
  ctx.lineTo(0, 9);
  ctx.closePath();
  paint(ctx, '#3f8a30');
  if (windup) {
    ctx.fillStyle = '#ffffff';
    for (let x = 4; x < 17; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x, 5);
      ctx.lineTo(x + 1.5, 2);
      ctx.lineTo(x + 3, 5);
      ctx.fill();
    }
  }
  ctx.restore();
  if (windup) {
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(18, 4);
    ctx.lineTo(16, 10);
    ctx.lineTo(0, 9);
    ctx.fillStyle = '#9e2a35';
    ctx.fill();
  }
  // crânio
  ctx.save();
  ctx.rotate(windup ? -0.2 : 0);
  ctx.beginPath();
  ctx.moveTo(-4, 6);
  ctx.quadraticCurveTo(-4, -6, 8, -6);
  ctx.quadraticCurveTo(18, -6, 22, 2);
  ctx.quadraticCurveTo(22, 5, 18, 5);
  ctx.lineTo(-2, 6);
  ctx.closePath();
  paint(ctx, lin(ctx, 0, -6, 0, 6, [[0, body[0]], [1, body[1]]]));
  ctx.fillStyle = '#ffffff';
  for (let x = 6; x < 19; x += 4) {
    ctx.beginPath();
    ctx.moveTo(x, 5);
    ctx.lineTo(x + 1.5, 8);
    ctx.lineTo(x + 3, 5);
    ctx.fill();
  }
  eye(ctx, 8, -1, 2.8);
  // crista
  ctx.strokeStyle = '#c8452b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-1, -4);
  ctx.lineTo(4, -9);
  ctx.lineTo(7, -6);
  ctx.lineTo(11, -10);
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  // braço com garras
  limb(ctx, [[53, 31 + bob], [57, 36 + bob], [61, 35 + bob]], 3.5, '#3f7f30');

  // perna da frente
  const lf = legA(ph);
  const frontLeg = legPoints(46, 33 + bob, lf[0], lf[1], 11, 12);
  limb(ctx, frontLeg.slice(0, 2), 9, body[1]);
  limb(ctx, frontLeg.slice(1), 5, body[1]);
  limb(ctx, [frontLeg[2], [frontLeg[2][0] + 8, frontLeg[2][1] + 1]], 4, body[2]);
}

function drawTrike(ctx, f) {
  const { ph = 0, windup = false } = f;
  const bob = windup ? 4 : -Math.abs(Math.cos(ph)) * 1.5;
  const body = ['#e8a55e', '#c27b3a', '#8a5226'];
  const legs = [[30, 0.5], [74, 0], [44, Math.PI], [86, Math.PI + 0.5]];

  const drawLeg = ([x, off], color, front) => {
    const q = ph + off;
    const a = windup ? (front ? -0.25 : 0.3) : 0.3 * Math.sin(q);
    const pts = legPoints(x, 46 + bob, a, a * 0.4, 12, 13);
    limb(ctx, pts, front ? 14 : 12, color);
    ellipse(ctx, pts[2][0] + 2, pts[2][1] - 1, 7, 3.5);
    paint(ctx, '#f3e3c3', OUT, 1.2);
  };
  drawLeg(legs[2], '#9a6230', false);
  drawLeg(legs[3], '#9a6230', false);

  // cauda
  ctx.beginPath();
  ctx.moveTo(26, 34 + bob);
  ctx.quadraticCurveTo(10, 36 + bob, 2, 44 + Math.sin(ph) * 2);
  ctx.quadraticCurveTo(14, 48 + bob, 30, 50 + bob);
  ctx.closePath();
  paint(ctx, lin(ctx, 0, 30, 0, 50, [[0, body[0]], [1, body[2]]]));

  // tronco
  ellipse(ctx, 58, 42 + bob, 38, 21);
  paint(ctx, lin(ctx, 0, 21 + bob, 0, 63 + bob, [[0, body[0]], [0.5, body[1]], [1, body[2]]]));
  ellipse(ctx, 62, 54 + bob, 26, 6);
  ctx.fillStyle = '#f2cf98';
  ctx.fill();
  // placas nas costas
  for (let i = 0; i < 6; i++) {
    ellipse(ctx, 32 + i * 10, 25 + bob + Math.abs(i - 2.5) * 1.2, 4, 3);
    paint(ctx, '#a8682e', OUT, 1);
  }

  drawLeg(legs[0], body[1], true);
  drawLeg(legs[1], body[1], true);

  // cabeça com folho
  const hd = windup ? 9 : 0;
  ctx.save();
  ctx.translate(96, 36 + hd + bob);
  ctx.rotate(windup ? 0.15 : 0);
  // folho
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI * 0.55 + (i / 12) * Math.PI * 1.05;
    const r = i % 2 ? 22 : 26;
    ctx.lineTo(Math.cos(a) * r - 6, Math.sin(a) * r - 4);
  }
  ctx.lineTo(0, 6);
  ctx.closePath();
  paint(ctx, rad(ctx, -6, -4, 4, 26, [[0, '#f6c27a'], [0.7, '#e09a50'], [1, '#b56a2c']]));
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * 0.75 + (i / 4) * Math.PI * 0.7;
    ellipse(ctx, Math.cos(a) * 16 - 6, Math.sin(a) * 16 - 4, 3, 3);
    ctx.fillStyle = '#7a3e1a';
    ctx.fill();
  }
  // rosto e bico
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.quadraticCurveTo(12, -10, 24, 4);
  ctx.lineTo(27, 12);
  ctx.quadraticCurveTo(16, 18, 0, 12);
  ctx.closePath();
  paint(ctx, lin(ctx, 0, -8, 0, 16, [[0, body[0]], [1, body[1]]]));
  ctx.beginPath();
  ctx.moveTo(20, 6);
  ctx.lineTo(28, 10);
  ctx.lineTo(20, 14);
  ctx.closePath();
  paint(ctx, '#6e4020', OUT, 1);
  // chifres
  const horn = (x, y, tx, ty, w) => {
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo((x + tx) / 2, (y + ty) / 2 - 3, tx, ty);
    ctx.quadraticCurveTo((x + tx) / 2 + 2, (y + ty) / 2 + 2, x + w, y);
    ctx.closePath();
    paint(ctx, lin(ctx, x, y, tx, ty, [[0, '#e8dcc0'], [1, '#fffaf0']]), OUT, 1.3);
  };
  horn(6, -4, 28, -14, 3);
  horn(18, 2, 26, -4, 2);
  eye(ctx, 6, 2, 2.6, '#ffe08a');
  ctx.restore();

  if (windup) {
    for (const [x, y, r] of [[8, 66, 5], [16, 68, 4], [2, 69, 3]]) {
      ctx.fillStyle = 'rgba(235,220,190,0.8)';
      ellipse(ctx, x, y, r, r * 0.7);
      ctx.fill();
    }
  }
}

function drawRex(ctx, f) {
  const { ph = 0, windup = false } = f;
  const bob = windup ? 6 : -Math.abs(Math.cos(ph)) * 2.5;
  const body = ['#a372c0', '#7c4a98', '#4a2860'];
  const legA = (q) => [0.42 * Math.sin(q), 0.42 * Math.sin(q) - 0.35 - 0.35 * Math.max(0, Math.cos(q))];

  // perna de trás
  const lb = legA(ph + Math.PI);
  const bl = legPoints(84, 86 + bob, lb[0], lb[1], 26, 26);
  limb(ctx, bl.slice(0, 2), 24, '#5e3478');
  limb(ctx, bl.slice(1), 13, '#5e3478');
  limb(ctx, [bl[2], [bl[2][0] + 18, bl[2][1] + 1]], 9, '#5e3478');

  // cauda
  ctx.beginPath();
  ctx.moveTo(70, 56 + bob);
  ctx.bezierCurveTo(44, 54 + bob, 20, 52 + Math.sin(ph) * 4, 2, 62 + Math.sin(ph) * 4);
  ctx.bezierCurveTo(22, 70 + bob, 46, 86 + bob, 76, 90 + bob);
  ctx.closePath();
  paint(ctx, lin(ctx, 0, 50, 0, 92, [[0, body[0]], [1, body[2]]]), OUT, 2.5);

  // tronco
  ellipse(ctx, 98, 74 + bob, 46, 32, -0.25);
  paint(ctx, lin(ctx, 0, 42 + bob, 0, 106 + bob, [[0, body[0]], [0.5, body[1]], [1, body[2]]]), OUT, 2.5);
  ellipse(ctx, 108, 88 + bob, 28, 14, -0.3);
  ctx.fillStyle = '#dcc0ea';
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,110,170,0.6)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(108, 76 + bob + i * 5, 26 - i * 3, 4, -0.3, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  stripes(ctx, [[70, 50 + bob, 12], [82, 46 + bob, 14], [94, 44 + bob, 14], [106, 46 + bob, 12]], 'rgba(50,20,70,0.7)');
  // espinhos nas costas
  for (let i = 0; i < 6; i++) {
    const x = 56 + i * 13;
    const y = 50 - Math.sin((i / 5) * Math.PI) * 8 + bob;
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 4);
    ctx.lineTo(x + 1, y - 8);
    ctx.lineTo(x + 6, y + 4);
    ctx.closePath();
    paint(ctx, '#e0583f', OUT, 1.5);
  }

  // braço curto
  limb(ctx, [[128, 80 + bob], [136, 88 + bob], [142, 86 + bob]], 6, '#6a3c86');

  // pescoço e cabeça
  const hy = (windup ? 34 : 22) + bob;
  limb(ctx, [[120, 62 + bob], [134, hy + 18]], 26, body[1]);
  ctx.save();
  ctx.translate(128, hy);
  // mandíbula
  ctx.save();
  ctx.translate(4, 22);
  ctx.rotate(windup ? 0.5 : 0.04);
  ctx.beginPath();
  ctx.moveTo(-4, -4);
  ctx.lineTo(50, -2);
  ctx.quadraticCurveTo(54, 6, 46, 8);
  ctx.lineTo(0, 10);
  ctx.closePath();
  paint(ctx, lin(ctx, 0, -4, 0, 10, [[0, body[1]], [1, body[2]]]), OUT, 2);
  ctx.fillStyle = '#fff8ea';
  for (let x = 8; x < 48; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, -2);
    ctx.lineTo(x + 2.5, -8);
    ctx.lineTo(x + 5, -2);
    ctx.fill();
  }
  ctx.restore();
  if (windup) {
    ctx.beginPath();
    ctx.moveTo(4, 18);
    ctx.lineTo(56, 20);
    ctx.lineTo(42, 42);
    ctx.lineTo(4, 30);
    ctx.closePath();
    ctx.fillStyle = '#8a1f30';
    ctx.fill();
  }
  // crânio
  ctx.save();
  ctx.rotate(windup ? -0.18 : 0);
  ctx.beginPath();
  ctx.moveTo(-4, 22);
  ctx.quadraticCurveTo(-6, -2, 14, -4);
  ctx.quadraticCurveTo(40, -6, 58, 8);
  ctx.quadraticCurveTo(62, 18, 56, 22);
  ctx.closePath();
  paint(ctx, lin(ctx, 0, -6, 0, 24, [[0, body[0]], [1, body[1]]]), OUT, 2.5);
  ctx.fillStyle = '#fff8ea';
  for (let x = 12; x < 56; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, 22);
    ctx.lineTo(x + 2.5, 28);
    ctx.lineTo(x + 5, 22);
    ctx.fill();
  }
  // sobrancelha óssea e olho
  ctx.beginPath();
  ctx.moveTo(10, 2);
  ctx.quadraticCurveTo(22, -6, 30, 2);
  ctx.lineTo(24, 4);
  ctx.closePath();
  paint(ctx, body[2], OUT, 1.2);
  eye(ctx, 22, 8, 4.5, '#ffb13b');
  ctx.fillStyle = OUT;
  ellipse(ctx, 52, 10, 1.6, 1.2);
  ctx.fill();
  // cicatriz
  ctx.strokeStyle = 'rgba(240,200,220,0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(34, 2);
  ctx.lineTo(42, 14);
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  // perna da frente
  const lf = legA(ph);
  const fl = legPoints(100, 90 + bob, lf[0], lf[1], 26, 26);
  limb(ctx, fl.slice(0, 2), 26, body[1]);
  limb(ctx, fl.slice(1), 14, body[1]);
  limb(ctx, [fl[2], [fl[2][0] + 20, fl[2][1] + 1]], 10, body[2]);
  ctx.fillStyle = '#fff8ea';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(fl[2][0] + 18 + i * 3, fl[2][1] - 3);
    ctx.lineTo(fl[2][0] + 26 + i * 2, fl[2][1] + 2);
    ctx.lineTo(fl[2][0] + 18 + i * 3, fl[2][1] + 4);
    ctx.fill();
  }
}

export const DINO_FRAMES = {
  raptor: { w: 84, h: 56, draw: drawRaptor },
  trike: { w: 124, h: 74, draw: drawTrike },
  rex: { w: 190, h: 142, draw: drawRex },
};

function dinos(scene) {
  for (const [type, { w, h, draw }] of Object.entries(DINO_FRAMES)) {
    const names = ['walk0', 'walk1', 'walk2', 'walk3', 'windup'];
    sheet(scene, type, w, h, names, (ctx, name, i) =>
      draw(ctx, name === 'windup' ? { windup: true } : { ph: (i / 4) * TAU }),
    );
  }
}

// ------------------------------------------------------------------ API

export function buildTextures(scene) {
  sky(scene);
  cloud(scene, 'cloud', 4, 260, 120);
  cloud(scene, 'cloud2', 8, 200, 96);
  mountains(scene);
  hills(scene);
  forestBand(scene);
  bigTree(scene);
  bush(scene);
  ground(scene);
  ledge(scene);
  fence(scene);
  castle(scene);
  items(scene);
  hero(scene);
  dinos(scene);
}

export function buildAnimations(scene) {
  const a = scene.anims;
  const f = (key, names) => names.map((frame) => ({ key, frame }));
  a.create({ key: 'hero-idle', frames: f('hero', ['idle0', 'idle1', 'idle2', 'idle3']), frameRate: 4, repeat: -1 });
  a.create({ key: 'hero-run', frames: f('hero', ['run0', 'run1', 'run2', 'run3', 'run4', 'run5']), frameRate: 14, repeat: -1 });
  a.create({ key: 'hero-run-attack', frames: f('hero', ['atkrun0', 'atkrun1', 'atkrun2', 'atkrun3', 'atkrun4', 'atkrun5']), frameRate: 14, repeat: -1 });
  const rate = { raptor: 11, trike: 7, rex: 5 };
  for (const t of Object.keys(DINO_FRAMES)) {
    a.create({ key: `${t}-walk`, frames: f(t, ['walk0', 'walk1', 'walk2', 'walk3']), frameRate: rate[t], repeat: -1 });
  }
}
