// Fase 4 no navegador: história, terremotos, resgates, dois titãs, usina, baforada e portal.
// Uso: node tests/phase4.mjs            (robô invencível: prova que tudo funciona até o portal)
//      node tests/phase4.mjs --real     (robô sem invencibilidade: só mede a dificuldade, não falha)
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

// 1) vencer a Fase 3 leva à história e depois à Fase 4, com as vidas
await page.evaluate(() =>
  window.game.scene.getScene('title').scene.start('end', { outcome: 'victory', phase: 3, kills: 9, total: 9, timeMs: 90000, hp: 80, lives: 6 }),
);
await page.waitForFunction(() => window.game.scene.isActive('end'));
await page.waitForTimeout(900);
const label = await page.evaluate(() => window.game.scene.getScene('end').next?.label);
check('tela da Fase 3 concluída oferece a Fase 4', /Fase 4/.test(label ?? ''), label);
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.game.scene.isActive('story'));
let pages = 0;
while (await page.evaluate(() => window.game.scene.isActive('story'))) {
  pages++;
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  if (pages > 6) break;
}
check('a história tem 3 quadros antes da fase', pages === 3, `${pages} quadros`);
await page.waitForFunction(() => window.game.scene.isActive('play'));
await page.waitForTimeout(500);
const start = await page.evaluate(() => {
  const s = window.game.scene.getScene('play');
  return { phase: s.phase, lives: s.run.lives, shield: s.hero.hasShield };
});
check('Fase 4 começa com as vidas da Fase 3 e com o escudo', start.phase === 4 && start.lives === 6 && start.shield, JSON.stringify(start));

if (!real) await page.evaluate(() => (window.__god = true));
const held = new Set();
async function hold(keys) {
  for (const k of held) if (!keys.includes(k)) { await page.keyboard.up(k); held.delete(k); }
  for (const k of keys) if (!held.has(k)) { await page.keyboard.down(k); held.add(k); }
}

const t0 = Date.now();
let last;
const shots = new Set();
let sawCutscene = false;
while (Date.now() - t0 < 420_000) {
  const s = await page.evaluate(() => {
    const sc = window.game.scene.getScene('play');
    if (!window.game.scene.isActive('play') || !sc?.hero) return { over: true };
    if (window.__god) sc.hero.fighter.invulnUntil = sc.time.now + 1e9;
    const h = sc.hero;
    return {
      over: false,
      ended: !!sc.run.outcome,
      x: h.x,
      y: h.sprite.y,
      onGround: h.sprite.body.blocked.down,
      facing: h.facing,
      hp: h.fighter.hp,
      lives: sc.run.lives,
      active: sc.run.active,
      quake: sc.activeQuake?.cfg.id ?? null,
      cutscene: sc.cutscene,
      trapped: sc.trapped.filter((t) => !t.freed).map((t) => t.pile.x),
      hazards: sc.hazards.filter((z) => !z.dead).map((z) => ({ kind: z.kind, x: z.sprite.x, y: z.sprite.y })),
      boss: sc.enemies
        .filter((e) => e.alive && e.encounter.id === sc.run.active)
        .map((e) => ({ type: e.type, x: e.sprite.x, w: e.sprite.body.width, state: e.brain.state, attack: e.out?.attack, facing: e.out?.facing }))[0],
    };
  });
  if (s.over || s.ended) break;
  last = s;
  if (s.cutscene) sawCutscene = true;
  const tag = s.quake ?? s.active ?? (s.cutscene ? 'usina-cena' : null);
  if (tag && !shots.has(tag)) {
    shots.add(tag);
    await page.waitForTimeout(tag === 'usina-cena' ? 1900 : 1800);
    await page.screenshot({ path: `${outDir}p4-${tag}.png` });
  }

  const keys = [];
  let attack = false;
  const rockAbove = s.hazards.some((z) => z.kind === 'rock' && Math.abs(z.x - s.x) < 60 && z.y < s.y);
  const beam = s.hazards.some((z) => z.kind === 'beam');
  const spikeNear = s.hazards.some((z) => (z.kind === 'spike' || z.kind === 'shockwave') && Math.abs(z.x - s.x) < 90);
  const trapped = s.trapped.find((x) => Math.abs(x - s.x) < 160);
  if (s.cutscene) {
    // parado assistindo
  } else if (trapped !== undefined && !s.quake && !s.active) {
    const dx = trapped - s.x;
    const dir = Math.sign(dx) || 1;
    if (Math.abs(dx) > 60) keys.push(dir > 0 ? 'KeyD' : 'KeyA');
    else {
      if (s.facing !== dir) keys.push(dir > 0 ? 'KeyD' : 'KeyA'); // vira para os escombros
      attack = true;
    }
  } else if (s.quake) {
    if (rockAbove) keys.push('KeyS');
    if (real && spikeNear && s.onGround) keys.push('Space');
  } else if (s.boss) {
    const dx = s.boss.x - s.x;
    const dir = Math.sign(dx) || 1;
    if (beam && s.boss.facing === -dir) {
      keys.push('KeyS'); // de frente para a baforada
      if (s.facing !== dir) keys.push(dir > 0 ? 'KeyD' : 'KeyA');
    } else if (rockAbove) {
      keys.push('KeyS');
    } else if (real && spikeNear && s.onGround) {
      keys.push('Space');
    } else if (Math.abs(dx) > s.boss.w / 2 + 30) {
      keys.push(dir > 0 ? 'KeyD' : 'KeyA');
    } else {
      if (s.facing !== dir) keys.push(dir > 0 ? 'KeyD' : 'KeyA');
      attack = true;
    }
  } else {
    keys.push('KeyD');
  }
  await hold(keys);
  if (attack) await page.keyboard.press('KeyF');
  await page.waitForTimeout(40);
}
await hold([]);

// 2) final: o portal e a mensagem
const finale = await page
  .waitForFunction(() => window.game.scene.getScene('play')?.finale?.stage === 'done', null, { timeout: 15000 })
  .then(() => true)
  .catch(() => false);
await page.screenshot({ path: `${outDir}p4-portal-final.png` });
const fin = await page.evaluate(() => {
  const sc = window.game.scene.getScene('play');
  return {
    stage: sc.finale?.stage,
    text: sc.finaleText?.text,
    textVisible: !!sc.finaleText?.visible && sc.finaleText.alpha > 0.9,
    portalOpen: !!sc.portal && sc.portal.alpha > 0.9,
    plantBroken: sc.plant?.texture.key === 'powerplantBroken',
    counters: sc.counters,
    outcome: sc.run.outcome,
    kills: sc.run.kills,
    total: sc.run.total,
    lives: sc.run.lives,
    hp: sc.hero.fighter.hp,
  };
});

if (!real) {
  check('os dois terremotos aconteceram', fin.counters?.quakes === 2, JSON.stringify(fin.counters));
  check('o escudo protegeu (pedras e baforada)', fin.counters?.blocked >= 2, `${fin.counters?.blocked} bloqueios`);
  check('os 3 moradores presos foram resgatados', fin.counters?.rescued === 3, `${fin.counters?.rescued}`);
  check('a usina sobrecarregou na cena', sawCutscene && fin.plantBroken);
  check('venceu os dois titãs', fin.outcome === 'victory' && fin.kills === 2 && fin.total === 2, `${fin.kills}/${fin.total}`);
  check('o portal abriu e o Pepe entrou', finale && fin.portalOpen);
  check('mensagem "Seja bem-vindo ao novo mundo, você é demais!"', fin.text === 'Seja bem-vindo ao novo mundo, você é demais!' && fin.textVisible, fin.text);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.game.scene.isActive('end'), null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${outDir}p4-tela-final.png` });
  const end = await page.evaluate(() => ({ phase: window.game.scene.getScene('end')?.result?.phase, label: window.game.scene.getScene('end')?.next?.label }));
  check('Enter leva à tela final da jornada', end.phase === 4 && end.label === 'Enter: jogar de novo', JSON.stringify(end));
}
await browser.close();
server.close();

for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}  ${r.detail ? `(${r.detail})` : ''}`);
if (process.env.DEBUG) console.log('último estado:', JSON.stringify(last), 'segundos:', Math.round((Date.now() - t0) / 1000));
if (real) console.log('robô sem invencibilidade:', JSON.stringify({ seconds: Math.round((Date.now() - t0) / 1000), resultado: fin.outcome, vidas: fin.lives, energia: fin.hp, titas: `${fin.kills}/${fin.total}`, contadores: fin.counters, ultimo: last && { x: Math.round(last.x), arena: last.active, vidas: last.lives } }));
console.log(errors.length ? `erros no console: ${[...new Set(errors)].slice(0, 3).join(' | ')}` : 'sem erros no console');
process.exit(results.every((r) => r.ok) && !errors.length ? 0 : 1);
