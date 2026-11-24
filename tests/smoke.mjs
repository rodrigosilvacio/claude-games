// Smoke test + robô que joga a partida inteira (skill `phaser-core`, seção Verify).
// Uso: node tests/smoke.mjs [--strategy=smart|spam] [--headed]
// Falha se houver erro de página ou se o robô "smart" não chegar ao castelo.
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { serve } from '../tools/serve.mjs';

// usa o Playwright do projeto (npm i -D playwright) ou o global da máquina
const { chromium } = await import('playwright').catch(() => createRequire(import.meta.url)('playwright'));

const strategy = (process.argv.find((a) => a.startsWith('--strategy=')) ?? '--strategy=smart').split('=')[1];
const outDir = new URL('./output/', import.meta.url).pathname;
await mkdir(outDir, { recursive: true });

const server = await serve(0);
const url = `http://localhost:${server.address().port}/index.html`;
const browser = await chromium.launch({ headless: !process.argv.includes('--headed') });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

const shot = (name) => page.screenshot({ path: `${outDir}${name}.png` });

await page.goto(url);
await page.waitForFunction(() => window.game?.isRunning, null, { timeout: 15000 });
await page.waitForFunction(() => window.game.scene.isActive('title'), null, { timeout: 10000 });
await page.waitForTimeout(500);
await shot('01-titulo');
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.game.scene.isActive('play') && window.game.scene.isActive('hud'));
await page.waitForTimeout(1200);
await shot('02-inicio');

const state = () =>
  page.evaluate(() => {
    const s = window.game.scene.getScene('play');
    if (!s?.hero || !window.game.scene.isActive('play')) return { over: true };
    return {
      over: false,
      ended: s.ended,
      x: s.hero.x,
      hp: s.hero.fighter.hp,
      facing: s.hero.facing,
      onGround: s.hero.sprite.body.blocked.down,
      active: s.run.active,
      arena: s.run.active ? (({ x0, x1 }) => ({ x0, x1 }))(s.level.encounters.find((e) => e.id === s.run.active)) : null,
      kills: s.run.kills,
      dinos: s.dinos
        .filter((d) => d.alive)
        .map((d) => ({ x: d.sprite.x, state: d.brain.state, enc: d.encounter.id, type: d.type, w: d.sprite.body.width })),
    };
  });

const held = new Set();
async function hold(keys) {
  for (const k of held) if (!keys.includes(k)) { await page.keyboard.up(k); held.delete(k); }
  for (const k of keys) if (!held.has(k)) { await page.keyboard.down(k); held.add(k); }
}

const shots = new Set();
const t0 = Date.now();
let last;
while (Date.now() - t0 < 300_000) {
  const s = await state();
  if (s.over || s.ended) break;
  if (process.env.TRACE && s.active === 'portao') {
    const r = s.dinos.find((d) => d.type === 'rex');
    console.error(Date.now() - t0, 'hp', s.hp, 'x', Math.round(s.x), 'air', !s.onGround, r ? `rex ${r.state} dx ${Math.round(r.x - s.x)}` : '-');
  }
  last = s;
  if (s.active && !shots.has(s.active)) {
    shots.add(s.active);
    await page.waitForTimeout(250);
    await shot(`03-arena-${s.active}`);
  }

  const near = s.dinos
    .filter((d) => d.enc === s.active)
    .sort((a, b) => Math.abs(a.x - s.x) - Math.abs(b.x - s.x))[0];
  const keys = [];
  let attack = false;
  if (!near) {
    keys.push('KeyD');
  } else {
    const dx = near.x - s.x;
    const dist = Math.abs(dx);
    const dir = Math.sign(dx);
    const reach = near.w / 2 + 40;
    const danger = near.state === 'windup' || near.state === 'lunge';
    const arena = s.active && near.enc === s.active;
    const backX = s.x - dir * 140;
    const cornered = arena && (backX < s.arena.x0 + 30 || backX > s.arena.x1 - 30);
    if (strategy === 'smart' && danger && dist < 330) {
      if (cornered) {
        // encurralado: espera o bote e pula por cima
        if (near.state === 'lunge' && dist < 240) keys.push(dir > 0 ? 'KeyD' : 'KeyA', 'Space');
      } else {
        keys.push(dir > 0 ? 'KeyA' : 'KeyD'); // recua do bote
      }
    } else if (dist > reach) {
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
await shot('04-fim-de-fase');
await page.waitForFunction(() => window.game.scene.isActive('end'), null, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(800);
await shot('05-resultado');

const result = await page.evaluate(() => {
  const e = window.game.scene.getScene('end');
  return { scenes: window.game.scene.getScenes(true).map((x) => x.sys.settings.key), result: e?.result ?? null };
});
await browser.close();
server.close();

const report = { strategy, seconds: Math.round((Date.now() - t0) / 1000), last, ...result, errors };
console.log(JSON.stringify(report, null, 2));
const ok = errors.length === 0 && (strategy !== 'smart' || result.result?.outcome === 'victory');
process.exit(ok ? 0 : 1);
