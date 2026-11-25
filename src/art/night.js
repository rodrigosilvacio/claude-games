// Arte da Fase 2: Floresta Sombria (anoitecer, lua, névoa, cogumelos que brilham),
// novos monstros, o Colosso de Magma e o Castelo Azul.
// Mesma direção de arte da Fase 1 (contorno #2a1d24, luz de um lado, perspectiva
// atmosférica); aqui a luz principal é a lua, à direita, fria e azulada, e o brilho
// quente vem só do magma do chefe e dos olhos dos monstros. Isso faz o perigo
// saltar da tela escura.

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
  drawCastle,
} from './textures.js';

export const CASTLE_BLUE = {
  stone: ['#c9d6ea', '#9fb3d4', '#6f84aa'],
  merlon: '#b5c5df',
  roof: ['#1f4f8a', '#2f74c0', '#5aa0e0'],
  roofLine: 'rgba(15,35,80,0.5)',
  flag: ['#d8e4f4', '#ffffff'],
  banner: ['#1f4f8a', '#2f74c0'],
  emblem: '#e8f0ff',
  window: ['#fff2b0', '#f0b040'],
  ivy: ['rgba(60,120,110,0.85)', 'rgba(30,80,80,0.85)'],
};

// ------------------------------------------------------------------ cenário noturno

function nightSky(scene) {
  canvasTex(scene, 'sky2', 960, 540, (ctx) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, 540, [
      [0, '#121a3e'],
      [0.4, '#2a3270'],
      [0.7, '#5a4f8a'],
      [0.88, '#8a6a92'],
      [1, '#a07a92'],
    ]);
    ctx.fillRect(0, 0, 960, 540);
    const r = rng(101);
    for (let i = 0; i < 140; i++) {
      const x = r() * 960;
      const y = r() * 300;
      const s = r() * 1.4 + 0.3;
      ctx.fillStyle = `rgba(255,255,240,${0.3 + r() * 0.7})`;
      ellipse(ctx, x, y, s, s);
      ctx.fill();
    }
    // lua
    ctx.fillStyle = rad(ctx, 760, 110, 0, 260, [
      [0, 'rgba(220,230,255,0.55)'],
      [0.25, 'rgba(180,200,255,0.18)'],
      [1, 'rgba(180,200,255,0)'],
    ]);
    ctx.fillRect(0, 0, 960, 540);
    ellipse(ctx, 760, 110, 44, 44);
    ctx.fillStyle = rad(ctx, 748, 98, 4, 50, [[0, '#ffffff'], [0.7, '#e8eefc'], [1, '#c8d2ec']]);
    ctx.fill();
    for (const [x, y, rr] of [[748, 96, 7], [774, 120, 9], [770, 92, 4], [744, 126, 5]]) {
      ellipse(ctx, x, y, rr, rr);
      ctx.fillStyle = 'rgba(160,172,205,0.45)';
      ctx.fill();
    }
  });
}

function treeline(ctx, W, base, hMin, hMax, step, colors, seed) {
  const r = rng(seed);
  for (let x = 0; x < W; x += step * (0.6 + r() * 0.8)) {
    const h = hMin + r() * (hMax - hMin);
    wrapX(W, x, (xx) => conifer(ctx, xx, base, h, colors[0], colors[1], colors[2]));
  }
}

function nightLayers(scene) {
  const W = 1024;
  canvasTex(scene, 'far2', W, 300, (ctx) => {
    treeline(ctx, W, 300, 160, 250, 34, ['#3c4a7a', '#45568a', '#56689c'], 3);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = lin(ctx, 0, 60, 0, 300, [[0, 'rgba(150,140,190,0.15)'], [1, 'rgba(170,150,190,0.7)']]);
    ctx.fillRect(0, 0, W, 300);
    ctx.globalCompositeOperation = 'source-over';
  });
  canvasTex(scene, 'mid2', W, 220, (ctx) => {
    treeline(ctx, W, 220, 120, 200, 30, ['#24305a', '#2c3a68', '#41538a'], 4);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = lin(ctx, 0, 40, 0, 220, [[0, 'rgba(120,120,170,0.05)'], [1, 'rgba(140,130,180,0.55)']]);
    ctx.fillRect(0, 0, W, 220);
    ctx.globalCompositeOperation = 'source-over';
  });
  canvasTex(scene, 'forest2', W, 260, (ctx) => {
    const r = rng(77);
    for (let x = 0; x < W; x += 40 + r() * 30) {
      const h = 150 + r() * 100;
      wrapX(W, x, (xx) => conifer(ctx, xx, 252, h, '#0f2228', '#16323a', '#2e5a68'));
    }
    // cogumelos que brilham no pé das árvores
    for (let i = 0; i < 26; i++) {
      const x = r() * W;
      const c = r() > 0.5 ? '120,230,255' : '200,140,255';
      wrapX(W, x, (xx) => {
        ctx.fillStyle = rad(ctx, xx, 240, 0, 14, [[0, `rgba(${c},0.7)`], [1, `rgba(${c},0)`]]);
        ctx.fillRect(xx - 14, 226, 28, 28);
        ctx.fillStyle = `rgb(${c})`;
        ellipse(ctx, xx, 240, 3, 2);
        ctx.fill();
      });
    }
    ctx.fillStyle = lin(ctx, 0, 215, 0, 260, [[0, 'rgba(10,20,25,0)'], [1, '#0c1a1e']]);
    ctx.fillRect(0, 215, W, 45);
  });
  canvasTex(scene, 'mist', W, 160, (ctx) => {
    const r = rng(12);
    for (let i = 0; i < 40; i++) {
      const x = r() * W;
      const y = 40 + r() * 90;
      const rr = 40 + r() * 70;
      wrapX(W, x, (xx) => {
        ctx.fillStyle = rad(ctx, xx, y, 0, rr, [[0, 'rgba(200,210,240,0.16)'], [1, 'rgba(200,210,240,0)']]);
        ctx.fillRect(xx - rr, y - rr, rr * 2, rr * 2);
      });
    }
  });
}

function nightTree(scene) {
  canvasTex(scene, 'tree2', 220, 320, (ctx) => {
    // tronco retorcido
    ctx.beginPath();
    ctx.moveTo(84, 320);
    ctx.bezierCurveTo(100, 260, 80, 210, 98, 150);
    ctx.lineTo(124, 150);
    ctx.bezierCurveTo(112, 210, 136, 260, 136, 320);
    ctx.quadraticCurveTo(160, 312, 172, 320);
    ctx.lineTo(52, 320);
    ctx.quadraticCurveTo(68, 312, 84, 320);
    paint(ctx, lin(ctx, 84, 0, 136, 0, [[0, '#1e1a22'], [0.65, '#3a3440'], [1, '#5a6a8a']]));
    // galhos
    limb(ctx, [[104, 180], [70, 150], [44, 150]], 7, '#2a2630');
    limb(ctx, [[118, 170], [150, 140], [176, 142]], 7, '#2a2630');
    // copa escura com borda iluminada pela lua (direita)
    const blobs = [[110, 110, 72], [60, 125, 50], [160, 120, 52], [86, 66, 52], [138, 66, 50], [112, 34, 40]];
    ctx.beginPath();
    for (const [x, y, rr] of blobs) {
      ctx.moveTo(x + rr, y);
      ctx.arc(x, y, rr, 0, TAU);
    }
    ctx.fillStyle = '#0f2424';
    ctx.fill();
    for (const [x, y, rr] of blobs) {
      ctx.fillStyle = '#183836';
      ellipse(ctx, x - rr * 0.1, y + rr * 0.05, rr * 0.8, rr * 0.72);
      ctx.fill();
    }
    for (const [x, y, rr] of blobs) {
      ctx.fillStyle = 'rgba(110,160,190,0.55)';
      ellipse(ctx, x + rr * 0.5, y - rr * 0.3, rr * 0.32, rr * 0.22);
      ctx.fill();
    }
    // musgo pendurado
    const r = rng(5);
    for (let i = 0; i < 14; i++) {
      const x = 40 + r() * 150;
      const y = 120 + r() * 40;
      const len = 20 + r() * 40;
      ctx.strokeStyle = 'rgba(90,140,110,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 4, y + len * 0.5, x - 2, y + len);
      ctx.stroke();
    }
  });

  canvasTex(scene, 'shrooms', 120, 64, (ctx) => {
    const caps = [[30, 50, 12, '120,230,255'], [52, 40, 16, '200,140,255'], [78, 48, 11, '120,230,255'], [94, 54, 8, '200,140,255']];
    for (const [x, y, r, c] of caps) {
      ctx.fillStyle = rad(ctx, x, y, 0, r * 3, [[0, `rgba(${c},0.45)`], [1, `rgba(${c},0)`]]);
      ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
    }
    for (const [x, y, r, c] of caps) {
      ctx.beginPath();
      ctx.rect(x - r * 0.22, y, r * 0.44, 64 - y);
      paint(ctx, '#d8d0e8', OUT, 1.2);
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.65, 0, Math.PI, 0);
      ctx.closePath();
      paint(ctx, rad(ctx, x - r * 0.3, y - r * 0.4, 1, r * 1.2, [[0, '#ffffff'], [0.4, `rgb(${c})`], [1, `rgba(${c},0.8)`]]), OUT, 1.5);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (const dx of [-0.4, 0.1, 0.5]) {
        ellipse(ctx, x + dx * r, y - r * 0.35, 1.6, 1.2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#16322a';
    ctx.fillRect(10, 58, 100, 6);
  });
}

function nightGround(scene) {
  const W = 128;
  canvasTex(scene, 'ground2', W, 96, (ctx) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, 96, [[0, '#4a3830'], [0.5, '#302420'], [1, '#1a1412']]);
    ctx.fillRect(0, 0, W, 96);
    const r = rng(8);
    for (let i = 0; i < 8; i++) {
      const x = r() * W;
      const y = 34 + r() * 56;
      const rx = 4 + r() * 6;
      wrapX(W, x, (xx) => {
        ellipse(ctx, xx, y, rx, rx * 0.7);
        ctx.fillStyle = '#2a201c';
        ctx.fill();
        ellipse(ctx, xx + rx * 0.25, y - rx * 0.2, rx * 0.5, rx * 0.3);
        ctx.fillStyle = '#6a6a84';
        ctx.fill();
      });
    }
    ctx.fillStyle = lin(ctx, 0, 14, 0, 30, [[0, 'rgba(0,0,0,0.55)'], [1, 'rgba(0,0,0,0)']]);
    ctx.fillRect(0, 14, W, 16);
    ctx.fillStyle = lin(ctx, 0, 0, 0, 18, [[0, '#3f7a6a'], [1, '#1d3a30']]);
    ctx.fillRect(0, 0, W, 16);
    for (let x = 0; x < W; x += 4) {
      const h = 5 + ((x * 7) % 9);
      ctx.beginPath();
      ctx.moveTo(x, 14);
      ctx.quadraticCurveTo(x + 2, 14 + h * 0.4, x + 3, 14 + h);
      ctx.lineTo(x + 5, 14);
      ctx.fillStyle = '#1d3a30';
      ctx.fill();
    }
    for (let i = 0; i < 40; i++) {
      const x = r() * W;
      const h = 4 + r() * 7;
      wrapX(W, x, (xx) => {
        ctx.strokeStyle = r() > 0.4 ? '#7ab0b8' : '#2f5a4a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(xx, 6);
        ctx.quadraticCurveTo(xx + 1, 3, xx + 2 * (r() - 0.5), 6 - h);
        ctx.stroke();
      });
    }
    ctx.fillStyle = 'rgba(190,210,255,0.3)';
    ctx.fillRect(0, 0, W, 2);
  });

  // tronco caído com musgo (plataforma)
  canvasTex(scene, 'ledge2', W, 34, (ctx) => {
    ctx.fillStyle = lin(ctx, 0, 4, 0, 34, [[0, '#6a5240'], [0.5, '#4a3628'], [1, '#2a1e16']]);
    ctx.fillRect(0, 4, W, 30);
    ctx.strokeStyle = 'rgba(20,12,8,0.6)';
    ctx.lineWidth = 1.5;
    for (const y of [14, 22, 29]) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= W; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.2 + y) * 1.5);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(180,200,255,0.25)';
    ctx.fillRect(0, 6, W, 2);
    ctx.fillStyle = lin(ctx, 0, 0, 0, 9, [[0, '#6aa88a'], [1, '#2f5a44']]);
    ctx.fillRect(0, 0, W, 7);
    for (let x = 3; x < W; x += 10) {
      ctx.beginPath();
      ctx.ellipse(x + 3, 7, 4, 3 + ((x * 13) % 4), 0, 0, Math.PI);
      ctx.fillStyle = '#2f5a44';
      ctx.fill();
    }
  });
}

function blueCastle(scene) {
  canvasTex(scene, 'castle2', 520, 440, (ctx) => drawCastle(ctx, CASTLE_BLUE));
  canvasTex(scene, 'castleFar2', 520, 440, (ctx) => {
    drawCastle(ctx, CASTLE_BLUE);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(70,70,130,0.6)';
    ctx.fillRect(0, 0, 520, 440);
    ctx.globalCompositeOperation = 'source-over';
  });
}

// ------------------------------------------------------------------ monstros

function drawBat(ctx, { flap = 0, swoop = false }) {
  const cx = 36;
  const cy = 24;
  const wing = (side) => {
    const tipY = swoop ? cy - 4 : cy - 18 + flap * 22;
    const tipX = cx + side * (swoop ? 22 : 34);
    ctx.beginPath();
    ctx.moveTo(cx + side * 6, cy - 4);
    ctx.lineTo(cx + side * 18, tipY - 6);
    ctx.lineTo(tipX, tipY);
    ctx.quadraticCurveTo(cx + side * 26, tipY + 8, cx + side * 22, tipY + 12);
    ctx.quadraticCurveTo(cx + side * 16, tipY + 6, cx + side * 14, tipY + 14);
    ctx.quadraticCurveTo(cx + side * 10, cy + 2, cx + side * 6, cy + 4);
    ctx.closePath();
    paint(ctx, lin(ctx, cx, cy - 20, cx, cy + 20, [[0, '#6a4a8a'], [1, '#2a1a3a']]), OUT, 1.6);
    ctx.strokeStyle = 'rgba(20,10,30,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + side * 18, tipY - 6);
    ctx.lineTo(cx + side * 22, tipY + 12);
    ctx.stroke();
  };
  wing(-1);
  wing(1);
  // corpo
  ellipse(ctx, cx, cy + 2, 11, 10);
  paint(ctx, rad(ctx, cx + 3, cy - 2, 1, 13, [[0, '#7a5a9a'], [1, '#2e1e40']]));
  // orelhas
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * 3, cy - 6);
    ctx.lineTo(cx + s * 8, cy - 16);
    ctx.lineTo(cx + s * 9, cy - 4);
    ctx.closePath();
    paint(ctx, '#4a3266', OUT, 1.2);
  }
  // olhos vermelhos que brilham e presas
  ctx.save();
  ctx.shadowColor = '#ff3a3a';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ff5a4a';
  ellipse(ctx, cx - 4, cy, 2.4, 2);
  ctx.fill();
  ellipse(ctx, cx + 5, cy, 2.4, 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * 2, cy + 6);
    ctx.lineTo(cx + s * 3.5, cy + 10);
    ctx.lineTo(cx + s * 5, cy + 6);
    ctx.fill();
  }
}

function drawPlant(ctx, { sway = 0, pose = 'idle' }) {
  const base = 82;
  // folhas
  for (const [s, len] of [[-1, 26], [1, 24], [-1, 16]]) {
    ctx.beginPath();
    ctx.moveTo(36, base - 2);
    ctx.quadraticCurveTo(36 + s * len * 0.7, base - 22, 36 + s * len, base - 8);
    ctx.quadraticCurveTo(36 + s * len * 0.5, base - 4, 36, base - 2);
    paint(ctx, lin(ctx, 36, base - 24, 36 + s * len, base, [[0, '#5fae58'], [1, '#2a6a32']]), OUT, 1.4);
  }
  // caule
  const hx = 36 + sway * 3 + (pose === 'open' ? 4 : 0);
  const hy = pose === 'windup' ? 34 : 32;
  limb(ctx, [[36, base - 4], [36 - sway * 3, 62], [hx, hy + 12]], 7, '#3f8a45');
  // cabeça (bulbo)
  const inflate = pose === 'windup' ? 1.18 : 1;
  ctx.save();
  ctx.translate(hx, hy);
  if (pose === 'windup') {
    ctx.fillStyle = rad(ctx, 0, 0, 0, 34, [[0, 'rgba(170,255,100,0.55)'], [1, 'rgba(170,255,100,0)']]);
    ctx.fillRect(-34, -34, 68, 68);
  }
  if (pose === 'open') {
    // boca aberta: duas metades com dentes
    ctx.beginPath();
    ctx.ellipse(4, -6, 20, 13, -0.35, Math.PI, 0);
    ctx.closePath();
    paint(ctx, lin(ctx, 0, -20, 0, 0, [[0, '#e0507a'], [1, '#a02a50']]));
    ctx.beginPath();
    ctx.ellipse(4, 6, 20, 11, 0.35, 0, Math.PI);
    ctx.closePath();
    paint(ctx, lin(ctx, 0, 0, 0, 16, [[0, '#a02a50'], [1, '#701a38']]));
    ctx.fillStyle = '#3a0f1a';
    ellipse(ctx, 6, 0, 16, 6, 0);
    ctx.fill();
    ctx.fillStyle = rad(ctx, 8, 0, 0, 12, [[0, 'rgba(190,255,120,0.9)'], [1, 'rgba(190,255,120,0)']]);
    ellipse(ctx, 8, 0, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#fff4e0';
    for (let x = -10; x < 20; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, -6);
      ctx.lineTo(x + 2, -1);
      ctx.lineTo(x + 4, -6);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 1, 6);
      ctx.lineTo(x + 3, 1);
      ctx.lineTo(x + 5, 6);
      ctx.fill();
    }
  } else {
    ellipse(ctx, 0, 0, 18 * inflate, 16 * inflate);
    paint(ctx, rad(ctx, -5, -6, 2, 22 * inflate, [[0, '#f07a9a'], [0.55, '#c0386a'], [1, '#7a1a40']]));
    ctx.fillStyle = 'rgba(255,220,235,0.85)';
    for (const [x, y, r] of [[-8, -6, 3], [4, -10, 2.5], [8, 2, 2], [-4, 6, 2.2]]) {
      ellipse(ctx, x * inflate, y * inflate, r, r);
      ctx.fill();
    }
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-6, 4);
    ctx.quadraticCurveTo(8, 8, 18 * inflate, 2);
    ctx.stroke();
  }
  ctx.restore();
}

// Colosso de Magma: criatura gigante original, de rocha vulcânica com fendas de lava,
// chifres curvos e placas de obsidiana nas costas. Virado para a direita, pés em y≈246.
const BASALT = ['#5a5060', '#3a3340', '#1e1a24'];
const MAGMA = '#ff8a2a';

function glowLine(ctx, pts, width, color, blur) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]);
  ctx.stroke();
  ctx.restore();
}

function drawKaiju(ctx, { ph = 0, pose = 'walk' }) {
  const glow = pose === 'walk' ? 0.65 : 1;
  const bob = pose === 'walk' ? -Math.abs(Math.cos(ph)) * 3 : 0;
  const leanBack = pose === 'stomp' ? -6 : pose === 'breath' ? -4 : 0;
  const tailUp = pose === 'tail';
  const crack = `rgba(255,${Math.round(110 + glow * 60)},40,${0.55 + glow * 0.45})`;

  // cauda
  const sway = Math.sin(ph) * 6;
  const tipX = tailUp ? 14 : 6;
  const tipY = tailUp ? 70 : 214 + sway;
  ctx.beginPath();
  ctx.moveTo(130, 118 + bob);
  ctx.bezierCurveTo(90, tailUp ? 90 : 140, 40, tailUp ? 60 : 180 + sway, tipX, tipY);
  ctx.bezierCurveTo(50, tailUp ? 100 : 206 + sway, 100, tailUp ? 160 : 200, 150, 192 + bob);
  ctx.closePath();
  paint(ctx, lin(ctx, 0, tailUp ? 60 : 130, 0, 210, [[0, BASALT[0]], [1, BASALT[2]]]), OUT, 2.5);
  // placas da cauda
  for (let i = 0; i < 5; i++) {
    const t = 0.2 + i * 0.15;
    const x = 130 - t * (130 - tipX) * 0.95;
    const y = tailUp ? 118 - t * 60 + bob : 124 + t * (tipY - 130) * 0.9 + bob;
    ctx.beginPath();
    ctx.moveTo(x - 7, y + 3);
    ctx.lineTo(x - 2, y - 14 + i * 1.5);
    ctx.lineTo(x + 5, y + 3);
    ctx.closePath();
    paint(ctx, '#1a1420', OUT, 1.4);
    glowLine(ctx, [[x - 3, y], [x - 2, y - 8 + i]], 2, crack, 8 * glow);
  }

  // perna de trás
  const q = ph + Math.PI;
  const bA = pose === 'stomp' ? -0.25 : 0.28 * Math.sin(q);
  const back = legPoints(150, 170 + bob, bA, bA - 0.25, 44, 40);
  limb(ctx, back.slice(0, 2), 40, '#2c2632');
  limb(ctx, back.slice(1), 28, '#2c2632');
  limb(ctx, [back[2], [back[2][0] + 26, back[2][1] + 2]], 16, '#241e2a');

  // tronco inclinado para a frente
  ctx.save();
  ctx.translate(0, bob);
  ctx.rotate((leanBack * Math.PI) / 180);
  ellipse(ctx, 178, 132, 64, 80, -0.38);
  paint(ctx, lin(ctx, 120, 60, 230, 210, [[0, BASALT[0]], [0.5, BASALT[1]], [1, BASALT[2]]]), OUT, 3);
  // barriga em placas
  ellipse(ctx, 198, 150, 32, 58, -0.38);
  ctx.fillStyle = lin(ctx, 180, 100, 220, 200, [[0, '#6e5c58'], [1, '#43363a']]);
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,20,20,0.6)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.ellipse(198 + i * 3, 104 + i * 18, 26 - Math.abs(i - 2.5) * 3, 5, -0.38, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  // fendas de magma
  glowLine(ctx, [[140, 100], [152, 120], [146, 140], [160, 166]], 3, crack, 12 * glow);
  glowLine(ctx, [[168, 70], [176, 92], [170, 108]], 2.5, crack, 10 * glow);
  glowLine(ctx, [[130, 150], [142, 160], [138, 180]], 2.5, crack, 10 * glow);
  // placas de obsidiana nas costas
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.95 + i * 0.1);
    const x = 178 + Math.cos(a - 0.38) * 66;
    const y = 132 + Math.sin(a - 0.38) * 82;
    const nx = Math.cos(a - 0.38);
    const ny = Math.sin(a - 0.38);
    const len = 26 + Math.sin((i / 6) * Math.PI) * 18;
    ctx.beginPath();
    ctx.moveTo(x - ny * 10, y + nx * 10);
    ctx.lineTo(x + nx * len, y + ny * len);
    ctx.lineTo(x + ny * 10, y - nx * 10);
    ctx.closePath();
    paint(ctx, lin(ctx, x, y, x + nx * len, y + ny * len, [[0, '#1a1420'], [1, '#3a3044']]), OUT, 1.8);
    ctx.beginPath();
    ctx.moveTo(x - ny * 4, y + nx * 4);
    ctx.lineTo(x + nx * len * 0.7, y + ny * len * 0.7);
    ctx.lineTo(x + ny * 4, y - nx * 4);
    ctx.closePath();
    ctx.save();
    ctx.shadowColor = MAGMA;
    ctx.shadowBlur = 14 * glow;
    ctx.fillStyle = `rgba(255,${Math.round(120 + 60 * glow)},50,${0.5 + glow * 0.4})`;
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // braço
  limb(ctx, [[218, 112 + bob], [240, 140 + bob], [256, 130 + bob]], 14, '#3a3340');
  ctx.fillStyle = '#e8dcc8';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(254 + i * 3, 124 + bob + i * 3);
    ctx.lineTo(266 + i * 2, 126 + bob + i * 4);
    ctx.lineTo(256 + i * 3, 130 + bob + i * 3);
    ctx.fill();
  }

  // pescoço e cabeça
  const hy = (pose === 'breath' ? 26 : 42) + bob;
  const hx = pose === 'breath' ? 236 : 238;
  limb(ctx, [[205, 86 + bob], [hx, hy + 18]], 40, BASALT[1]);
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(pose === 'breath' ? -0.22 : 0);
  // chifre de trás
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.bezierCurveTo(-24, -24, -40, -10, -42, 8);
  ctx.bezierCurveTo(-34, -6, -18, -10, 6, 4);
  ctx.closePath();
  paint(ctx, lin(ctx, -40, -20, 0, 0, [[0, '#9a8c78'], [1, '#d8cbb8']]), OUT, 1.8);
  // mandíbula
  ctx.save();
  ctx.translate(6, 18);
  ctx.rotate(pose === 'breath' ? 0.55 : 0.04);
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  ctx.lineTo(48, 0);
  ctx.quadraticCurveTo(52, 8, 44, 10);
  ctx.lineTo(0, 12);
  ctx.closePath();
  paint(ctx, lin(ctx, 0, -4, 0, 12, [[0, BASALT[1]], [1, BASALT[2]]]), OUT, 2);
  ctx.fillStyle = '#f4ead8';
  for (let x = 8; x < 44; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 2.5, -7);
    ctx.lineTo(x + 5, 0);
    ctx.fill();
  }
  ctx.restore();
  if (pose === 'breath') {
    // boca cheia de magma
    ctx.save();
    ctx.shadowColor = MAGMA;
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.moveTo(4, 16);
    ctx.lineTo(56, 20);
    ctx.lineTo(40, 46);
    ctx.lineTo(4, 30);
    ctx.closePath();
    ctx.fillStyle = rad(ctx, 24, 26, 2, 34, [[0, '#fff2a0'], [0.4, '#ffb030'], [1, '#d0401a']]);
    ctx.fill();
    ctx.restore();
  }
  // crânio
  ctx.beginPath();
  ctx.moveTo(-6, 20);
  ctx.quadraticCurveTo(-8, -6, 14, -8);
  ctx.quadraticCurveTo(42, -8, 58, 8);
  ctx.quadraticCurveTo(62, 18, 54, 20);
  ctx.closePath();
  paint(ctx, lin(ctx, 0, -8, 0, 22, [[0, BASALT[0]], [1, BASALT[1]]]), OUT, 2.5);
  ctx.fillStyle = '#f4ead8';
  for (let x = 12; x < 54; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x + 2.5, 27);
    ctx.lineTo(x + 5, 20);
    ctx.fill();
  }
  glowLine(ctx, [[20, -4], [30, 4], [26, 12]], 2, crack, 8 * glow);
  // olho em brasa
  ctx.save();
  ctx.shadowColor = '#ffb030';
  ctx.shadowBlur = 12;
  eye(ctx, 26, 4, 5, '#ffcf40');
  ctx.restore();
  // chifre da frente
  ctx.beginPath();
  ctx.moveTo(8, -4);
  ctx.bezierCurveTo(-14, -30, -34, -22, -36, -2);
  ctx.bezierCurveTo(-26, -14, -10, -14, 14, 4);
  ctx.closePath();
  paint(ctx, lin(ctx, -36, -26, 10, 0, [[0, '#b8aa94'], [1, '#f0e4d0']]), OUT, 2);
  ctx.restore();

  // perna da frente
  const fA = pose === 'stomp' ? 1.05 : 0.28 * Math.sin(ph);
  const fS = pose === 'stomp' ? 0.35 : fA - 0.25;
  const front = legPoints(186, 176 + bob, fA, fS, 44, 40);
  limb(ctx, front.slice(0, 2), 44, BASALT[1]);
  limb(ctx, front.slice(1), 30, BASALT[1]);
  limb(ctx, [front[2], [front[2][0] + 28, front[2][1] + 2]], 18, BASALT[2]);
  glowLine(ctx, [[front[0][0] - 6, front[0][1] + 6], [front[1][0] - 4, front[1][1] - 4]], 2.5, crack, 10 * glow);
  ctx.fillStyle = '#f4ead8';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(front[2][0] + 26 + i * 3, front[2][1] - 6);
    ctx.lineTo(front[2][0] + 38 + i * 2, front[2][1] + 2);
    ctx.lineTo(front[2][0] + 26 + i * 3, front[2][1] + 6);
    ctx.fill();
  }
}

// ------------------------------------------------------------------ projéteis

function projectiles(scene) {
  canvasTex(scene, 'spore', 22, 22, (ctx) => {
    ctx.fillStyle = rad(ctx, 11, 11, 0, 11, [[0, 'rgba(240,255,200,1)'], [0.35, 'rgba(170,255,100,0.95)'], [1, 'rgba(120,220,60,0)']]);
    ctx.fillRect(0, 0, 22, 22);
    ctx.fillStyle = 'rgba(60,120,30,0.8)';
    for (const [x, y] of [[8, 9], [13, 12], [10, 14]]) {
      ellipse(ctx, x, y, 1.3, 1.3);
      ctx.fill();
    }
  });
  canvasTex(scene, 'lavabolt', 30, 30, (ctx) => {
    ctx.fillStyle = rad(ctx, 15, 15, 0, 15, [[0, 'rgba(255,250,200,1)'], [0.3, 'rgba(255,180,60,1)'], [0.7, 'rgba(220,70,20,0.8)'], [1, 'rgba(160,30,10,0)']]);
    ctx.fillRect(0, 0, 30, 30);
    ctx.fillStyle = 'rgba(40,20,20,0.7)';
    for (const [x, y, r] of [[10, 12, 2.5], [18, 17, 2], [14, 20, 1.6]]) {
      ellipse(ctx, x, y, r, r);
      ctx.fill();
    }
  });
  canvasTex(scene, 'shockwave', 84, 36, (ctx) => {
    ctx.save();
    ctx.shadowColor = MAGMA;
    ctx.shadowBlur = 12;
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(255,${150 + i * 25},60,${0.35 + i * 0.15})`;
      ctx.lineWidth = 8 - i * 1.5;
      ctx.beginPath();
      ctx.ellipse(42, 36, 36 - i * 4, 30 - i * 5, 0, Math.PI, 0);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(120,90,70,0.7)';
    for (const [x, y, r] of [[14, 30, 4], [70, 28, 5], [42, 24, 3]]) {
      ellipse(ctx, x, y, r, r);
      ctx.fill();
    }
  });
  canvasTex(scene, 'firepatch', 64, 30, (ctx) => {
    ctx.fillStyle = rad(ctx, 32, 30, 0, 34, [[0, 'rgba(255,200,80,0.7)'], [1, 'rgba(255,80,20,0)']]);
    ctx.fillRect(0, 0, 64, 30);
    const r = rng(4);
    for (let i = 0; i < 7; i++) {
      const x = 8 + i * 8 + r() * 4;
      const h = 12 + r() * 14;
      ctx.beginPath();
      ctx.moveTo(x - 5, 30);
      ctx.quadraticCurveTo(x - 4, 30 - h * 0.6, x, 30 - h);
      ctx.quadraticCurveTo(x + 4, 30 - h * 0.6, x + 5, 30);
      ctx.closePath();
      ctx.fillStyle = lin(ctx, 0, 30 - h, 0, 30, [[0, 'rgba(255,240,160,0.95)'], [0.5, 'rgba(255,150,40,0.95)'], [1, 'rgba(210,60,20,0.9)']]);
      ctx.fill();
    }
  });
}

// ------------------------------------------------------------------ API

export function buildNightTextures(scene) {
  nightSky(scene);
  nightLayers(scene);
  nightTree(scene);
  nightGround(scene);
  blueCastle(scene);
  projectiles(scene);
  sheet(scene, 'bat', 72, 48, ['fly0', 'fly1', 'fly2', 'fly3', 'swoop'], (ctx, name, i) =>
    drawBat(ctx, name === 'swoop' ? { swoop: true } : { flap: [0, 0.5, 1, 0.5][i] }),
  );
  sheet(scene, 'plant', 72, 84, ['idle0', 'idle1', 'windup', 'open'], (ctx, name) =>
    drawPlant(ctx, { sway: name === 'idle1' ? 1 : 0, pose: name.startsWith('idle') ? 'idle' : name }),
  );
  sheet(scene, 'kaiju', 300, 250, ['walk0', 'walk1', 'walk2', 'walk3', 'stomp', 'breath', 'tail'], (ctx, name, i) =>
    drawKaiju(ctx, name.startsWith('walk') ? { ph: (i / 4) * TAU } : { pose: name === 'stomp' ? 'stomp' : name === 'breath' ? 'breath' : 'tail' }),
  );
}

export function buildNightAnimations(scene) {
  const a = scene.anims;
  const f = (key, names) => names.map((frame) => ({ key, frame }));
  a.create({ key: 'bat-fly', frames: f('bat', ['fly0', 'fly1', 'fly2', 'fly3']), frameRate: 14, repeat: -1 });
  a.create({ key: 'plant-idle', frames: f('plant', ['idle0', 'idle1']), frameRate: 2.5, repeat: -1 });
  a.create({ key: 'kaiju-walk', frames: f('kaiju', ['walk0', 'walk1', 'walk2', 'walk3']), frameRate: 4, repeat: -1 });
}
