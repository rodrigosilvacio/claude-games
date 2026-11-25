// Arte da Fase 3: Picos de Cristal (neve ao amanhecer), novos monstros, Serpente de Cristal,
// Castelo Dourado e a princesa do final.
// Mesma direção de arte das outras fases (contorno #2a1d24, luz de um lado, perspectiva
// atmosférica). Aqui o sol nasce baixo, quente e rosado; as sombras na neve são azul-lilás.
// Os monstros são fofos (olhos grandes, formas redondas): é a fase final de um jogo infantil.

import {
  OUT,
  TAU,
  rng,
  canvasTex,
  sheet,
  lin,
  rad,
  paint,
  limb,
  legPoints,
  ellipse,
  wrapX,
  conifer,
  eye,
  peak,
  drawCastle,
  drawRaptor,
} from './textures.js';

export const CASTLE_GOLD = {
  stone: ['#fbf4e2', '#e6d6b2', '#bca984'],
  merlon: '#f0e4c8',
  roof: ['#b8861a', '#e8b830', '#ffe07a'],
  roofLine: 'rgba(120,80,10,0.45)',
  flag: ['#f07aa8', '#ffb0d0'],
  banner: ['#7a3a9a', '#a85ac8'],
  emblem: '#ffe07a',
  window: ['#fff6c8', '#ffb040'],
  ivy: ['rgba(120,170,190,0.7)', 'rgba(170,210,230,0.7)'], // gelo em vez de hera
};

const SNOW = ['#ffffff', '#eef3fc', '#d6e0f4'];
const SHADE = '#a9b4dc';

// ------------------------------------------------------------------ cenário

function snowyPine(ctx, x, base, h, cols) {
  conifer(ctx, x, base, h, cols[0], cols[1], cols[2]);
  for (let i = 0; i < 4; i++) {
    const t = i / 4;
    const w = h * (0.32 - t * 0.06) * 0.8;
    const y = base - h * 0.12 - t * h * 0.24;
    const top = y - h * 0.36;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.55, y - h * 0.11);
    ctx.quadraticCurveTo(x - w * 0.2, top + h * 0.12, x, top + 2);
    ctx.quadraticCurveTo(x + w * 0.25, top + h * 0.12, x + w * 0.6, y - h * 0.1);
    ctx.quadraticCurveTo(x, y - h * 0.16, x - w * 0.55, y - h * 0.11);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fill();
  }
}

function sky(scene) {
  canvasTex(scene, 'sky3', 960, 540, (ctx) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, 540, [
      [0, '#5a6fc8'],
      [0.32, '#9a8ad0'],
      [0.58, '#e8a0b8'],
      [0.78, '#ffc49a'],
      [1, '#ffe6c0'],
    ]);
    ctx.fillRect(0, 0, 960, 540);
    ctx.fillStyle = rad(ctx, 640, 380, 0, 360, [[0, 'rgba(255,240,200,0.85)'], [0.2, 'rgba(255,210,170,0.45)'], [1, 'rgba(255,200,170,0)']]);
    ctx.fillRect(0, 0, 960, 540);
    ellipse(ctx, 640, 380, 62, 62);
    ctx.fillStyle = rad(ctx, 640, 380, 10, 62, [[0, '#fffbe8'], [1, '#ffd8a0']]);
    ctx.fill();
    // fiapos de nuvem rosa
    const r = rng(33);
    for (let i = 0; i < 9; i++) {
      const x = r() * 960;
      const y = 60 + r() * 200;
      const w = 80 + r() * 160;
      ctx.fillStyle = `rgba(255,${190 + Math.floor(r() * 40)},${200 + Math.floor(r() * 30)},0.45)`;
      ellipse(ctx, x, y, w, 7 + r() * 6);
      ctx.fill();
    }
  });
}

function layers(scene) {
  const W = 1024;
  canvasTex(scene, 'far3', W, 300, (ctx) => {
    [[90, 40, 240], [360, 70, 220], [620, 30, 260], [890, 60, 230]].forEach(([x, top, half], i) =>
      wrapX(W, x, (xx) => peak(ctx, xx, top, half, 290, [[0, '#d0c8f0'], [1, '#a898d8']], 'rgba(110,90,170,0.3)', 0.55, 40 + i)),
    );
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = lin(ctx, 0, 120, 0, 300, [[0, 'rgba(255,200,200,0)'], [1, 'rgba(255,205,200,0.6)']]);
    ctx.fillRect(0, 0, W, 300);
    ctx.globalCompositeOperation = 'source-over';
  });
  canvasTex(scene, 'mid3', W, 220, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(0, 220);
    for (let x = 0; x <= W; x += 8) {
      const t = (x / W) * TAU;
      ctx.lineTo(x, 90 + Math.sin(t * 2 + 0.6) * 22 + Math.sin(t * 3) * 10);
    }
    ctx.lineTo(W, 220);
    ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, 60, 0, 220, [[0, '#f6f2ff'], [1, '#c4bce8']]);
    ctx.fill();
    const r = rng(9);
    for (let i = 0; i < 40; i++) {
      const x = r() * W;
      const t = (x / W) * TAU;
      const y = 100 + Math.sin(t * 2 + 0.6) * 22 + Math.sin(t * 3) * 10 + r() * 50;
      const h = 30 + r() * 30;
      wrapX(W, x, (xx) => snowyPine(ctx, xx, y, h, ['#6a7aa8', '#7a8ab8', '#9aa8cc']));
    }
  });
  canvasTex(scene, 'forest3', W, 260, (ctx) => {
    const r = rng(17);
    for (let x = 0; x < W; x += 44 + r() * 30) {
      const h = 140 + r() * 100;
      wrapX(W, x, (xx) => snowyPine(ctx, xx, 248, h, ['#1f4a5a', '#2a6070', '#4a8aa0']));
    }
    ctx.fillStyle = lin(ctx, 0, 225, 0, 260, [[0, 'rgba(235,240,255,0)'], [1, '#e8eefc']]);
    ctx.fillRect(0, 220, W, 40);
  });
  canvasTex(scene, 'tree3', 200, 300, (ctx) => {
    ctx.fillStyle = '#5a4030';
    ctx.fillRect(92, 250, 16, 50);
    snowyPine(ctx, 100, 290, 300, ['#1a4250', '#245a6a', '#4a8aa0']);
  });
  canvasTex(scene, 'crystals', 120, 64, (ctx) => {
    const r = rng(2);
    ctx.fillStyle = rad(ctx, 60, 50, 0, 60, [[0, 'rgba(150,230,255,0.45)'], [1, 'rgba(150,230,255,0)']]);
    ctx.fillRect(0, 0, 120, 64);
    for (let i = 0; i < 7; i++) {
      const x = 22 + i * 12 + r() * 6;
      const h = 18 + r() * 34;
      const w = 5 + r() * 4;
      const tilt = (r() - 0.5) * 10;
      ctx.beginPath();
      ctx.moveTo(x - w, 62);
      ctx.lineTo(x - w * 0.8 + tilt * 0.6, 62 - h * 0.8);
      ctx.lineTo(x + tilt, 62 - h);
      ctx.lineTo(x + w * 0.8 + tilt * 0.6, 62 - h * 0.8);
      ctx.lineTo(x + w, 62);
      ctx.closePath();
      paint(ctx, lin(ctx, x - w, 0, x + w, 0, [[0, i % 2 ? '#8ad8ff' : '#c0a8ff'], [0.5, '#ffffff'], [1, i % 2 ? '#4aa8e8' : '#8a70e0']]), OUT, 1.3);
    }
    ctx.fillStyle = SNOW[1];
    ellipse(ctx, 60, 62, 52, 6);
    ctx.fill();
  });
  canvasTex(scene, 'mist3', W, 160, (ctx) => {
    const r = rng(19);
    for (let i = 0; i < 34; i++) {
      const x = r() * W;
      const y = 50 + r() * 80;
      const rr = 40 + r() * 70;
      wrapX(W, x, (xx) => {
        ctx.fillStyle = rad(ctx, xx, y, 0, rr, [[0, 'rgba(255,255,255,0.22)'], [1, 'rgba(255,255,255,0)']]);
        ctx.fillRect(xx - rr, y - rr, rr * 2, rr * 2);
      });
    }
  });
}

function ground(scene) {
  const W = 128;
  canvasTex(scene, 'ground3', W, 96, (ctx) => {
    ctx.fillStyle = lin(ctx, 0, 14, 0, 96, [[0, '#d4dcf2'], [0.5, '#a4b0d4'], [1, '#7a84aa']]);
    ctx.fillRect(0, 0, W, 96);
    const r = rng(6);
    for (let i = 0; i < 10; i++) {
      const x = r() * W;
      const y = 34 + r() * 56;
      const rx = 4 + r() * 6;
      wrapX(W, x, (xx) => {
        ellipse(ctx, xx, y, rx, rx * 0.6);
        ctx.fillStyle = '#8a94bc';
        ctx.fill();
        ellipse(ctx, xx - rx * 0.2, y - rx * 0.2, rx * 0.5, rx * 0.25);
        ctx.fillStyle = '#e8eeff';
        ctx.fill();
      });
    }
    // neve do topo com bolotas
    ctx.fillStyle = lin(ctx, 0, 0, 0, 22, [[0, '#ffffff'], [1, '#e2e8f8']]);
    ctx.fillRect(0, 0, W, 16);
    for (let x = 0; x < W; x += 16) {
      ellipse(ctx, x + 8, 16, 9, 5 + ((x * 7) % 4));
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(150,160,210,0.45)';
    for (let x = 0; x < W; x += 16) {
      ctx.beginPath();
      ctx.ellipse(x + 8, 18, 9, 4, 0, 0, Math.PI);
      ctx.fill();
    }
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.6 + r() * 0.4})`;
      const x = r() * W;
      const y = 2 + r() * 10;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  });
  canvasTex(scene, 'snowpit', W, 90, (ctx) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, 90, [[0, '#ffffff'], [0.4, '#e8eefc'], [1, '#b8c2e4']]);
    for (let x = 0; x < W; x += 22) {
      ellipse(ctx, x + 11, 22 + ((x * 5) % 8), 18, 14);
      ctx.fill();
    }
    ctx.fillRect(0, 26, W, 64);
  });
  canvasTex(scene, 'ledge3', W, 34, (ctx) => {
    ctx.fillStyle = lin(ctx, 0, 6, 0, 34, [[0, '#e0f4ff'], [0.5, '#a8d8f4'], [1, '#6aa8d8']]);
    ctx.fillRect(0, 6, W, 28);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    for (const x of [14, 50, 92]) {
      ctx.beginPath();
      ctx.moveTo(x, 12);
      ctx.lineTo(x + 10, 28);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(60,110,170,0.5)';
    ctx.lineWidth = 1;
    for (const x of [36, 76, 116]) {
      ctx.beginPath();
      ctx.moveTo(x, 8);
      ctx.lineTo(x - 2, 34);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, 7);
    for (let x = 4; x < W; x += 12) {
      ellipse(ctx, x + 4, 7, 6, 3 + ((x * 3) % 3));
      ctx.fill();
    }
  });
  canvasTex(scene, 'iceplat', 110, 28, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(2, 6);
    ctx.lineTo(108, 6);
    ctx.lineTo(100, 24);
    ctx.lineTo(10, 24);
    ctx.closePath();
    paint(ctx, lin(ctx, 0, 6, 0, 24, [[0, '#e8f8ff'], [0.5, '#9ad8f8'], [1, '#5aa0e0']]), OUT, 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.5;
    for (const x of [24, 54, 84]) {
      ctx.beginPath();
      ctx.moveTo(x, 9);
      ctx.lineTo(x + 8, 21);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(2, 1, 106, 7, 3);
    ctx.fill();
  });
}

function goldCastle(scene) {
  canvasTex(scene, 'castle3', 520, 440, (ctx) => {
    drawCastle(ctx, CASTLE_GOLD);
    // neve nos telhados e na base
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (const [x, w] of [[40, 440]]) {
      ctx.fillRect(x, 432, w, 8);
    }
  });
  canvasTex(scene, 'castleFar3', 520, 440, (ctx) => {
    drawCastle(ctx, CASTLE_GOLD);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(255,190,190,0.45)';
    ctx.fillRect(0, 0, 520, 440);
    ctx.globalCompositeOperation = 'source-over';
  });
  // porta aberta (sobreposta ao portão na cena final)
  canvasTex(scene, 'gateOpen', 80, 120, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(4, 120);
    ctx.lineTo(4, 40);
    ctx.arc(40, 40, 36, Math.PI, 0);
    ctx.lineTo(76, 120);
    ctx.closePath();
    ctx.fillStyle = rad(ctx, 40, 90, 4, 70, [[0, '#fff3c0'], [0.5, '#ffc860'], [1, '#c87820']]);
    ctx.fill();
  });
}

// ------------------------------------------------------------------ itens

function items(scene) {
  sheet(scene, 'chest', 56, 46, ['closed', 'open'], (ctx, name) => {
    const open = name === 'open';
    if (open) {
      ctx.fillStyle = rad(ctx, 28, 20, 0, 30, [[0, 'rgba(255,240,160,0.9)'], [1, 'rgba(255,240,160,0)']]);
      ctx.fillRect(0, 0, 56, 46);
    }
    ctx.beginPath();
    ctx.roundRect(6, 22, 44, 22, 3);
    paint(ctx, lin(ctx, 0, 22, 0, 44, [[0, '#a5733f'], [1, '#6e4420']]));
    ctx.beginPath();
    if (open) ctx.roundRect(6, 4, 44, 10, 4);
    else ctx.roundRect(6, 12, 44, 13, 6);
    paint(ctx, lin(ctx, 0, 4, 0, 25, [[0, '#c08848'], [1, '#8a5a2a']]));
    ctx.fillStyle = '#e8b84a';
    ctx.fillRect(25, open ? 22 : 20, 6, 8);
    ctx.fillRect(6, 30, 44, 3);
  });
  canvasTex(scene, 'shield', 28, 34, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(2, 4);
    ctx.quadraticCurveTo(14, 0, 26, 4);
    ctx.lineTo(26, 16);
    ctx.quadraticCurveTo(24, 28, 14, 33);
    ctx.quadraticCurveTo(4, 28, 2, 16);
    ctx.closePath();
    paint(ctx, lin(ctx, 0, 0, 28, 34, [[0, '#5a9ae8'], [1, '#2a5aa8']]), OUT, 2);
    ctx.strokeStyle = '#ffd978';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(5, 6);
    ctx.quadraticCurveTo(14, 3, 23, 6);
    ctx.lineTo(23, 16);
    ctx.quadraticCurveTo(21, 26, 14, 30);
    ctx.quadraticCurveTo(7, 26, 5, 16);
    ctx.closePath();
    ctx.stroke();
    // estrela
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? 3 : 7;
      ctx.lineTo(14 + Math.cos(a) * rr, 16 + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffe07a';
    ctx.fill();
  });
  canvasTex(scene, 'berry', 30, 32, (ctx) => {
    // frutinhas silvestres (mesmo efeito da maçã: +1 vida)
    for (const [x, y, c] of [[10, 18, '#d8344a'], [20, 18, '#c02a40'], [15, 24, '#e84a5a'], [15, 13, '#d03048']]) {
      ellipse(ctx, x, y, 6.5, 6.5);
      paint(ctx, rad(ctx, x - 2, y - 2, 0.5, 7, [[0, '#ff9aa8'], [0.5, c], [1, '#8a1828']]), OUT, 1.2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ellipse(ctx, x - 2, y - 2, 1.6, 1.2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(15, 8);
    ctx.quadraticCurveTo(22, 0, 28, 4);
    ctx.quadraticCurveTo(22, 9, 15, 8);
    paint(ctx, '#4f9a3c', OUT, 1);
  });
  canvasTex(scene, 'snowball', 22, 22, (ctx) => {
    ellipse(ctx, 11, 11, 9, 9);
    paint(ctx, rad(ctx, 8, 8, 1, 11, [[0, '#ffffff'], [1, '#c8d4f0']]), OUT, 1.5);
  });
  canvasTex(scene, 'icicle', 16, 40, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(2, 2);
    ctx.lineTo(14, 2);
    ctx.lineTo(8, 39);
    ctx.closePath();
    paint(ctx, lin(ctx, 2, 0, 14, 0, [[0, '#9ad8f8'], [0.5, '#ffffff'], [1, '#6ab0e8']]), OUT, 1.4);
  });
  canvasTex(scene, 'shard', 22, 38, (ctx) => {
    ctx.save();
    ctx.shadowColor = '#9af0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(11, 2);
    ctx.lineTo(19, 14);
    ctx.lineTo(11, 36);
    ctx.lineTo(3, 14);
    ctx.closePath();
    ctx.fillStyle = lin(ctx, 3, 0, 19, 0, [[0, '#7ad0ff'], [0.5, '#ffffff'], [1, '#a090ff']]);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });
  canvasTex(scene, 'icehole', 150, 36, (ctx) => {
    ellipse(ctx, 75, 20, 70, 14);
    paint(ctx, lin(ctx, 0, 6, 0, 34, [[0, '#e0f0ff'], [1, '#8ab8e0']]), OUT, 2);
    ellipse(ctx, 75, 21, 54, 9);
    ctx.fillStyle = lin(ctx, 0, 12, 0, 30, [[0, '#1a2a50'], [1, '#3a5a90']]);
    ctx.fill();
  });
  canvasTex(scene, 'confetti', 8, 5, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 8, 5);
  });
}

// ------------------------------------------------------------------ monstros

function furBlob(ctx, cx, cy, rx, ry, fill) {
  ctx.beginPath();
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const r = 1 + (i % 2 ? 0.08 : -0.02);
    const px = cx + Math.cos(a) * rx * r;
    const py = cy + Math.sin(a) * ry * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  paint(ctx, fill, OUT, 2);
}

function drawYeti(ctx, { pose = 'idle', bob = 0 }) {
  const fur = lin(ctx, 0, 20, 0, 74, [[0, '#ffffff'], [1, '#c8d0ea']]);
  // pernas
  for (const x of [26, 44]) {
    ctx.beginPath();
    ctx.roundRect(x - 6, 60, 12, 14, 5);
    paint(ctx, '#dfe4f4', OUT, 1.6);
  }
  // braço de trás
  if (pose === 'windup') limb(ctx, [[24, 36 + bob], [22, 14], [30, 6]], 9, '#e8ecf8');
  // corpo
  furBlob(ctx, 35, 44 + bob, 24, 24, fur);
  // rosto
  ellipse(ctx, 42, 38 + bob, 13, 11);
  paint(ctx, lin(ctx, 0, 28, 0, 50, [[0, '#b8c4e4'], [1, '#98a6d0']]), OUT, 1.4);
  eye(ctx, 38, 36 + bob, 3.4, '#ffffff');
  eye(ctx, 47, 36 + bob, 3.4, '#ffffff');
  ctx.fillStyle = '#6a5a8a';
  ellipse(ctx, 43, 42 + bob, 2.6, 1.6);
  ctx.fill();
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(43, 43 + bob, 4, 0.2, Math.PI - 0.2);
  ctx.stroke();
  // chifrinhos
  for (const x of [28, 46]) {
    ctx.beginPath();
    ctx.moveTo(x - 3, 24 + bob);
    ctx.quadraticCurveTo(x - 2, 14 + bob, x + 3, 13 + bob);
    ctx.lineTo(x + 3, 24 + bob);
    paint(ctx, '#e8d8b8', OUT, 1.2);
  }
  // braço da frente / bola de neve
  if (pose === 'windup') {
    limb(ctx, [[46, 36 + bob], [48, 14], [40, 6]], 9, '#ffffff');
    ellipse(ctx, 35, 4, 9, 8);
    paint(ctx, rad(ctx, 32, 2, 1, 10, [[0, '#ffffff'], [1, '#c8d4f0']]), OUT, 1.5);
  } else if (pose === 'throw' || pose === 'slap') {
    limb(ctx, [[48, 40 + bob], [60, 36], [68, 34]], 9, '#ffffff');
  } else {
    limb(ctx, [[48, 42 + bob], [54, 52 + bob], [52, 58 + bob]], 9, '#ffffff');
  }
}

function drawPenguin(ctx, { pose = 'walk', step = 0 }) {
  if (pose === 'slide') {
    // de barriga, deslizando
    ellipse(ctx, 28, 38, 25, 11);
    paint(ctx, lin(ctx, 0, 26, 0, 50, [[0, '#3a4a7a'], [1, '#1e2848']]));
    ellipse(ctx, 30, 43, 18, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ellipse(ctx, 48, 34, 9, 8);
    paint(ctx, '#2a3a68', OUT, 1.6);
    eye(ctx, 50, 32, 2.6, '#ffffff');
    ctx.beginPath();
    ctx.moveTo(56, 34);
    ctx.lineTo(64, 36);
    ctx.lineTo(56, 38);
    paint(ctx, '#ffa030', OUT, 1);
    for (const [x, y] of [[6, 46], [10, 48]]) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ellipse(ctx, x, y, 4, 2);
      ctx.fill();
    }
    return;
  }
  const squash = pose === 'crouch' ? 6 : 0;
  // pés
  for (const [x, dy] of [[22, step], [34, -step]]) {
    ellipse(ctx, x, 49 + dy * 0.5, 6, 3);
    paint(ctx, '#ffa030', OUT, 1.2);
  }
  // corpo
  ellipse(ctx, 28, 31 + squash / 2, 16, 18 - squash / 2);
  paint(ctx, lin(ctx, 0, 12, 0, 50, [[0, '#4a5a8a'], [1, '#1e2848']]));
  ellipse(ctx, 31, 35 + squash / 2, 11, 13 - squash / 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  // cachecol
  limb(ctx, [[16, 22 + squash], [40, 22 + squash]], 5, '#e84a5a', false);
  limb(ctx, [[18, 22 + squash], [14, 32 + squash]], 4, '#e84a5a', false);
  // asinhas
  limb(ctx, [[15, 30 + squash], [10, 40 + squash]], 5, '#2a3a68');
  // olhos e bico
  if (pose === 'dizzy') {
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 1.5;
    for (const x of [26, 35]) {
      ctx.beginPath();
      ctx.arc(x, 16 + squash, 2.6, 0, TAU * 0.8);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffe07a';
    for (const [x, y] of [[14, 2], [28, 0], [42, 3]]) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 ? 1.6 : 4;
        ctx.lineTo(x + Math.cos(a) * rr, y + 4 + Math.sin(a) * rr);
      }
      ctx.fill();
    }
  } else {
    eye(ctx, 26, 17 + squash, 2.8, '#ffffff');
    eye(ctx, 35, 17 + squash, 2.8, '#ffffff');
  }
  ctx.beginPath();
  ctx.moveTo(36, 21 + squash);
  ctx.lineTo(46, 23 + squash);
  ctx.lineTo(36, 26 + squash);
  ctx.closePath();
  paint(ctx, '#ffa030', OUT, 1.2);
}

function drawPtero(ctx, { flap = 0, warn = false }) {
  const cx = 48;
  const cy = 28;
  const wing = (side, front) => {
    const tipY = cy - 16 + flap * 26;
    ctx.beginPath();
    ctx.moveTo(cx + side * 4, cy - 2);
    ctx.lineTo(cx + side * 26, tipY - 4);
    ctx.lineTo(cx + side * 46, tipY + 4);
    ctx.quadraticCurveTo(cx + side * 30, tipY + 10, cx + side * 12, cy + 8);
    ctx.closePath();
    paint(ctx, lin(ctx, cx, cy - 20, cx, cy + 20, [[0, front ? '#c8e8ff' : '#9ac4e8'], [1, front ? '#7ab0e0' : '#5a8ac0']]), OUT, 1.6);
  };
  wing(-1, false);
  // corpo
  ellipse(ctx, cx, cy + 2, 13, 8);
  paint(ctx, lin(ctx, 0, cy - 8, 0, cy + 10, [[0, '#a8d0f0'], [1, '#5a8ac0']]));
  // cabeça e bico
  ctx.save();
  ctx.translate(cx + 12, cy - 4);
  ctx.rotate(warn ? 0.6 : 0);
  ctx.beginPath();
  ctx.moveTo(-4, 4);
  ctx.quadraticCurveTo(0, -8, 10, -6);
  ctx.lineTo(30, 2);
  ctx.lineTo(8, 6);
  ctx.closePath();
  paint(ctx, lin(ctx, 0, -8, 0, 6, [[0, '#d8f0ff'], [1, '#8ab8e0']]));
  // crista
  ctx.beginPath();
  ctx.moveTo(4, -6);
  ctx.lineTo(-12, -14);
  ctx.lineTo(2, -2);
  paint(ctx, '#e88ab0', OUT, 1.2);
  eye(ctx, 8, -2, 2.6, '#ffffff');
  ctx.restore();
  wing(1, true);
}

function drawSerpent(ctx, { pose = 'up', sway = 0 }) {
  const body = (pts, w) => {
    // corpo de cristal: contorno grosso, preenchimento claro, facetas
    limb(ctx, pts, w, '#8ad0f8');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0] + 6, pts[0][1]);
    for (const p of pts.slice(1)) ctx.lineTo(p[0] + 6, p[1] - 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = w * 0.35;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pts[0][0] - 8, pts[0][1]);
    for (const p of pts.slice(1)) ctx.lineTo(p[0] - 8, p[1] + 2);
    ctx.strokeStyle = 'rgba(70,90,190,0.45)';
    ctx.lineWidth = w * 0.3;
    ctx.stroke();
  };
  const spikes = (pts, side) => {
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i];
      const [px, py] = pts[i - 1];
      const dx = x - px;
      const dy = y - py;
      const d = Math.hypot(dx, dy) || 1;
      const nx = (-dy / d) * side;
      const ny = (dx / d) * side;
      ctx.beginPath();
      ctx.moveTo(x - dx / d * 8 + nx * 16, y - dy / d * 8 + ny * 16);
      ctx.lineTo(x + nx * 38, y + ny * 38);
      ctx.lineTo(x + dx / d * 8 + nx * 16, y + dy / d * 8 + ny * 16);
      ctx.closePath();
      ctx.save();
      ctx.shadowColor = '#b0f0ff';
      ctx.shadowBlur = 10;
      paint(ctx, lin(ctx, x, y, x + nx * 38, y + ny * 38, [[0, '#a890ff'], [1, '#e8f8ff']]), OUT, 1.6);
      ctx.restore();
    }
  };
  const head = (x, y, rot, open, dizzy) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    // mandíbula
    ctx.save();
    ctx.translate(-4, 10);
    ctx.rotate(open ? 0.5 : 0.05);
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(44, 0);
    ctx.quadraticCurveTo(46, 8, 38, 9);
    ctx.lineTo(2, 10);
    ctx.closePath();
    paint(ctx, lin(ctx, 0, -3, 0, 10, [[0, '#7ab8f0'], [1, '#4a70c0']]));
    ctx.restore();
    if (open) {
      ctx.save();
      ctx.shadowColor = '#c0f8ff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(48, 12);
      ctx.lineTo(34, 32);
      ctx.lineTo(0, 22);
      ctx.closePath();
      ctx.fillStyle = rad(ctx, 18, 18, 2, 30, [[0, '#ffffff'], [0.5, '#bff4ff'], [1, '#6ab0f0']]);
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.moveTo(-10, 12);
    ctx.quadraticCurveTo(-12, -10, 10, -12);
    ctx.quadraticCurveTo(38, -12, 54, 4);
    ctx.quadraticCurveTo(56, 12, 48, 12);
    ctx.closePath();
    paint(ctx, lin(ctx, 0, -12, 0, 14, [[0, '#d8f4ff'], [0.6, '#8ad0f8'], [1, '#5a90d8']]), OUT, 2.5);
    // coroa de cristais
    for (const [cx, h, a] of [[-4, 26, -0.6], [6, 32, -0.3], [16, 24, -0.1]]) {
      ctx.save();
      ctx.translate(cx, -10);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(0, -h);
      ctx.lineTo(5, 0);
      ctx.closePath();
      ctx.shadowColor = '#d0b0ff';
      ctx.shadowBlur = open ? 16 : 8;
      paint(ctx, lin(ctx, 0, -h, 0, 0, [[0, '#ffffff'], [1, '#b090ff']]), OUT, 1.4);
      ctx.restore();
    }
    if (dizzy) {
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(20, -1, 4, 0, TAU * 0.8);
      ctx.stroke();
    } else {
      ctx.save();
      ctx.shadowColor = '#c080ff';
      ctx.shadowBlur = 10;
      eye(ctx, 20, -1, 5, '#d8a0ff');
      ctx.restore();
    }
    ctx.restore();
  };

  if (pose === 'lunge' || pose === 'stuck') {
    const pts = [[18, 196], [70, 186], [130, 190], [190, 182]];
    body(pts, 40);
    spikes(pts, -1);
    head(196, pose === 'stuck' ? 176 : 164, pose === 'stuck' ? 0.5 : 0.05, pose === 'lunge', pose === 'stuck');
    if (pose === 'stuck') {
      // a cabeça fica presa num bloco de gelo
      ctx.beginPath();
      ctx.moveTo(206, 210);
      ctx.lineTo(214, 170);
      ctx.lineTo(246, 160);
      ctx.lineTo(258, 210);
      ctx.closePath();
      paint(ctx, 'rgba(200,236,255,0.85)', OUT, 2);
      ctx.fillStyle = '#ffe07a';
      for (const [x, y] of [[190, 130], [214, 122], [236, 132]]) {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          const rr = i % 2 ? 2.4 : 6;
          ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        }
        ctx.fill();
      }
    }
    return;
  }
  const raise = pose === 'cast' ? -16 : 0;
  const pts = [[130, 212], [118 + sway, 160], [150 + sway, 110], [128 + sway, 70 + raise]];
  body(pts, 46);
  spikes(pts, -1);
  head(122 + sway, 52 + raise, pose === 'cast' ? -0.35 : 0.1, pose === 'cast', false);
}

function drawPrincess(ctx, { step = 0, wave = false }) {
  const x = 32;
  // vestido em sino
  const sway = step * 2;
  ctx.beginPath();
  ctx.moveTo(x - 8, 52);
  ctx.quadraticCurveTo(x - 22 - sway, 80, x - 24 - sway, 96);
  ctx.quadraticCurveTo(x, 100, x + 24 - sway, 96);
  ctx.quadraticCurveTo(x + 22 - sway, 80, x + 8, 52);
  ctx.closePath();
  paint(ctx, lin(ctx, x - 24, 50, x + 24, 98, [[0, '#f7b8e0'], [0.5, '#e07ac0'], [1, '#b04a9a']]));
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 20 - sway, 88);
  ctx.quadraticCurveTo(x, 92, x + 20 - sway, 88);
  ctx.stroke();
  // corpete e faixa dourada
  ctx.beginPath();
  ctx.roundRect(x - 9, 36, 18, 18, 5);
  paint(ctx, lin(ctx, 0, 36, 0, 54, [[0, '#f7b8e0'], [1, '#d870b8']]));
  ctx.fillStyle = '#ffd978';
  ctx.fillRect(x - 9, 50, 18, 4);
  // braços
  limb(ctx, [[x - 8, 40], [x - 13, 50], [x - 10, 58]], 5, '#f2c29b');
  if (wave) limb(ctx, [[x + 8, 40], [x + 16, 30], [x + 18, 18]], 5, '#f2c29b');
  else limb(ctx, [[x + 8, 40], [x + 13, 50], [x + 10, 58]], 5, '#f2c29b');
  // cabelo atrás
  ctx.beginPath();
  ctx.moveTo(x - 12, 18);
  ctx.quadraticCurveTo(x - 16, 44, x - 10, 52);
  ctx.lineTo(x + 10, 52);
  ctx.quadraticCurveTo(x + 16, 44, x + 12, 18);
  ctx.closePath();
  paint(ctx, lin(ctx, 0, 10, 0, 52, [[0, '#d8a050'], [1, '#a86a28']]));
  // rosto
  ellipse(ctx, x, 22, 10, 11);
  paint(ctx, rad(ctx, x + 3, 19, 1, 12, [[0, '#ffe2c8'], [0.7, '#f2c29b'], [1, '#dca07c']]));
  ctx.fillStyle = OUT;
  ellipse(ctx, x - 4, 22, 1.4, 2);
  ctx.fill();
  ellipse(ctx, x + 4, 22, 1.4, 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(240,120,140,0.5)';
  ellipse(ctx, x - 6, 26, 2.2, 1.4);
  ctx.fill();
  ellipse(ctx, x + 6, 26, 2.2, 1.4);
  ctx.fill();
  ctx.strokeStyle = '#a04a4a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, 26, 3, 0.2, Math.PI - 0.2);
  ctx.stroke();
  // franja
  ctx.beginPath();
  ctx.moveTo(x - 11, 20);
  ctx.quadraticCurveTo(x - 10, 8, x, 9);
  ctx.quadraticCurveTo(x + 10, 8, x + 11, 20);
  ctx.quadraticCurveTo(x + 4, 13, x, 16);
  ctx.quadraticCurveTo(x - 4, 13, x - 11, 20);
  paint(ctx, lin(ctx, 0, 8, 0, 20, [[0, '#e8b060'], [1, '#b87a30']]), OUT, 1.4);
  // coroa
  ctx.beginPath();
  ctx.moveTo(x - 8, 9);
  ctx.lineTo(x - 8, 1);
  ctx.lineTo(x - 4, 5);
  ctx.lineTo(x, -1);
  ctx.lineTo(x + 4, 5);
  ctx.lineTo(x + 8, 1);
  ctx.lineTo(x + 8, 9);
  ctx.closePath();
  paint(ctx, lin(ctx, 0, -1, 0, 9, [[0, '#fff0a0'], [1, '#e0a020']]), OUT, 1.2);
  ctx.fillStyle = '#e84a8a';
  ellipse(ctx, x, 5, 1.8, 1.8);
  ctx.fill();
}

// ------------------------------------------------------------------ API

export function buildIceTextures(scene) {
  sky(scene);
  layers(scene);
  ground(scene);
  goldCastle(scene);
  items(scene);
  sheet(scene, 'yeti', 70, 76, ['idle0', 'idle1', 'windup', 'throw', 'slap'], (ctx, name) =>
    drawYeti(ctx, { pose: name.startsWith('idle') ? 'idle' : name, bob: name === 'idle1' ? 1.5 : 0 }),
  );
  sheet(scene, 'penguin', 66, 52, ['walk0', 'walk1', 'crouch', 'slide', 'dizzy'], (ctx, name) =>
    drawPenguin(ctx, name.startsWith('walk') ? { step: name === 'walk0' ? 2 : -2 } : { pose: name }),
  );
  sheet(scene, 'ptero', 96, 60, ['fly0', 'fly1', 'fly2', 'fly3', 'warn'], (ctx, name, i) =>
    drawPtero(ctx, name === 'warn' ? { flap: 0.3, warn: true } : { flap: [0, 0.5, 1, 0.5][i] }),
  );
  const ICE_RAPTOR = {
    body: ['#e8f0fc', '#b8c8ec', '#7a8cc0'],
    limb: '#8a9ad0',
    belly: '#ffffff',
    jaw: '#a8b8e0',
    stripe: 'rgba(90,110,180,0.8)',
    crest: '#7ad0ff',
  };
  sheet(scene, 'raptorSnow', 84, 56, ['walk0', 'walk1', 'walk2', 'walk3', 'windup'], (ctx, name, i) => {
    drawRaptor(ctx, name === 'windup' ? { windup: true } : { ph: (i / 4) * TAU }, ICE_RAPTOR);
    // cachecol vermelho
    limb(ctx, [[52, 24], [58, 22]], 6, '#e84a5a', false);
    limb(ctx, [[54, 25], [48, 34]], 4, '#e84a5a', false);
  });
  sheet(scene, 'serpent', 260, 214, ['up0', 'up1', 'cast', 'lunge', 'stuck'], (ctx, name) =>
    drawSerpent(ctx, name.startsWith('up') ? { pose: 'up', sway: name === 'up1' ? 6 : -4 } : { pose: name }),
  );
  sheet(scene, 'princess', 64, 100, ['walk0', 'walk1', 'walk2', 'walk3', 'idle', 'wave'], (ctx, name, i) =>
    drawPrincess(ctx, name.startsWith('walk') ? { step: [1, 0, -1, 0][i] } : { wave: name === 'wave' }),
  );
}

export function buildIceAnimations(scene) {
  const a = scene.anims;
  const f = (key, names) => names.map((frame) => ({ key, frame }));
  a.create({ key: 'yeti-idle', frames: f('yeti', ['idle0', 'idle1']), frameRate: 3, repeat: -1 });
  a.create({ key: 'penguin-walk', frames: f('penguin', ['walk0', 'walk1']), frameRate: 6, repeat: -1 });
  a.create({ key: 'ptero-fly', frames: f('ptero', ['fly0', 'fly1', 'fly2', 'fly3']), frameRate: 10, repeat: -1 });
  a.create({ key: 'raptorSnow-walk', frames: f('raptorSnow', ['walk0', 'walk1', 'walk2', 'walk3']), frameRate: 11, repeat: -1 });
  a.create({ key: 'serpent-idle', frames: f('serpent', ['up0', 'up1']), frameRate: 2.5, repeat: -1 });
  a.create({ key: 'princess-walk', frames: f('princess', ['walk0', 'walk1', 'walk2', 'walk3']), frameRate: 7, repeat: -1 });
  a.create({ key: 'princess-wave', frames: f('princess', ['idle', 'wave']), frameRate: 3, repeat: -1 });
}
