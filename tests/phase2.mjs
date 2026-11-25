// Fase 2 no navegador: transição da Fase 1 com as vidas, e um robô que limpa a fase.
// Uso: node tests/phase2.mjs            (robô invencível: prova que tudo é derrotável e a vitória funciona)
//      node tests/phase2.mjs --real     (robô sem invencibilidade: só mede a dificuldade, não falha)
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

// 1) vencer a Fase 1 leva para a Fase 2 com as vidas
await page.evaluate(() =>
  window.game.scene.getScene('title').scene.start('end', { outcome: 'victory', phase: 1, kills: 8, total: 8, timeMs: 60000, hp: 80, lives: 6 }),
);
await page.waitForFunction(() => window.game.scene.isActive('end'));
await page.waitForTimeout(900);
await page.screenshot({ path: `${outDir}p2-transicao.png` });
const label = await page.evaluate(() => window.game.scene.getScene('end').next?.label);
check('tela de fase concluída oferece a Fase 2', /Fase 2/.test(label ?? ''), label);
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.game.scene.isActive('play'));
await page.waitForTimeout(500);
const start = await page.evaluate(() => {
  const s = window.game.scene.getScene('play');
  return { phase: s.phase, lives: s.run.lives, enemies: s.enemies.length, theme: s.level.theme };
});
check('Fase 2 começa com as vidas da Fase 1', start.phase === 2 && start.lives === 6, JSON.stringify(start));

// 2) robô limpa a fase
if (!real) await page.evaluate(() => (window.__god = true));
const seenHazards = new Set();
const seenAttacks = new Set();
let enraged = false;
let shots = 0;

const held = new Set();
async function hold(keys) {
  for (const k of held) if (!keys.includes(k)) { await page.keyboard.up(k); held.delete(k); }
  for (const k of keys) if (!held.has(k)) { await page.keyboard.down(k); held.add(k); }
}

const t0 = Date.now();
let last;
while (Date.now() - t0 < 420_000) {
  const s = await page.evaluate(() => {
    const sc = window.game.scene.getScene('play');
    if (!window.game.scene.isActive('play') || !sc?.hero) return { over: true };
    if (window.__god) sc.hero.fighter.invulnUntil = sc.time.now + 1e9;
    const h = sc.hero;
    return {
      over: false,
      ended: !!sc.run.outcome, // fim de verdade (vitória ou sem vidas), não o renascimento
      dying: sc.ended,
      x: h.x,
      y: h.sprite.y,
      onGround: h.sprite.body.blocked.down,
      facing: h.facing,
      hp: h.fighter.hp,
      lives: sc.run.lives,
      active: sc.run.active,
      kills: sc.run.kills,
      hazards: sc.hazards.map((z) => ({ kind: z.kind, x: z.sprite.x, y: z.sprite.y })),
      enemies: sc.enemies
        .filter((e) => e.alive && e.encounter.id === sc.run.active)
        .map((e) => ({ type: e.type, x: e.sprite.x, y: e.sprite.y, w: e.sprite.body.width, state: e.brain.state, attack: e.out?.attack, enraged: e.out?.enraged })),
    };
  });
  if (s.over || s.ended) break;
  last = s;
  for (const z of s.hazards) seenHazards.add(z.kind);
  for (const e of s.enemies) {
    if (e.attack) seenAttacks.add(e.attack);
    if (e.enraged) enraged = true;
  }
  if (s.active && shots < 8 && !results.find((r) => r.name === `shot-${s.active}`)) {
    results.push({ name: `shot-${s.active}`, ok: true, hidden: true });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${outDir}p2-arena-${s.active}.png` });
    shots++;
  }

  const near = s.enemies.sort((a, b) => Math.abs(a.x - s.x) - Math.abs(b.x - s.x))[0];
  const keys = [];
  let attack = false;
  // esporo vindo: corta
  const spore = s.hazards.find((z) => z.kind === 'spore' && Math.abs(z.x - s.x) < 70 && z.y > s.y - 100);
  if (!near) {
    keys.push('KeyD');
  } else {
    const dx = near.x - s.x;
    const dir = Math.sign(dx) || 1;
    const dist = Math.abs(dx);
    const reach = near.w / 2 + 38;
    const danger = ['windup', 'lunge', 'swoop'].includes(near.state) || (near.type === 'kaiju' && near.state === 'windup');
    if (real && danger && near.type !== 'bat' && dist < 330) {
      // sem invencibilidade: recua ou pula as ondas
      keys.push(dir > 0 ? 'KeyA' : 'KeyD');
      if (near.type === 'kaiju' && s.onGround) keys.push('Space');
    } else if (near.type === 'bat' && near.y < s.y - 90) {
      // morcego no alto: fica embaixo dele e pula golpeando
      if (dist > 30) keys.push(dir > 0 ? 'KeyD' : 'KeyA');
      if (dist < 70 && s.onGround) keys.push('Space');
      if (dist < 70 && !s.onGround) attack = true;
    } else if (dist > reach) {
      keys.push(dir > 0 ? 'KeyD' : 'KeyA');
    } else {
      if (s.facing !== dir) keys.push(dir > 0 ? 'KeyD' : 'KeyA');
      attack = true;
    }
    if (real && s.hazards.some((z) => z.kind === 'shockwave' && Math.abs(z.x - s.x) < 90) && s.onGround) keys.push('Space');
  }
  if (spore) attack = true;
  await hold(keys);
  if (attack) await page.keyboard.press('KeyF');
  await page.waitForTimeout(40);
}
await hold([]);
await page.waitForFunction(() => window.game.scene.isActive('end'), null, { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(900);
await page.screenshot({ path: `${outDir}p2-final.png` });
const end = await page.evaluate(() => {
  const e = window.game.scene.getScene('end');
  return { active: window.game.scene.isActive('end'), result: e?.result ?? null, label: e?.next?.label };
});

if (!real) {
  check('robô derrota todos os inimigos e entra no Castelo Azul', end.result?.outcome === 'victory' && end.result?.phase === 2, JSON.stringify(end.result));
  check('vencer a Fase 2 leva à Fase 3', /Fase 3/.test(end.label ?? ''), end.label);
  for (const k of ['spore', 'lavabolt', 'shockwave', 'fire']) check(`perigo apareceu: ${k}`, seenHazards.has(k));
  for (const k of ['stomp', 'bolts']) check(`Colosso usou: ${k}`, seenAttacks.has(k));
  check('Colosso ficou furioso na metade da vida', enraged);
}
// 3) atrás do Colosso: ele usa a rabada (e ela machuca)
await page.evaluate(() => window.game.scene.getScene('end').scene.start('play', { phase: 2 }));
await page.waitForFunction(() => window.game.scene.isActive('play'));
await page.waitForTimeout(400);
await page.evaluate(() => {
  const sc = window.game.scene.getScene('play');
  sc.hero.sprite.body.reset(7300, 420); // entra na cratera
});
await page.waitForFunction(() => window.game.scene.getScene('play').run.active === 'cratera', null, { timeout: 5000 });
const tail = await page.evaluate(async () => {
  const sc = window.game.scene.getScene('play');
  const k = sc.enemies.find((e) => e.type === 'kaiju');
  const behindX = k.sprite.x - k.brain.facing * 140; // atrás dele, perto
  sc.hero.sprite.body.reset(behindX, 420);
  const hp0 = sc.hero.fighter.hp;
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 50));
    if (k.out.attack === 'tail' && k.out.state === 'active') break;
  }
  await new Promise((r) => setTimeout(r, 200));
  return { attack: k.out.attack, hp0, hp: sc.hero.fighter.hp };
});
await page.screenshot({ path: `${outDir}p2-rabada.png` });
check('atrás do Colosso: ele usa a rabada e ela machuca', tail.attack === 'tail' && tail.hp < tail.hp0, JSON.stringify(tail));

await browser.close();
server.close();

for (const r of results.filter((r) => !r.hidden)) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}  ${r.detail ? `(${r.detail})` : ''}`);
if (real) console.log('robô sem invencibilidade:', JSON.stringify({ seconds: Math.round((Date.now() - t0) / 1000), resultado: end.result, ultimo: last && { x: Math.round(last.x), hp: last.hp, vidas: last.lives, arena: last.active } }));
console.log(errors.length ? `erros no console: ${errors.slice(0, 3).join(' | ')}` : 'sem erros no console');
process.exit(results.every((r) => r.ok) && !errors.length ? 0 : 1);
