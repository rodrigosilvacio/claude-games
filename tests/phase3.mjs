// Fase 3 no navegador: transição da Fase 2 com as vidas, escudo, plataformas, Serpente e o final com a princesa.
// Uso: node tests/phase3.mjs            (robô invencível: prova que tudo funciona até o final)
//      node tests/phase3.mjs --real     (robô sem invencibilidade: só mede a dificuldade, não falha)
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { serve } from '../tools/serve.mjs';

const { chromium } = await import('playwright').catch(() => createRequire(import.meta.url)('playwright'));
const real = process.argv.includes('--real');
const outDir = new URL('./output/', import.meta.url).pathname;
await mkdir(outDir, { recursive: true });

const server = await serve(0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(() => window.game?.scene.isActive('title'));

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });

// 1) vencer a Fase 2 leva para a Fase 3 com as vidas
await page.evaluate(() =>
  window.game.scene.getScene('title').scene.start('end', { outcome: 'victory', phase: 2, kills: 13, total: 13, timeMs: 90000, hp: 60, lives: 5 }),
);
await page.waitForFunction(() => window.game.scene.isActive('end'));
await page.waitForTimeout(900);
const label = await page.evaluate(() => window.game.scene.getScene('end').next?.label);
check('tela de fase concluída oferece a Fase 3', /Fase 3/.test(label ?? ''), label);
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.game.scene.isActive('play'));
await page.waitForTimeout(500);
const start = await page.evaluate(() => {
  const s = window.game.scene.getScene('play');
  return { phase: s.phase, lives: s.run.lives, shield: s.hero.hasShield };
});
check('Fase 3 começa com as vidas da Fase 2 e sem escudo', start.phase === 3 && start.lives === 5 && !start.shield, JSON.stringify(start));

if (!real) await page.evaluate(() => (window.__god = true));
const held = new Set();
async function hold(keys) {
  for (const k of held) if (!keys.includes(k)) { await page.keyboard.up(k); held.delete(k); }
  for (const k of keys) if (!held.has(k)) { await page.keyboard.down(k); held.add(k); }
}

const t0 = Date.now();
let last;
let gotShield = false;
let shot = new Set();
while (Date.now() - t0 < 420_000) {
  const s = await page.evaluate(() => {
    const sc = window.game.scene.getScene('play');
    if (!window.game.scene.isActive('play') || !sc?.hero) return { over: true };
    if (window.__god) sc.hero.fighter.invulnUntil = sc.time.now + 1e9;
    const h = sc.hero;
    const serp = sc.enemies.find((e) => e.type === 'serpent');
    return {
      over: false,
      ended: !!sc.run.outcome,
      x: h.x,
      y: h.sprite.y,
      onGround: h.sprite.body.blocked.down,
      facing: h.facing,
      hp: h.fighter.hp,
      lives: sc.run.lives,
      shield: h.hasShield,
      active: sc.run.active,
      gaps: (sc.level.gaps ?? []).map((g, i) => ({ x0: g.x0, x1: g.x1, px: sc.movers[i].x, pw: g.platform.w })),
      hazards: sc.hazards.filter((z) => !z.friendly).map((z) => ({ kind: z.kind, x: z.sprite.x, y: z.sprite.y })),
      serp: serp && serp.alive ? { x: serp.sprite.x, visible: serp.sprite.visible, state: serp.brain.state } : null,
      enemies: sc.enemies
        .filter((e) => e.alive && e.encounter.id === sc.run.active && e.type !== 'serpent')
        .map((e) => ({ type: e.type, x: e.sprite.x, y: e.sprite.y, w: e.sprite.body.width, state: e.brain.state })),
    };
  });
  if (s.over || s.ended) break;
  last = s;
  if (s.shield) gotShield = true;
  if (s.active && !shot.has(s.active)) {
    shot.add(s.active);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${outDir}p3-arena-${s.active}.png` });
  }

  const keys = [];
  let attack = false;
  const gapAhead = s.gaps.find((g) => s.x > g.x0 - 70 && s.x < g.x1 + 5);
  const near = s.enemies.sort((a, b) => Math.abs(a.x - s.x) - Math.abs(b.x - s.x))[0];
  const incoming = s.hazards.find((z) => Math.abs(z.x - s.x) < 130 && z.y < s.y);

  if (gapAhead && !(near && Math.abs(near.x - s.x) < 120)) {
    const left = gapAhead.px - gapAhead.pw / 2;
    const right = gapAhead.px + gapAhead.pw / 2;
    if (s.x < gapAhead.x0) {
      if (left <= gapAhead.x0 + 8) keys.push('KeyD'); // a plataforma encostou: sobe
    } else if (s.x < gapAhead.x1) {
      if (right >= gapAhead.x1 - 8) keys.push('KeyD'); // chegou do outro lado: desce
      else if (s.x > right - 20) keys.push('KeyA');
      else if (s.x < left + 20) keys.push('KeyD');
    } else keys.push('KeyD');
  } else if (s.serp && s.active === 'lago') {
    const dx = s.serp.x - s.x;
    const dir = Math.sign(dx) || 1;
    if (incoming && s.shield) {
      // estilhaço vindo: segura o escudo para devolver
      keys.push('KeyS');
      if (s.facing !== dir) keys.push(dir > 0 ? 'KeyD' : 'KeyA');
    } else if (s.serp.visible && ['up', 'windup', 'cast', 'stuck', 'lunge'].includes(s.serp.state)) {
      if (Math.abs(dx) > 90) keys.push(dir > 0 ? 'KeyD' : 'KeyA');
      else {
        if (s.facing !== dir) keys.push(dir > 0 ? 'KeyD' : 'KeyA');
        attack = true;
      }
    } else if (real && s.serp.state === 'emerging' && Math.abs(dx) < 220) {
      keys.push(dir > 0 ? 'KeyA' : 'KeyD');
    }
  } else if (!near) {
    keys.push('KeyD');
  } else {
    const dx = near.x - s.x;
    const dir = Math.sign(dx) || 1;
    const dist = Math.abs(dx);
    if (incoming && s.shield && near.type === 'yeti') {
      keys.push('KeyS');
      if (s.facing !== dir) keys.push(dir > 0 ? 'KeyD' : 'KeyA');
    } else if (near.type === 'ptero' && near.y < s.y - 100) {
      if (dist > 30) keys.push(dir > 0 ? 'KeyD' : 'KeyA');
      if (dist < 70 && s.onGround) keys.push('Space');
      if (dist < 70 && !s.onGround) attack = true;
    } else if (real && near.type === 'penguin' && near.state === 'slide' && dist < 160) {
      if (s.onGround) keys.push('Space'); // pula o pinguim
    } else if (dist > near.w / 2 + 38) {
      keys.push(dir > 0 ? 'KeyD' : 'KeyA');
    } else {
      if (s.facing !== dir) keys.push(dir > 0 ? 'KeyD' : 'KeyA');
      attack = true;
    }
  }
  await hold(keys);
  if (attack) await page.keyboard.press('KeyF');
  await page.waitForTimeout(40);
}
await hold([]);

// 2) final: a princesa sai do castelo e a mensagem aparece
const finale = await page
  .waitForFunction(() => window.game.scene.getScene('play')?.finale?.stage === 'done', null, { timeout: 15000 })
  .then(() => true)
  .catch(() => false);
await page.screenshot({ path: `${outDir}p3-final-princesa.png` });
const fin = await page.evaluate(() => {
  const sc = window.game.scene.getScene('play');
  return {
    stage: sc.finale?.stage,
    princess: !!sc.princess?.visible && Math.round(sc.princess.x),
    gateX: sc.level.castleGateX,
    heroX: Math.round(sc.hero.x),
    text: sc.finaleText?.text,
    textVisible: !!sc.finaleText?.visible && sc.finaleText.alpha > 0.9,
    counters: sc.counters,
    outcome: sc.run.outcome,
    kills: sc.run.kills,
    total: sc.run.total,
    lives: sc.run.lives,
    hp: sc.hero.fighter.hp,
  };
});

if (!real) {
  check('pegou o escudo no baú', gotShield);
  check('venceu todos os monstros e a Serpente', fin.outcome === 'victory' && fin.kills === fin.total, `${fin.kills}/${fin.total}`);
  check('o escudo bloqueou ataques', fin.counters?.blocked > 0, JSON.stringify(fin.counters));
  check('estilhaço devolvido pelo escudo acertou a Serpente', fin.counters?.reflectHits > 0, JSON.stringify(fin.counters));
  check('a princesa saiu do castelo e veio até o herói', finale && fin.princess && fin.princess < fin.gateX && fin.princess > fin.heroX, JSON.stringify({ princesa: fin.princess, heroi: fin.heroX, portao: fin.gateX }));
  check('mensagem "Parabéns, você é demais!!" na tela', fin.text === 'Parabéns, você é demais!!' && fin.textVisible, fin.text);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.game.scene.isActive('end'), null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${outDir}p3-tela-final.png` });
  const end = await page.evaluate(() => ({ active: window.game.scene.isActive('end'), label: window.game.scene.getScene('end')?.next?.label, phase: window.game.scene.getScene('end')?.result?.phase }));
  check('Enter leva à tela final da jornada', end.active && end.phase === 3 && end.label === 'Enter: jogar de novo', JSON.stringify(end));
}
await browser.close();
server.close();

for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}  ${r.detail ? `(${r.detail})` : ''}`);
if (real) console.log('robô sem invencibilidade:', JSON.stringify({ seconds: Math.round((Date.now() - t0) / 1000), resultado: fin.outcome, vidas: fin.lives, energia: fin.hp, inimigos: `${fin.kills}/${fin.total}`, contadores: fin.counters, ultimo: last && { x: Math.round(last.x), arena: last.active, vidas: last.lives } }));
console.log(errors.length ? `erros no console: ${[...new Set(errors)].slice(0, 3).join(' | ')}` : 'sem erros no console');
process.exit(results.every((r) => r.ok) && !errors.length ? 0 : 1);
