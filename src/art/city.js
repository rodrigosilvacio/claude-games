// Arte da Fase 4: Cidade das Torres (fim de tarde), moradores, usina de energia, portal
// e dois titãs originais. Mesma direção de arte (contorno #2a1d24, sol à direita,
// perspectiva atmosférica). A cidade é colorida e alegre; o perigo vem do chão
// (rachaduras laranja) e do plasma dourado do segundo titã.

import { OUT, TAU, rng, canvasTex, sheet, lin, rad, paint, limb, legPoints, ellipse, wrapX, eye } from './textures.js';

const PASTEL = ['#f0a8a0', '#f4d48a', '#a8cce8', '#b8e0b0', '#d8b8e8', '#f8c8a0'];

// ------------------------------------------------------------------ cenário

function windows(ctx, x, y, w, h, cols, rows, lit, r) {
  const ww = (w - 8) / cols;
  const wh = (h - 8) / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      ctx.fillStyle = r() < lit ? 'rgba(255,236,170,0.9)' : 'rgba(60,80,120,0.55)';
      ctx.fillRect(x + 4 + i * ww + ww * 0.2, y + 4 + j * wh + wh * 0.2, ww * 0.6, wh * 0.55);
    }
  }
}

function sky(scene) {
  canvasTex(scene, 'sky4', 960, 540, (ctx) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, 540, [[0, '#4f9ee6'], [0.45, '#9cd0f2'], [0.75, '#ffe2bc'], [1, '#ffd0a0']]);
    ctx.fillRect(0, 0, 960, 540);
    ctx.fillStyle = rad(ctx, 800, 120, 0, 320, [[0, 'rgba(255,246,210,0.9)'], [0.2, 'rgba(255,230,180,0.4)'], [1, 'rgba(255,230,180,0)']]);
    ctx.fillRect(0, 0, 960, 540);
    ellipse(ctx, 800, 120, 30, 30);
    ctx.fillStyle = '#fffbe8';
    ctx.fill();
  });
}

function skyline(scene) {
  const W = 1024;
  canvasTex(scene, 'far4', W, 300, (ctx) => {
    const r = rng(11);
    for (let x = 0; x < W; ) {
      const w = 40 + r() * 70;
      const h = 90 + r() * 180;
      const xx0 = x;
      wrapX(W, xx0, (xx) => {
        ctx.fillStyle = lin(ctx, 0, 300 - h, 0, 300, [[0, '#a8bcdc'], [1, '#c8d4ea']]);
        ctx.fillRect(xx, 300 - h, w - 4, h);
        if (r() > 0.6) ctx.fillRect(xx + w / 2 - 2, 300 - h - 24, 3, 24);
      });
      x += w;
    }
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(255,230,200,0.35)';
    ctx.fillRect(0, 0, W, 300);
    ctx.globalCompositeOperation = 'source-over';
  });
  canvasTex(scene, 'mid4', W, 220, (ctx) => {
    const r = rng(23);
    for (let x = 0; x < W; ) {
      const w = 60 + r() * 60;
      const h = 90 + r() * 110;
      const c = PASTEL[Math.floor(r() * PASTEL.length)];
      const xx0 = x;
      const lit = r() * 0.3;
      const seed = Math.floor(r() * 1e6);
      wrapX(W, xx0, (xx) => {
        ctx.beginPath();
        ctx.rect(xx, 220 - h, w - 6, h);
        paint(ctx, lin(ctx, xx, 0, xx + w, 0, [[0, c], [1, '#ffffff']]), 'rgba(42,29,36,0.5)', 1.5);
        windows(ctx, xx, 220 - h + 6, w - 6, h - 20, 3, Math.floor(h / 30), lit, rng(seed));
        if (seed % 3 === 0) {
          ctx.fillStyle = '#8a7a8a';
          ctx.fillRect(xx + 8, 220 - h - 14, 16, 14);
        }
      });
      x += w;
    }
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(200,220,255,0.25)';
    ctx.fillRect(0, 0, W, 220);
    ctx.globalCompositeOperation = 'source-over';
  });
  canvasTex(scene, 'near4', W, 260, (ctx) => {
    const r = rng(5);
    for (let x = 0; x < W; ) {
      const w = 110 + r() * 50;
      const h = 170 + r() * 70;
      const c = PASTEL[Math.floor(r() * PASTEL.length)];
      const awn = PASTEL[Math.floor(r() * PASTEL.length)];
      const xx0 = x;
      const seed = Math.floor(r() * 1e6);
      wrapX(W, xx0, (xx) => {
        ctx.beginPath();
        ctx.rect(xx, 260 - h, w - 4, h);
        paint(ctx, lin(ctx, 0, 260 - h, 0, 260, [[0, c], [1, '#a89098']]), OUT, 2);
        windows(ctx, xx, 260 - h + 8, w - 4, h - 100, 3, 3, 0.25, rng(seed));
        // toldo listrado
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = i % 2 ? '#ffffff' : awn;
          ctx.beginPath();
          ctx.moveTo(xx + 4 + i * ((w - 12) / 6), 260 - 88);
          ctx.lineTo(xx + 4 + (i + 1) * ((w - 12) / 6), 260 - 88);
          ctx.lineTo(xx + 4 + (i + 1) * ((w - 12) / 6) + 3, 260 - 70);
          ctx.lineTo(xx + 4 + i * ((w - 12) / 6) + 3, 260 - 70);
          ctx.fill();
        }
        ctx.strokeStyle = OUT;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(xx + 4, 260 - 88, w - 12, 18);
        // porta e vitrine
        ctx.fillStyle = '#5a4050';
        ctx.fillRect(xx + 12, 260 - 60, 24, 60);
        ctx.fillStyle = 'rgba(180,220,255,0.8)';
        ctx.fillRect(xx + 44, 260 - 56, w - 60, 36);
        ctx.strokeRect(xx + 44, 260 - 56, w - 60, 36);
      });
      x += w;
    }
  });
}

function street(scene) {
  const W = 128;
  canvasTex(scene, 'ground4', W, 96, (ctx) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, 22, [[0, '#e4e0dc'], [1, '#c8c2bc']]);
    ctx.fillRect(0, 0, W, 22);
    ctx.strokeStyle = 'rgba(120,110,105,0.6)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= W; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 2);
      ctx.lineTo(x, 20);
      ctx.stroke();
    }
    ctx.fillStyle = '#9a928c';
    ctx.fillRect(0, 22, W, 6);
    ctx.fillStyle = lin(ctx, 0, 28, 0, 96, [[0, '#5a5862'], [1, '#3a3842']]);
    ctx.fillRect(0, 28, W, 68);
    ctx.fillStyle = '#f4d040';
    ctx.fillRect(10, 62, 44, 5);
    ctx.fillRect(74, 62, 44, 5);
    const r = rng(3);
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.1})`;
      ctx.fillRect(r() * W, 30 + r() * 64, 2, 2);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(0, 0, W, 2);
  });
  canvasTex(scene, 'ledge4', W, 34, (ctx) => {
    ctx.fillStyle = '#6a6a78';
    ctx.fillRect(0, 26, W, 8);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#ffffff' : '#e85a5a';
      ctx.fillRect(i * 16, 0, 16, 24);
    }
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, 23);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 18, W, 6);
  });
  canvasTex(scene, 'lamp', 70, 260, (ctx) => {
    ctx.fillStyle = rad(ctx, 46, 34, 0, 40, [[0, 'rgba(255,240,170,0.6)'], [1, 'rgba(255,240,170,0)']]);
    ctx.fillRect(0, 0, 70, 80);
    ctx.beginPath();
    ctx.rect(30, 30, 8, 230);
    paint(ctx, lin(ctx, 30, 0, 38, 0, [[0, '#3a4a5a'], [1, '#6a7a8a']]), OUT, 1.5);
    limb(ctx, [[34, 34], [36, 20], [48, 18]], 5, '#4a5a6a');
    ctx.beginPath();
    ctx.moveTo(40, 22);
    ctx.lineTo(58, 22);
    ctx.lineTo(54, 34);
    ctx.lineTo(44, 34);
    ctx.closePath();
    paint(ctx, '#ffe9a0', OUT, 1.5);
    ctx.beginPath();
    ctx.rect(24, 246, 20, 14);
    paint(ctx, '#3a4a5a', OUT, 1.5);
  });
  canvasTex(scene, 'bench', 120, 56, (ctx) => {
    ctx.beginPath();
    ctx.roundRect(8, 14, 70, 8, 3);
    paint(ctx, '#b07a40', OUT, 1.5);
    ctx.beginPath();
    ctx.roundRect(8, 28, 70, 8, 3);
    paint(ctx, '#c88a4a', OUT, 1.5);
    for (const x of [14, 66]) {
      ctx.beginPath();
      ctx.rect(x, 22, 6, 34);
      paint(ctx, '#3a4a5a', OUT, 1.2);
    }
    // vaso com flores
    ctx.beginPath();
    ctx.moveTo(84, 30);
    ctx.lineTo(116, 30);
    ctx.lineTo(112, 56);
    ctx.lineTo(88, 56);
    ctx.closePath();
    paint(ctx, '#d87a5a', OUT, 1.5);
    for (const [x, y, c] of [[92, 22, '#ff7ab0'], [100, 16, '#ffe07a'], [108, 22, '#a8d0ff']]) {
      ctx.fillStyle = '#4f9a3c';
      ctx.fillRect(x - 1, y, 2, 30 - y);
      ellipse(ctx, x, y, 5, 5);
      paint(ctx, c, OUT, 1);
    }
  });
  canvasTex(scene, 'barrier', 52, 152, (ctx) => {
    for (const [y, h] of [[20, 26], [70, 26], [118, 26]]) {
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 ? '#ffffff' : '#ff8a2a';
        ctx.beginPath();
        ctx.moveTo(2 + i * 10, y);
        ctx.lineTo(12 + i * 10, y);
        ctx.lineTo(6 + i * 10, y + h);
        ctx.lineTo(-4 + i * 10, y + h);
        ctx.fill();
      }
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 2;
      ctx.strokeRect(1, y, 50, h);
    }
    for (const x of [6, 40]) {
      ctx.beginPath();
      ctx.rect(x, 0, 6, 152);
      paint(ctx, '#5a6a7a', OUT, 1.5);
    }
    ctx.save();
    ctx.shadowColor = '#ffcc40';
    ctx.shadowBlur = 10;
    ellipse(ctx, 26, 10, 7, 7);
    paint(ctx, '#ffcc40', OUT, 1.5);
    ctx.restore();
  });
}

function plant(scene) {
  const draw = (ctx, broken) => {
    // torres de resfriamento
    for (const [x, w, h] of [[30, 110, 250], [140, 120, 280]]) {
      ctx.beginPath();
      ctx.moveTo(x, 360);
      ctx.quadraticCurveTo(x + w * 0.25, 360 - h * 0.55, x + w * 0.12, 360 - h);
      ctx.lineTo(x + w * 0.88, 360 - h);
      ctx.quadraticCurveTo(x + w * 0.75, 360 - h * 0.55, x + w, 360);
      ctx.closePath();
      paint(ctx, lin(ctx, x, 0, x + w, 0, [[0, '#b8bcc8'], [0.6, '#e8eaf0'], [1, '#a0a4b0']]), OUT, 2.5);
      ctx.fillStyle = 'rgba(80,90,110,0.25)';
      ctx.fillRect(x + w * 0.2, 360 - h * 0.7, w * 0.6, 10);
      if (broken) {
        ctx.strokeStyle = OUT;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.4, 360 - h);
        ctx.lineTo(x + w * 0.5, 360 - h * 0.7);
        ctx.lineTo(x + w * 0.38, 360 - h * 0.5);
        ctx.stroke();
      }
    }
    // prédio do núcleo
    ctx.beginPath();
    ctx.rect(250, 170, 160, 190);
    paint(ctx, lin(ctx, 250, 0, 410, 0, [[0, '#c8d0dc'], [1, '#8a94a8']]), OUT, 2.5);
    ctx.beginPath();
    ctx.arc(330, 170, 80, Math.PI, 0);
    paint(ctx, lin(ctx, 250, 90, 410, 170, [[0, '#d8e0ea'], [1, '#9aa4b8']]), OUT, 2.5);
    ctx.save();
    ctx.shadowColor = broken ? '#ff6a3a' : '#7af0ff';
    ctx.shadowBlur = 26;
    ellipse(ctx, 330, 150, 34, 34);
    ctx.fillStyle = rad(ctx, 330, 150, 2, 34, broken ? [[0, '#fff0c0'], [0.5, '#ff8a3a'], [1, '#c02a1a']] : [[0, '#ffffff'], [0.5, '#7af0ff'], [1, '#2a8ad8']]);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#3a4a5a';
    for (let i = 0; i < 4; i++) ctx.fillRect(268 + i * 36, 250, 22, 34);
    ctx.fillStyle = '#ffcc40';
    ctx.fillRect(250, 330, 160, 8);
    ctx.fillStyle = OUT;
    for (let i = 0; i < 8; i++) ctx.fillRect(254 + i * 20, 330, 10, 8);
    if (broken) {
      ctx.fillStyle = 'rgba(30,25,30,0.35)';
      for (const [x, y, rr] of [[300, 220, 30], [370, 280, 24], [200, 160, 40], [90, 200, 34]]) {
        ellipse(ctx, x, y, rr, rr * 0.8);
        ctx.fill();
      }
    }
  };
  canvasTex(scene, 'powerplant', 420, 360, (ctx) => draw(ctx, false));
  canvasTex(scene, 'powerplantBroken', 420, 360, (ctx) => draw(ctx, true));
}

function portal(scene) {
  canvasTex(scene, 'portal', 200, 240, (ctx) => {
    ctx.save();
    ctx.translate(100, 120);
    ctx.fillStyle = rad(ctx, 0, 0, 10, 110, [[0, 'rgba(255,255,255,0.95)'], [0.35, 'rgba(200,150,255,0.85)'], [0.7, 'rgba(90,200,255,0.6)'], [1, 'rgba(90,200,255,0)']]);
    ctx.scale(0.8, 1);
    ellipse(ctx, 0, 0, 110, 110);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = ['#ffe07a', '#c8a0ff', '#7af0ff'][i % 3];
      ctx.lineWidth = 5 - i * 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, 100 - i * 13, i, i + Math.PI * 1.3);
      ctx.stroke();
    }
    ctx.restore();
  });
}

function hazards(scene) {
  canvasTex(scene, 'rock', 34, 30, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(4, 18);
    ctx.lineTo(10, 4);
    ctx.lineTo(24, 2);
    ctx.lineTo(32, 14);
    ctx.lineTo(26, 28);
    ctx.lineTo(8, 28);
    ctx.closePath();
    paint(ctx, lin(ctx, 0, 0, 34, 30, [[0, '#c8bcb0'], [1, '#7a6e64']]), OUT, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(12, 6, 8, 3);
  });
  canvasTex(scene, 'crack', 80, 16, (ctx) => {
    ctx.save();
    ctx.shadowColor = '#ff8a2a';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#ffb040';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4, 8);
    for (let x = 12; x <= 76; x += 8) ctx.lineTo(x, 8 + (x % 16 ? -4 : 4));
    ctx.stroke();
    ctx.restore();
  });
  canvasTex(scene, 'spike', 44, 56, (ctx) => {
    for (const [x, h, w] of [[12, 40, 9], [24, 54, 11], [34, 36, 8]]) {
      ctx.beginPath();
      ctx.moveTo(x - w, 56);
      ctx.lineTo(x, 56 - h);
      ctx.lineTo(x + w, 56);
      ctx.closePath();
      paint(ctx, lin(ctx, x - w, 0, x + w, 0, [[0, '#7a6a60'], [0.5, '#b8a898'], [1, '#6a5a50']]), OUT, 1.8);
    }
  });
  canvasTex(scene, 'plasmabeam', 64, 60, (ctx) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, 60, [
      [0, 'rgba(255,120,40,0)'],
      [0.2, 'rgba(255,140,50,0.8)'],
      [0.4, 'rgba(255,220,120,1)'],
      [0.5, 'rgba(255,255,240,1)'],
      [0.6, 'rgba(255,220,120,1)'],
      [0.8, 'rgba(255,140,50,0.8)'],
      [1, 'rgba(255,120,40,0)'],
    ]);
    ctx.fillRect(0, 0, 64, 60);
    const r = rng(2);
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.5})`;
      ellipse(ctx, r() * 64, 20 + r() * 20, 4 + r() * 6, 2);
      ctx.fill();
    }
  });
  canvasTex(scene, 'rubble', 96, 54, (ctx) => {
    const r = rng(9);
    for (let i = 0; i < 9; i++) {
      const x = 10 + r() * 76;
      const y = 22 + r() * 26;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((r() - 0.5) * 1.2);
      ctx.beginPath();
      ctx.rect(-14, -7, 28, 14);
      paint(ctx, i % 3 === 0 ? '#c86a4a' : i % 3 === 1 ? '#a8a0a0' : '#b88a5a', OUT, 1.6);
      ctx.restore();
    }
    // placa caída
    ctx.save();
    ctx.translate(48, 18);
    ctx.rotate(-0.2);
    ctx.beginPath();
    ctx.rect(-30, -8, 60, 16);
    paint(ctx, '#4a8ad8', OUT, 1.8);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('LOJA', -14, 4);
    ctx.restore();
  });
}

// ------------------------------------------------------------------ moradores

const LOOKS = [
  { shirt: '#9a6ad8', pants: '#3a4a6a', hair: '#3a2418', skin: '#c88a64', long: true, scale: 1 },
  { shirt: '#4ab07a', pants: '#5a4a3a', hair: '#e8c070', skin: '#f2c29b', cap: '#e84a5a', scale: 1 },
  { shirt: '#f4c030', pants: '#3a6ab0', hair: '#1a1a22', skin: '#8a5a3a', scale: 0.78 }, // criança
];

function drawCitizen(ctx, look, { step = 0, pose = 'walk' }) {
  const L = LOOKS[look];
  ctx.save();
  ctx.translate(22, 76);
  ctx.scale(L.scale, L.scale);
  const cower = pose === 'cower';
  const cheer = pose === 'cheer';
  const by = cower ? 12 : 0;
  // pernas
  if (cower) {
    limb(ctx, [[-4, -24], [-8, -12], [-4, -2]], 6, L.pants);
    limb(ctx, [[4, -24], [8, -12], [6, -2]], 6, L.pants);
  } else {
    limb(ctx, legPoints(-3, -26, step * 0.4, step * 0.2, 13, 12), 6, L.pants);
    limb(ctx, legPoints(3, -26, -step * 0.4, -step * 0.2, 13, 12), 6, L.pants);
  }
  // corpo
  ctx.beginPath();
  ctx.roundRect(-9, -48 + by, 18, 24, 5);
  paint(ctx, lin(ctx, 0, -48, 0, -24, [[0, L.shirt], [1, '#00000033']]), OUT, 1.8);
  // braços
  if (cower) {
    limb(ctx, [[-7, -44 + by], [-12, -54 + by], [-4, -60 + by]], 5, L.shirt);
    limb(ctx, [[7, -44 + by], [12, -54 + by], [4, -60 + by]], 5, L.shirt);
  } else if (cheer) {
    limb(ctx, [[-7, -44], [-14, -56], [-14, -68]], 5, L.shirt);
    limb(ctx, [[7, -44], [14, -56], [14, -68]], 5, L.shirt);
  } else {
    limb(ctx, [[-7, -44], [-10 - step * 2, -34]], 5, L.shirt);
    limb(ctx, [[7, -44], [10 + step * 2, -34]], 5, L.shirt);
  }
  // cabeça
  const hy = -58 + by;
  if (L.long) {
    ctx.beginPath();
    ctx.ellipse(-2, hy + 4, 11, 13, 0, 0, TAU);
    ctx.fillStyle = L.hair;
    ctx.fill();
  }
  ellipse(ctx, 0, hy, 9, 9.5);
  paint(ctx, rad(ctx, 2, hy - 3, 1, 11, [[0, '#ffffff22'], [0.3, L.skin], [1, L.skin]]), OUT, 1.6);
  ctx.beginPath();
  ctx.ellipse(0, hy - 5, 9.5, 6, 0, Math.PI, 0);
  paint(ctx, L.hair, OUT, 1.2);
  if (L.cap) {
    ctx.beginPath();
    ctx.ellipse(0, hy - 6, 10, 6, 0, Math.PI, 0);
    paint(ctx, L.cap, OUT, 1.2);
    ctx.fillStyle = L.cap;
    ctx.fillRect(4, hy - 7, 10, 3);
  }
  // rosto
  ctx.fillStyle = OUT;
  if (cower) {
    ctx.fillRect(1, hy, 3, 1.2);
    ctx.fillRect(5, hy, 3, 1.2);
  } else {
    ellipse(ctx, 3, hy, 1.2, 1.6);
    ctx.fill();
    ellipse(ctx, 6.5, hy, 1.2, 1.6);
    ctx.fill();
  }
  ctx.strokeStyle = '#8a3a3a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (cheer) ctx.arc(5, hy + 4, 3, 0, Math.PI);
  else if (cower) ctx.arc(5, hy + 6, 2.5, Math.PI, 0);
  else ctx.arc(5, hy + 3.5, 2, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ titãs

// Titã dos Espinhos: quadrúpede de rocha, com casco cheio de espinhos de pedra e
// rachaduras de lava. Virado para a direita, pés em y≈206.
function drawSpikeTitan(ctx, { ph = 0, pose = 'walk' }) {
  const bob = pose === 'walk' ? -Math.abs(Math.cos(ph)) * 3 : 0;
  const rear = pose === 'stomp' ? -0.18 : 0;
  const glow = pose === 'walk' ? 0.55 : 1;
  ctx.save();
  if (rear) {
    ctx.translate(60, 200);
    ctx.rotate(rear);
    ctx.translate(-60, -200);
  }
  const leg = (x, q, front) => {
    const a = pose === 'stomp' && front ? 0.9 : 0.25 * Math.sin(ph + q);
    const pts = legPoints(x, 140 + bob, a, a * 0.3, 32, 32);
    limb(ctx, pts, front ? 30 : 26, front ? '#7a6a5e' : '#5e5248');
    ellipse(ctx, pts[2][0] + 6, pts[2][1] - 2, 18, 8);
    paint(ctx, '#4a3e36', OUT, 2);
  };
  leg(100, Math.PI, false);
  leg(210, 0, false);
  // cauda com clava
  const tailUp = pose === 'tail';
  const tx = 18;
  const ty = tailUp ? 50 : 150 + Math.sin(ph) * 4;
  limb(ctx, [[80, 120 + bob], [44, tailUp ? 90 : 140], [tx + 10, ty]], 22, '#6a5e54');
  ellipse(ctx, tx, ty, 18, 16);
  paint(ctx, '#7a6a5e', OUT, 2);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    ctx.beginPath();
    ctx.moveTo(tx + Math.cos(a) * 12, ty + Math.sin(a) * 12);
    ctx.lineTo(tx + Math.cos(a + 0.3) * 26, ty + Math.sin(a + 0.3) * 26);
    ctx.lineTo(tx + Math.cos(a + 0.6) * 12, ty + Math.sin(a + 0.6) * 12);
    paint(ctx, '#d8cbb8', OUT, 1.4);
  }
  // casco
  ctx.beginPath();
  ctx.ellipse(160, 110 + bob, 110, 74, 0, Math.PI, 0);
  ctx.lineTo(270, 130 + bob);
  ctx.quadraticCurveTo(160, 150 + bob, 50, 130 + bob);
  ctx.closePath();
  paint(ctx, lin(ctx, 0, 36, 0, 150, [[0, '#9a8a7a'], [0.6, '#6e6056'], [1, '#4a3e36']]), OUT, 3);
  // placas e rachaduras
  ctx.strokeStyle = 'rgba(40,30,25,0.6)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(160, 110 + bob, 110 - i * 20, 74 - i * 14, 0, Math.PI, 0);
    ctx.stroke();
  }
  ctx.save();
  ctx.shadowColor = '#ff8a2a';
  ctx.shadowBlur = 10 * glow;
  ctx.strokeStyle = `rgba(255,150,50,${0.5 + glow * 0.5})`;
  ctx.lineWidth = 2.5;
  for (const pts of [[[110, 60], [120, 80], [112, 100]], [[200, 56], [190, 80], [204, 104]], [[160, 44], [158, 70]]]) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1] + bob);
    for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1] + bob);
    ctx.stroke();
  }
  ctx.restore();
  // espinhos de pedra no casco
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + 0.18 + (i / 8) * (Math.PI - 0.36);
    const x = 160 + Math.cos(a) * 104;
    const y = 110 + bob + Math.sin(a) * 70;
    const nx = Math.cos(a);
    const ny = Math.sin(a);
    const len = 22 + (i % 2) * 14;
    ctx.beginPath();
    ctx.moveTo(x - ny * 9, y + nx * 9);
    ctx.lineTo(x + nx * len, y + ny * len);
    ctx.lineTo(x + ny * 9, y - nx * 9);
    ctx.closePath();
    paint(ctx, lin(ctx, x, y, x + nx * len, y + ny * len, [[0, '#8a7a6e'], [1, '#e8dcc8']]), OUT, 1.8);
  }
  // pernas da frente
  leg(130, 0.5, true);
  leg(240, Math.PI + 0.5, true);
  // cabeça
  const hy = (pose === 'breath' ? 70 : 96) + bob;
  ctx.save();
  ctx.translate(268, hy);
  ctx.rotate(pose === 'breath' ? -0.35 : 0);
  ctx.beginPath();
  ctx.moveTo(-14, -18);
  ctx.quadraticCurveTo(20, -30, 46, -8);
  ctx.quadraticCurveTo(52, 6, 40, 14);
  ctx.lineTo(-10, 18);
  ctx.closePath();
  paint(ctx, lin(ctx, 0, -30, 0, 18, [[0, '#a8988a'], [1, '#6e6056']]), OUT, 2.5);
  if (pose === 'breath') {
    ctx.beginPath();
    ctx.moveTo(10, 8);
    ctx.lineTo(48, 4);
    ctx.lineTo(40, 26);
    ctx.lineTo(8, 20);
    ctx.closePath();
    paint(ctx, '#8a2a30', OUT, 1.5);
  }
  for (const [x, a] of [[-4, -0.9], [12, -0.5]]) {
    ctx.save();
    ctx.translate(x, -20);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(0, -24);
    ctx.lineTo(5, 0);
    paint(ctx, '#e8dcc8', OUT, 1.5);
    ctx.restore();
  }
  ctx.save();
  ctx.shadowColor = '#ffb030';
  ctx.shadowBlur = 10;
  eye(ctx, 22, -6, 4.5, '#ffcf40');
  ctx.restore();
  ctx.restore();
  ctx.restore();
}

// Titã de Plasma: bípede blindado de metal azul-petróleo e bronze, com um núcleo
// de energia dourado no peito. Virado para a direita, pés em y≈256.
function drawPlasmaTitan(ctx, { ph = 0, pose = 'walk' }) {
  const bob = pose === 'walk' ? -Math.abs(Math.cos(ph)) * 3 : 0;
  const glow = pose === 'breath' ? 1 : pose === 'walk' ? 0.6 : 0.85;
  const plate = (x0, y0, x1, y1) => lin(ctx, x0, y0, x1, y1, [[0, '#5aa0a8'], [0.5, '#2f6a78'], [1, '#1a3e4a']]);
  // cauda
  const tailUp = pose === 'tail';
  limb(ctx, [[120, 160 + bob], [70, tailUp ? 110 : 180], [20, tailUp ? 70 : 226 + Math.sin(ph) * 5]], 26, '#2f6a78');
  limb(ctx, [[70, tailUp ? 110 : 180], [20, tailUp ? 70 : 226 + Math.sin(ph) * 5]], 12, '#c8964a', false);
  // perna de trás
  const bA = pose === 'stomp' ? -0.2 : 0.26 * Math.sin(ph + Math.PI);
  const back = legPoints(140, 176 + bob, bA, bA - 0.2, 42, 40);
  limb(ctx, back.slice(0, 2), 38, '#24505c');
  limb(ctx, back.slice(1), 26, '#24505c');
  limb(ctx, [back[2], [back[2][0] + 24, back[2][1] + 2]], 16, '#c8964a');
  // tronco
  ellipse(ctx, 168, 136 + bob, 60, 78, -0.3);
  paint(ctx, plate(110, 60, 230, 210), OUT, 3);
  // placas do peito
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(186 + i * 2, 120 + bob + i * 22, 30 - i * 3, 9, -0.3, 0, Math.PI);
    ctx.strokeStyle = '#c8964a';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  // núcleo
  ctx.save();
  ctx.shadowColor = '#ffd040';
  ctx.shadowBlur = 24 * glow;
  ellipse(ctx, 190, 112 + bob, 18, 18);
  ctx.fillStyle = rad(ctx, 190, 112 + bob, 2, 18, [[0, '#ffffff'], [0.4, '#ffe080'], [1, '#e08a20']]);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(190, 112 + bob, 18, 0, TAU);
  ctx.stroke();
  // ombreira
  ctx.beginPath();
  ctx.ellipse(200, 76 + bob, 30, 18, -0.4, 0, TAU);
  paint(ctx, lin(ctx, 170, 60, 230, 92, [[0, '#e8b860'], [1, '#a8742a']]), OUT, 2);
  // braço
  limb(ctx, [[212, 92 + bob], [236, 124 + bob], [256, 114 + bob]], 18, '#2f6a78');
  ellipse(ctx, 258, 114 + bob, 10, 9);
  paint(ctx, '#c8964a', OUT, 1.8);
  // pescoço e cabeça
  const hy = (pose === 'breath' ? 30 : 44) + bob;
  limb(ctx, [[196, 76 + bob], [226, hy + 16]], 34, '#2f6a78');
  ctx.save();
  ctx.translate(222, hy);
  ctx.rotate(pose === 'breath' ? -0.12 : 0);
  // crista única de metal
  ctx.beginPath();
  ctx.moveTo(-6, -8);
  ctx.quadraticCurveTo(-30, -40, -46, -36);
  ctx.quadraticCurveTo(-26, -16, -4, 4);
  ctx.closePath();
  paint(ctx, lin(ctx, -46, -40, 0, 0, [[0, '#ffe080'], [1, '#c8964a']]), OUT, 2);
  // mandíbula
  ctx.save();
  ctx.translate(4, 16);
  ctx.rotate(pose === 'breath' ? 0.45 : 0.04);
  ctx.beginPath();
  ctx.moveTo(-6, -3);
  ctx.lineTo(48, 0);
  ctx.lineTo(44, 10);
  ctx.lineTo(0, 12);
  ctx.closePath();
  paint(ctx, plate(0, -3, 0, 12), OUT, 2);
  ctx.restore();
  if (pose === 'breath') {
    ctx.save();
    ctx.shadowColor = '#ffd040';
    ctx.shadowBlur = 26;
    ctx.beginPath();
    ctx.moveTo(4, 14);
    ctx.lineTo(56, 16);
    ctx.lineTo(44, 40);
    ctx.lineTo(4, 28);
    ctx.closePath();
    ctx.fillStyle = rad(ctx, 26, 24, 2, 30, [[0, '#ffffff'], [0.4, '#ffe080'], [1, '#ff8a2a']]);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(-8, 18);
  ctx.quadraticCurveTo(-8, -8, 16, -10);
  ctx.quadraticCurveTo(44, -8, 58, 8);
  ctx.quadraticCurveTo(60, 16, 52, 18);
  ctx.closePath();
  paint(ctx, plate(0, -10, 0, 20), OUT, 2.5);
  // viseira de olhos
  ctx.save();
  ctx.shadowColor = '#ffe080';
  ctx.shadowBlur = 12 * glow;
  ctx.beginPath();
  ctx.roundRect(16, -4, 26, 8, 4);
  ctx.fillStyle = '#ffe080';
  ctx.fill();
  ctx.restore();
  ctx.restore();
  // perna da frente
  const fA = pose === 'stomp' ? 1 : 0.26 * Math.sin(ph);
  const front = legPoints(176, 182 + bob, fA, pose === 'stomp' ? 0.3 : fA - 0.2, 42, 40);
  limb(ctx, front.slice(0, 2), 42, '#2f6a78');
  limb(ctx, front.slice(1), 28, '#2f6a78');
  limb(ctx, [front[2], [front[2][0] + 26, front[2][1] + 2]], 18, '#c8964a');
}

// ------------------------------------------------------------------ API

export function buildCityTextures(scene) {
  sky(scene);
  skyline(scene);
  street(scene);
  plant(scene);
  portal(scene);
  hazards(scene);
  LOOKS.forEach((_, i) =>
    sheet(scene, `citizen${i}`, 44, 78, ['walk0', 'walk1', 'walk2', 'walk3', 'idle', 'cower', 'cheer'], (ctx, name, j) =>
      drawCitizen(ctx, i, name.startsWith('walk') ? { step: [1, 0, -1, 0][j] } : { pose: name }),
    ),
  );
  const poses = ['walk0', 'walk1', 'walk2', 'walk3', 'stomp', 'breath', 'tail'];
  const poseOf = (name, i) => (name.startsWith('walk') ? { ph: (i / 4) * TAU } : { pose: name });
  sheet(scene, 'spikeTitan', 320, 210, poses, (ctx, name, i) => drawSpikeTitan(ctx, poseOf(name, i)));
  sheet(scene, 'plasmaTitan', 300, 260, poses, (ctx, name, i) => drawPlasmaTitan(ctx, poseOf(name, i)));
}

export function buildCityAnimations(scene) {
  const a = scene.anims;
  const f = (key, names) => names.map((frame) => ({ key, frame }));
  for (let i = 0; i < LOOKS.length; i++) {
    a.create({ key: `citizen${i}-walk`, frames: f(`citizen${i}`, ['walk0', 'walk1', 'walk2', 'walk3']), frameRate: 7, repeat: -1 });
    a.create({ key: `citizen${i}-cheer`, frames: f(`citizen${i}`, ['idle', 'cheer']), frameRate: 4, repeat: -1 });
  }
  a.create({ key: 'spikeTitan-walk', frames: f('spikeTitan', ['walk0', 'walk1', 'walk2', 'walk3']), frameRate: 4, repeat: -1 });
  a.create({ key: 'plasmaTitan-walk', frames: f('plasmaTitan', ['walk0', 'walk1', 'walk2', 'walk3']), frameRate: 4, repeat: -1 });
}
