import Hero, { MOVE } from '../entities/Hero.js';
import Dino from '../entities/Dino.js';
import { Bat, Plant, Kaiju } from '../entities/Monsters.js';
import { HERO } from '../rules/combat.js';
import {
  LEVELS,
  GROUND_Y,
  START_LIVES,
  createRun,
  tryStartEncounter,
  recordKill,
  canEnterCastle,
  progress,
  gainLife,
  loseLife,
  respawnPoint,
} from '../rules/level.js';

// Visual de cada fase. As texturas vêm de src/art/textures.js (dia) e src/art/night.js (noite).
const THEMES = {
  day: {
    sky: 'sky',
    rays: true,
    clouds: true,
    mist: false,
    layers: [
      { key: 'mountains', y: 140, h: 300, f: 0.08, depth: -8 },
      { key: 'hills', y: 255, h: 220, f: 0.22, depth: -6 },
      { key: 'forest', y: GROUND_Y - 225, h: 260, f: 0.5, depth: -5 },
    ],
    castleFar: { key: 'castleFar', y: 400, scale: 0.32 },
    castle: 'castle',
    tree: 'tree',
    bush: 'bush',
    ground: 'ground',
    ledge: 'ledge',
    motes: { tint: [0xffffff], y: [120, 460] },
    shade: null,
  },
  night: {
    sky: 'sky2',
    rays: false,
    clouds: false,
    mist: true,
    layers: [
      { key: 'far2', y: 130, h: 300, f: 0.08, depth: -8 },
      { key: 'mid2', y: 250, h: 220, f: 0.22, depth: -6 },
      { key: 'forest2', y: GROUND_Y - 225, h: 260, f: 0.5, depth: -5 },
    ],
    castleFar: { key: 'castleFar2', y: 330, scale: 0.26 },
    castle: 'castle2',
    tree: 'tree2',
    bush: 'shrooms',
    ground: 'ground2',
    ledge: 'ledge2',
    motes: { tint: [0xd8ff80, 0xa8f0ff, 0xfff0a0], y: [200, 460] }, // vaga-lumes
    shade: { color: 0x101438, alpha: 0.2 },
  },
};

function createEnemy(scene, type, x, enc) {
  if (type === 'bat') return new Bat(scene, x, enc);
  if (type === 'plant') return new Plant(scene, x, enc);
  if (type === 'kaiju') return new Kaiju(scene, x, enc);
  return new Dino(scene, type, x, GROUND_Y, enc);
}

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super('play');
  }

  init(data = {}) {
    // estado zerado a cada (re)início: a instância da cena é reaproveitada
    this.phase = LEVELS[data.phase] ? data.phase : 1;
    this.level = LEVELS[this.phase];
    this.theme = THEMES[this.level.theme];
    this.run = createRun(this.level, data.lives ?? START_LIVES);
    this.enemies = [];
    this.hazards = [];
    this.fences = new Map();
    this.hitStopUntil = 0;
    this.ended = false;
    this.prevJumpHeld = false;
  }

  // nome antigo, usado pelos testes de navegador
  get dinos() {
    return this.enemies;
  }

  create() {
    const W = this.scale.width;
    const L = this.level;
    this.physics.world.setBounds(0, 0, L.worldWidth, 600);
    this.physics.world.gravity.y = MOVE.gravity;
    this.cameras.main.setBounds(0, 0, L.worldWidth, 540);

    this.buildBackdrop(W);
    this.buildWorld();

    this.hero = new Hero(this, L.heroStartX, GROUND_Y);
    this.heroShadow = this.add.image(0, 0, 'shadow').setDepth(6);
    this.lastGroundY = GROUND_Y;
    this.physics.add.collider(this.hero.sprite, this.solids);
    this.physics.add.collider(this.hero.sprite, this.fenceGroup);

    for (const enc of L.encounters) {
      for (const sp of enc.spawns) {
        const e = createEnemy(this, sp.type, sp.x, enc);
        e.shadow = this.add.image(sp.x, GROUND_Y + 2, 'shadow').setDepth(6).setScale(e.stats.body.w / 50, 1.3);
        if (sp.type === 'bat') e.shadow.setAlpha(0.45);
        this.enemies.push(e);
      }
    }
    const walkers = this.enemies.filter((e) => e instanceof Dino).map((e) => e.sprite);
    this.physics.add.collider(walkers, this.solids);
    this.physics.add.collider(walkers, this.fenceGroup);
    const boss = this.enemies.find((e) => e instanceof Kaiju);
    if (boss) this.physics.add.collider(boss.sprite, this.fenceGroup);

    this.physics.add.overlap(this.hero.sprite, this.pickups, (_h, fruit) => this.collectFruit(fruit));

    this.cameras.main.startFollow(this.hero.sprite, true, 0.1, 0.1, -60, 60);
    this.cameras.main.setDeadzone(120, 160);

    this.setupInput();
    this.setupFx();

    this.run.startedAt = this.time.now;
    this.syncRegistry();
    if (!this.scene.isActive('hud')) this.scene.launch('hud');
    const intro = this.phase === 1 ? 'Rumo ao castelo!  →' : `Fase ${this.phase}: ${L.name}`;
    this.registry.set('banner', { text: intro, ms: 2400 });
    this.events.once('shutdown', () => this.input.keyboard.removeAllKeys(true));
  }

  // ------------------------------------------------------------ cenário

  buildBackdrop(W) {
    const T = this.theme;
    this.add.image(0, 0, T.sky).setOrigin(0).setScrollFactor(0).setDepth(-10);
    if (T.rays) {
      this.rays = this.add.image(0, 0, 'rays').setOrigin(0).setScrollFactor(0).setDepth(-4).setBlendMode('ADD');
      this.tweens.add({ targets: this.rays, alpha: 0.45, yoyo: true, repeat: -1, duration: 4200, ease: 'Sine.inOut' });
    }
    if (T.shade) this.add.rectangle(0, 0, W, 540, T.shade.color, T.shade.alpha).setOrigin(0).setScrollFactor(0).setDepth(55);
    this.add.image(0, 0, 'vignette').setOrigin(0).setScrollFactor(0).setDepth(60);
    this.add.particles(0, 0, 'mote', {
      x: { min: 0, max: W },
      y: { min: T.motes.y[0], max: T.motes.y[1] },
      lifespan: 6000,
      speedX: { min: -14, max: 14 },
      speedY: { min: -18, max: -4 },
      scale: { min: 0.4, max: 1 },
      alpha: { start: 0.9, end: 0 },
      tint: T.motes.tint,
      frequency: T.mist ? 160 : 260,
      blendMode: 'ADD',
    }).setScrollFactor(0).setDepth(50);

    this.clouds = [];
    if (T.clouds) {
      for (let i = 0; i < 5; i++) {
        const c = this.add
          .image(i * 260 + 60, 50 + (i % 3) * 38, i % 2 ? 'cloud2' : 'cloud')
          .setScrollFactor(0)
          .setScale(0.6 + (i % 2) * 0.3)
          .setAlpha(0.95)
          .setDepth(-9);
        c.speed = 6 + i * 2;
        this.clouds.push(c);
      }
    }
    this.layers = T.layers.map((l) => {
      const ts = this.add.tileSprite(0, l.y, W, l.h, l.key).setOrigin(0).setScrollFactor(0).setDepth(l.depth);
      ts.factor = l.f;
      return ts;
    });
    // castelo no horizonte: aproxima devagar ao longo da jornada
    const cf = T.castleFar;
    this.add.image(880, cf.y, cf.key).setOrigin(0.5, 1).setScale(cf.scale).setScrollFactor(0.025).setDepth(-7);
    if (T.mist) {
      this.mist = this.add.tileSprite(0, GROUND_Y - 140, W, 160, 'mist').setOrigin(0).setScrollFactor(0).setDepth(-3);
      this.mistFront = this.add.tileSprite(0, GROUND_Y - 70, W, 160, 'mist').setOrigin(0).setScrollFactor(0).setDepth(52).setAlpha(0.22);
    }

    // árvores e arbustos na mesma camada do herói (fundo próximo)
    const r = Phaser.Math.RND;
    r.sow([`floresta-${this.phase}`]);
    const gap = this.theme === THEMES.night ? 260 : 380; // floresta sombria é mais fechada
    for (let x = 300; x < this.level.castleGateX - 500; x += gap + r.between(0, 240)) {
      this.add.image(x, GROUND_Y + 6, T.tree).setOrigin(0.5, 1).setDepth(-2).setScale(r.realInRange(0.8, 1.15)).setFlipX(r.frac() > 0.5);
    }
    for (let x = 120; x < this.level.worldWidth; x += 260 + r.between(0, 220)) {
      this.add.image(x, GROUND_Y + 14, T.bush).setOrigin(0.5, 1).setDepth(-1).setScale(r.realInRange(0.6, 0.9));
    }
  }

  buildWorld() {
    const T = this.theme;
    const L = this.level;
    this.solids = this.physics.add.staticGroup();
    const ground = this.add.tileSprite(0, GROUND_Y, L.worldWidth, 96, T.ground).setOrigin(0).setDepth(5);
    this.physics.add.existing(ground, true);
    this.solids.add(ground);

    for (const l of L.ledges) {
      const ledge = this.add.tileSprite(l.x, l.y, l.w, 34, T.ledge).setOrigin(0).setDepth(4);
      this.physics.add.existing(ledge, true);
      ledge.body.checkCollision.down = false; // dá para subir por baixo
      ledge.body.checkCollision.left = ledge.body.checkCollision.right = false;
      this.solids.add(ledge);
    }

    this.pickups = this.physics.add.staticGroup();
    for (const p of L.pickups) {
      const f = this.pickups.create(p.x, p.y, 'fruit').setDepth(8);
      this.tweens.add({ targets: f, y: p.y - 6, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.inOut' });
    }

    this.castle = this.add.image(L.castleGateX, GROUND_Y + 8, T.castle).setOrigin(0.5, 1).setDepth(-1);
    this.fenceGroup = this.physics.add.staticGroup();
  }

  // ------------------------------------------------------------ input

  setupInput() {
    const K = Phaser.Input.Keyboard.KeyCodes;
    // Mão esquerda na fileira ASDFG (A/D movem, Espaço pula, F ou G atacam) ou setas (← → movem, ↑ pula).
    this.keys = this.input.keyboard.addKeys({
      a: K.A, d: K.D, space: K.SPACE, f: K.F, g: K.G, left: K.LEFT, right: K.RIGHT, up: K.UP,
    });
    this.mouseAttack = false;
    if (!this.sys.game.device.input.touch) {
      this.input.on('pointerdown', (p) => { if (p.leftButtonDown()) this.mouseAttack = true; });
    }
  }

  readInput() {
    const k = this.keys;
    const t = this.registry.get('touch') ?? {};
    const JD = Phaser.Input.Keyboard.JustDown;
    const jumpHeld = k.space.isDown || k.up.isDown || !!t.jump;
    const jumpKeyDown = JD(k.space) | JD(k.up);
    const attackKeyDown = JD(k.f) | JD(k.g);
    const input = {
      left: k.a.isDown || k.left.isDown || !!t.left,
      right: k.d.isDown || k.right.isDown || !!t.right,
      jumpHeld,
      jumpPressed: !!jumpKeyDown || (!!t.jump && !this.prevJumpHeld),
      jumpReleased: !jumpHeld && this.prevJumpHeld,
      attackPressed: !!attackKeyDown || this.mouseAttack || !!t.attackPressed,
    };
    this.prevJumpHeld = jumpHeld;
    this.mouseAttack = false;
    if (t.attackPressed) t.attackPressed = false;
    return input;
  }

  // ------------------------------------------------------------ juice

  setupFx() {
    this.sparks = this.add.particles(0, 0, 'spark', {
      speed: { min: 120, max: 320 },
      lifespan: 320,
      scale: { start: 0.8, end: 0 },
      tint: [0xffffff, 0xffe14a, 0xffb13b],
      emitting: false,
    }).setDepth(30);
    this.dust = this.add.particles(0, 0, 'dust', {
      speedX: { min: -80, max: 80 },
      speedY: { min: -60, max: -10 },
      lifespan: 380,
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.8, end: 0 },
      emitting: false,
    }).setDepth(16);
    this.leaves = this.add.particles(0, 0, 'pixel', {
      speedX: { min: -140, max: 140 },
      speedY: { min: -260, max: -60 },
      gravityY: 500,
      lifespan: 900,
      scale: { min: 1, max: 2 },
      tint: [0x63b548, 0x86cf5c, 0xe8b84a],
      emitting: false,
    }).setDepth(30);
    this.embers = this.add.particles(0, 0, 'spark', {
      speedX: { min: -160, max: 160 },
      speedY: { min: -320, max: -80 },
      gravityY: 600,
      lifespan: 700,
      scale: { start: 0.7, end: 0 },
      tint: [0xffd060, 0xff8a2a, 0xff4a1a],
      emitting: false,
    }).setDepth(30);

    this.events.on('hero-landed', (x, y) => this.dust.explode(6, x, y));
    this.events.on('hero-jumped', (x, y) => this.dust.explode(4, x, y));
    // o chefe é gigante: cada golpe dele mexe a tela
    this.events.on('kaiju-stomp', (x) => {
      this.cameras.main.shake(320, 0.014);
      this.dust.explode(18, x, GROUND_Y);
      this.embers.explode(12, x, GROUND_Y - 10);
    });
    this.events.on('kaiju-roar', () => this.cameras.main.shake(260, 0.006));
    this.events.on('kaiju-tail', () => this.cameras.main.shake(160, 0.008));
    this.events.on('hazard-ground', (kind, x) => {
      if (kind === 'lavabolt') {
        this.embers.explode(10, x, GROUND_Y - 6);
        this.cameras.main.shake(80, 0.004);
      } else {
        this.leaves.explode(5, x, GROUND_Y - 6);
      }
    });
  }

  hitStop(ms) {
    this.physics.pause();
    this.hitStopUntil = this.time.now + ms;
    this.time.delayedCall(ms, () => {
      if (!this.ended || this.hero.alive) this.physics.resume();
    });
  }

  popText(x, y, text, color = '#ffffff', size = 22) {
    const t = this.add
      .text(x, y, text, { fontFamily: 'Trebuchet MS, Verdana, sans-serif', fontSize: `${size}px`, fontStyle: 'bold', color, stroke: '#1d1d28', strokeThickness: 5 })
      .setOrigin(0.5)
      .setDepth(40);
    this.tweens.add({ targets: t, y: y - 46, alpha: 0, duration: 750, ease: 'Cubic.out', onComplete: () => t.destroy() });
  }

  // ------------------------------------------------------------ regras em jogo

  collectFruit(fruit) {
    if (!fruit.active) return;
    this.tweens.killTweensOf(fruit);
    fruit.disableBody(true, true);
    if (gainLife(this.run)) {
      this.popText(fruit.x, fruit.y - 10, '+1 VIDA', '#7dff8a');
    } else {
      // vidas no máximo: a maçã ainda vale energia
      const gained = this.hero.heal(30);
      this.popText(fruit.x, fruit.y - 10, gained ? `+${gained}` : 'Vidas no máximo', '#7dff8a', 18);
    }
    this.leaves.explode(10, fruit.x, fruit.y);
    this.syncRegistry();
  }

  bossBar(e) {
    this.registry.set('boss', e && e.alive ? { name: this.level.boss.name, ratio: e.fighter.hp / e.fighter.maxHp } : null);
  }

  checkEncounters() {
    if (this.run.active) return;
    const x = this.hero.x;
    for (const enc of this.level.encounters) {
      if (x > enc.x0 + 110 && x < enc.x1 && tryStartEncounter(this.run, enc.id)) {
        this.closeFences(enc);
        const msg = enc.boss ? this.level.boss.intro : `${enc.name}: derrote os ${this.level.enemyWord}!`;
        this.registry.set('banner', { text: msg, ms: 2200, danger: true });
        if (enc.boss) {
          this.cameras.main.shake(600, 0.014);
          this.bossBar(this.enemies.find((e) => e.stats.boss && e.encounter.id === enc.id));
        }
        return;
      }
    }
  }

  closeFences(enc) {
    const list = [];
    for (const x of [enc.x0, enc.x1]) {
      const f = this.fenceGroup.create(x, GROUND_Y + 4, 'fence').setOrigin(0.5, 1).setDepth(7);
      f.refreshBody();
      f.setScale(1, 0.01);
      this.tweens.add({ targets: f, scaleY: 1, duration: 260, ease: 'Back.out' });
      this.dust.explode(8, x, GROUND_Y);
      list.push(f);
    }
    this.fences.set(enc.id, list);
  }

  openFences(id) {
    for (const f of this.fences.get(id) ?? []) {
      f.disableBody(true, false);
      this.tweens.add({ targets: f, scaleY: 0, alpha: 0, duration: 300, onComplete: () => f.destroy() });
    }
    this.fences.delete(id);
  }

  resolveSword(now) {
    const box = this.hero.swordHitbox(now);
    if (!box) return;
    // a espada corta esporos no ar
    for (const hz of this.hazards) {
      if (hz.dead || !hz.destroyable) continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(box, hz.box())) continue;
      this.sparks.explode(8, hz.sprite.x, hz.sprite.y);
      this.popText(hz.sprite.x, hz.sprite.y - 16, 'corte!', '#c8ff9a', 16);
      hz.kill();
    }
    for (const d of this.enemies) {
      if (!d.alive || this.hero.attack.hitIds.has(d.id)) continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(box, d.bounds())) continue;
      this.hero.attack.hitIds.add(d.id);
      const r = d.takeHit(this.hero.x, now);
      if (!r.hit) continue;
      const c = d.bounds();
      this.sparks.explode(r.died ? 26 : 10, c.centerX - this.hero.facing * c.width * 0.3, c.centerY);
      this.popText(c.centerX, c.y - 10, `${r.amount}`, '#ffe14a');
      this.cameras.main.shake(r.died ? 220 : 90, r.died ? 0.01 : 0.004);
      this.hitStop(r.died ? 110 : 55);
      if (d.stats.boss) this.bossBar(d);
      if (r.died) this.onEnemyKilled(d);
    }
  }

  onEnemyKilled(d) {
    const enc = d.encounter;
    const cleared = recordKill(this.run, enc.id);
    this.popText(d.sprite.x, d.sprite.y - 60, `${d.stats.label} derrotado!`, '#ffffff', 18);
    if (d.stats.boss) {
      this.cameras.main.shake(700, 0.02);
      this.embers.explode(40, d.sprite.x, d.sprite.y);
    }
    if (cleared) {
      this.openFences(enc.id);
      const gained = this.hero.heal(HERO.clearHeal);
      if (gained > 0) this.time.delayedCall(500, () => this.popText(this.hero.x, this.hero.sprite.y - 80, `+${gained}`, '#7dff8a'));
      const msg = enc.boss ? 'O portão está livre! Entre no castelo!' : 'Caminho livre!  →';
      this.time.delayedCall(400, () => this.registry.set('banner', { text: msg, ms: 2000 }));
    }
    this.syncRegistry();
  }

  resolveAttacks(now) {
    if (!this.hero.alive) return;
    const hb = this.hero.sprite.body;
    const heroBox = new Phaser.Geom.Rectangle(hb.x, hb.y, hb.width, hb.height);
    const boxes = [];
    for (const d of this.enemies) if (d.alive) boxes.push(...d.attackBoxes(now));
    for (const hz of this.hazards) {
      if (!hz.dead) boxes.push({ rect: hz.box(), damage: hz.damage, fromX: hz.sprite.x, hazard: hz });
    }
    for (const a of boxes) {
      if (!Phaser.Geom.Intersects.RectangleToRectangle(heroBox, a.rect)) continue;
      const r = this.hero.takeHit(a.damage, a.fromX, now);
      a.onHit?.();
      if (a.hazard && !a.hazard.persistent) a.hazard.kill();
      if (!r.hit) continue;
      this.cameras.main.shake(160, 0.008);
      this.cameras.main.flash(120, 255, 60, 60, false);
      this.popText(this.hero.x, this.hero.sprite.y - 70, `-${r.amount}`, '#ff6b6b');
      this.syncRegistry();
      if (r.died) this.onHeroDied();
      return;
    }
  }

  onHeroDied() {
    this.ended = true;
    const left = loseLife(this.run);
    this.syncRegistry();
    if (left > 0) {
      const txt = left === 1 ? 'O herói caiu! Última vida...' : `O herói caiu! Restam ${left} vidas`;
      this.registry.set('banner', { text: txt, ms: 1500, danger: true });
      this.time.delayedCall(1500, () => this.respawn());
      return;
    }
    this.run.outcome = 'defeat';
    this.run.finishedAt = this.time.now;
    this.registry.set('banner', { text: 'Sem vidas...', ms: 1800, danger: true });
    this.time.delayedCall(1800, () => this.finish());
  }

  respawn() {
    const { x, encounterId } = respawnPoint(this.run, this.hero.x, this.level);
    for (const hz of this.hazards) hz.kill();
    this.hazards = [];
    if (encounterId) {
      this.openFences(encounterId);
      // inimigos da arena voltam ao começo; quem já levou golpes continua ferido
      for (const d of this.enemies) {
        if (d.alive && d.encounter.id === encounterId) d.resetBrain();
      }
      this.registry.set('boss', null);
    }
    this.hero.revive(x, GROUND_Y - 40, this.time.now);
    this.lastGroundY = GROUND_Y;
    this.cameras.main.flash(300, 255, 255, 255);
    this.ended = false;
    this.syncRegistry();
    this.registry.set('banner', { text: 'Tente de novo!  →', ms: 1500 });
  }

  checkCastle() {
    if (this.ended || !canEnterCastle(this.run, this.level) || this.hero.x < this.level.castleGateX - 30) return;
    this.ended = true;
    this.run.outcome = 'victory';
    this.run.finishedAt = this.time.now;
    this.hero.sprite.body.setVelocity(0, 0);
    this.cameras.main.flash(400, 255, 240, 200);
    this.tweens.add({ targets: [this.hero.sprite, this.hero.sword], alpha: 0, duration: 900 });
    this.time.delayedCall(1100, () => this.finish());
  }

  finish() {
    this.scene.stop('hud');
    this.scene.start('end', {
      outcome: this.run.outcome,
      phase: this.phase,
      kills: this.run.kills,
      total: this.run.total,
      timeMs: this.run.finishedAt - this.run.startedAt,
      hp: this.hero.fighter.hp,
      lives: this.run.lives,
    });
  }

  syncRegistry() {
    this.registry.set('hero', { hp: this.hero.fighter.hp, max: this.hero.fighter.maxHp });
    this.registry.set('kills', { kills: this.run.kills, total: this.run.total });
    this.registry.set('lives', this.run.lives);
  }

  // ------------------------------------------------------------ loop

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    const cam = this.cameras.main;
    for (const l of this.layers) l.tilePositionX = cam.scrollX * l.factor;
    if (this.mist) {
      this.mist.tilePositionX = cam.scrollX * 0.6 + time * 0.01;
      this.mistFront.tilePositionX = cam.scrollX * 1.2 - time * 0.015;
    }
    for (const c of this.clouds) {
      c.x -= c.speed * dt;
      if (c.x < -200) c.x = this.scale.width + 120;
    }

    if (time < this.hitStopUntil) return; // congelado pelo impacto

    const input = this.ended && this.hero.alive ? {} : this.readInput();
    if (!this.ended || !this.hero.alive) this.hero.update(input, time, dt);
    else this.hero.placeSword(time);

    const hs = this.hero.sprite;
    const ctx = { heroX: this.hero.x, heroY: hs.y, heroAlive: this.hero.alive, activeId: this.run.active, dtMs: delta, now: time };
    for (const d of this.enemies) {
      d.update(ctx);
      if (d.shadow) {
        if (d.sprite.active && d.alive) d.shadow.setPosition(d.sprite.x, GROUND_Y + 2);
        else d.shadow.setAlpha(d.sprite.active ? d.sprite.alpha * 0.5 : 0);
      }
    }
    for (const hz of this.hazards) if (!hz.dead) hz.update(dt);
    this.hazards = this.hazards.filter((hz) => !hz.dead);

    if (hs.body.blocked.down) this.lastGroundY = hs.body.bottom;
    const air = Math.min(1, Math.max(0, (this.lastGroundY - hs.body.bottom) / 140));
    this.heroShadow.setPosition(hs.x, this.lastGroundY + 1).setScale(0.75 - air * 0.35, 1).setAlpha((1 - air * 0.6) * hs.alpha);
    if (this.ended) return;

    this.checkEncounters();
    this.resolveSword(time);
    this.resolveAttacks(time);
    this.checkCastle();
    this.registry.set('progress', progress(this.hero.x, this.level));
  }
}
