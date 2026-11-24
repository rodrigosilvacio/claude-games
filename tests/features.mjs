// Testa no navegador: setas do teclado, coleta de maçã (+1 vida) e renascimento.
// Uso: node tests/features.mjs
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { serve } from '../tools/serve.mjs';

const { chromium } = await import('playwright').catch(() => createRequire(import.meta.url)('playwright'));
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
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.game.scene.isActive('play'));
await page.waitForTimeout(600);

const st = () =>
  page.evaluate(() => {
    const s = window.game.scene.getScene('play');
    return {
      x: Math.round(s.hero.x),
      y: Math.round(s.hero.sprite.y),
      alive: s.hero.alive,
      hp: s.hero.fighter.hp,
      lives: s.run.lives,
      active: s.run.active,
      fruits: s.pickups.getChildren().filter((f) => f.active).length,
      hud: window.game.scene.getScene('hud').livesText.text,
    };
  });
const results = [];
const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail });

// 1) setas: → anda, ↑ pula para a plataforma e pega a maçã
const before = await st();
await page.keyboard.down('ArrowRight');
await page.waitForFunction(() => window.game.scene.getScene('play').hero.x > 520);
await page.keyboard.down('ArrowUp');
await page.waitForTimeout(260);
await page.keyboard.up('ArrowUp');
await page.waitForFunction(() => window.game.scene.getScene('play').hero.x > 640, null, { timeout: 4000 }).catch(() => {});
await page.keyboard.up('ArrowRight');
await page.waitForTimeout(700);
const afterApple = await st();
await page.screenshot({ path: `${outDir}feat-maca.png` });
check('seta → move o herói', afterApple.x > before.x + 300, `${before.x} → ${afterApple.x}`);
check('maçã coletada', afterApple.fruits === before.fruits - 1, `${before.fruits} → ${afterApple.fruits}`);
check('maçã vale +1 vida', afterApple.lives === before.lives + 1, `${before.lives} → ${afterApple.lives}`);
check('HUD mostra as vidas', afterApple.hud === `× ${afterApple.lives}`, afterApple.hud);

// 2) seta ← também move
await page.keyboard.down('ArrowLeft');
await page.waitForTimeout(400);
await page.keyboard.up('ArrowLeft');
const afterLeft = await st();
check('seta ← move o herói', afterLeft.x < afterApple.x - 40, `${afterApple.x} → ${afterLeft.x}`);

// 3) cair numa arena: perde uma vida e renasce na entrada
await page.keyboard.down('ArrowRight');
await page.waitForFunction(() => window.game.scene.getScene('play').run.active === 'clareira', null, { timeout: 8000 });
await page.keyboard.up('ArrowRight');
await page.evaluate(() => (window.game.scene.getScene('play').hero.fighter.hp = 1));
const livesBefore = (await st()).lives;
await page.waitForFunction(() => !window.game.scene.getScene('play').hero.alive, null, { timeout: 15000 });
await page.screenshot({ path: `${outDir}feat-caiu.png` });
await page.waitForFunction(() => window.game.scene.getScene('play').hero.alive, null, { timeout: 5000 });
await page.waitForTimeout(400);
const reborn = await st();
await page.screenshot({ path: `${outDir}feat-renasceu.png` });
check('perde uma vida ao cair', reborn.lives === livesBefore - 1, `${livesBefore} → ${reborn.lives}`);
check('renasce com energia cheia', reborn.hp === 100, reborn.hp);
check('renasce na entrada da arena, cercas abertas', reborn.x < 900 && reborn.active === null, `x=${reborn.x} arena=${reborn.active}`);

// 4) volta a lutar: a arena fecha de novo ao entrar
await page.keyboard.down('KeyD');
await page.waitForFunction(() => window.game.scene.getScene('play').run.active === 'clareira', null, { timeout: 8000 }).catch(() => {});
await page.keyboard.up('KeyD');
check('arena pode ser tentada de novo (tecla D)', (await st()).active === 'clareira');

await browser.close();
server.close();
for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}  (${r.detail ?? ''})`);
console.log(errors.length ? `erros no console: ${errors.join(' | ')}` : 'sem erros no console');
process.exit(results.every((r) => r.ok) && !errors.length ? 0 : 1);
