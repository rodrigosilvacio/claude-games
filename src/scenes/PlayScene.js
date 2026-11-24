import Hero, { MOVE } from '../entities/Hero.js';
import Dino from '../entities/Dino.js';
import { HERO } from '../rules/combat.js';
import {
  LEVEL,
  GROUND_Y,
  WORLD_WIDTH,
  CASTLE_GATE_X,
  createRun,
  tryStartEncounter,
  recordKill,
  canEnterCastle,
  progress,
} from '../rules/level.js';

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super('play');
  }

  init() {
    // estado zerado a cada (re)início: a instância da cena é reaproveitada
    this.level = LEVEL;
    this.run = createRun();
    this.dinos = [];
    this.fences = new Map();
    this.hitStopUntil = 0;
    this.ended = false;
    this.prevJumpHeld = false;
  }

  create() {
    const W = this.scale.width;
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, 600);
    this.physics.world.gravity.y = MOVE.gravity;
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, 540);

    this.buildBackdrop(W);
    this.buildWorld();

    this.hero = new Hero(this, LEVEL.heroStartX, GROUND_Y);
    this.heroShadow = this.add.image(0, 0, 'shadow').setDepth(6);
    this.lastGroundY = GROUND_Y;
    this.physics.add.collider(this.hero.sprite, this.solids);
    this.physics.add.collider(this.hero.sprite, this.fenceGroup);

    for (const enc of LEVEL.encounters) {
      for (const sp of enc.spawns) {
        const d = new Dino(this, sp.type, sp.x, GROUND_Y, enc);
        d.shadow = this.add.image(sp.x, GROUND_Y + 2, 'shadow').setDepth(6).setScale(d.stats.body.w / 50, 1.3);
        this.dinos.push(d);
      }
    }
    const dinoSprites = this.dinos.map((d) => d.sprite);
    this.physics.add.collider(dinoSprites, this.solids);
    this.physics.add.collider(dinoSprites, this.fenceGroup);

    this.physics.add.overlap(this.hero.sprite, this.pickups, (_h, fruit) => this.collectFruit(fruit));

    this.cameras.main.startFollow(this.hero.sprite, true, 0.1, 0.1, -60, 60);
    this.cameras.main.setDeadzone(120, 160);

    this.setupInput();
    this.setupFx();

    this.run.startedAt = this.time.now;
    this.syncRegistry();
    if (!this.scene.isActive('hud')) this.scene.launch('hud');
    this.registry.set('banner', { text: 'Rumo ao castelo!  →', ms: 2200 });
    this.events.once('shutdown', () => this.input.keyboard.removeAllKeys(true));
  }

  // ------------------------------------------------------------ cenário

  buildBackdrop(W) {
    this.add.image(0, 0, 'sky').setOrigin(0).setScrollFactor(0).setDepth(-10);
    this.rays = this.add.image(0, 0, 'rays').setOrigin(0).setScrollFactor(0).setDepth(-4).setBlendMode('ADD');
    this.tweens.add({ targets: this.rays, alpha: 0.45, yoyo: true, repeat: -1, duration: 4200, ease: 'Sine.inOut' });
    this.add.image(0, 0, 'vignette').setOrigin(0).setScrollFactor(0).setDepth(60);
    this.add.particles(0, 0, 'mote', {
      x: { min: 0, max: W },
      y: { min: 120, max: 460 },
      lifespan: 6000,
      speedX: { min: -14, max: 14 },
      speedY: { min: -18, max: -4 },
      scale: { min: 0.4, max: 1 },
      alpha: { start: 0.9, end: 0 },
      frequency: 260,
      blendMode: 'ADD',
    }).setScrollFactor(0).setDepth(50);
    this.clouds = [];
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
    this.mountainsLayer = this.add.tileSprite(0, 140, W, 300, 'mountains').setOrigin(0).setScrollFactor(0).setDepth(-8);
    // castelo no horizonte: aproxima devagar ao longo da jornada
    this.add.image(880, 400, 'castleFar').setOrigin(0.5, 1).setScale(0.32).setScrollFactor(0.025).setDepth(-7);
    this.hillsLayer = this.add.tileSprite(0, 255, W, 220, 'hills').setOrigin(0).setScrollFactor(0).setDepth(-6);
    this.forestLayer = this.add.tileSprite(0, GROUND_Y - 225, W, 260, 'forest').setOrigin(0).setScrollFactor(0).setDepth(-5);

    // árvores e arbustos na mesma camada do herói (fundo próximo)
    const r = Phaser.Math.RND;
    r.sow(['floresta']);
    for (let x = 300; x < CASTLE_GATE_X - 500; x += 380 + r.between(0, 260)) {
      this.add.image(x, GROUND_Y + 6, 'tree').setOrigin(0.5, 1).setDepth(-2).setScale(r.realInRange(0.8, 1.15));
    }
    for (let x = 120; x < WORLD_WIDTH; x += 260 + r.between(0, 220)) {
      this.add.image(x, GROUND_Y + 14, 'bush').setOrigin(0.5, 1).setDepth(-1).setScale(r.realInRange(0.6, 0.9));
    }
  }

  buildWorld() {
    this.solids = this.physics.add.staticGroup();
    const ground = this.add.tileSprite(0, GROUND_Y, WORLD_WIDTH, 96, 'ground').setOrigin(0).setDepth(5);
    this.physics.add.existing(ground, true);
    this.solids.add(ground);

    for (const l of LEVEL.ledges) {
      const ledge = this.add.tileSprite(l.x, l.y, l.w, 34, 'ledge').setOrigin(0).setDepth(4);
      this.physics.add.existing(ledge, true);
      ledge.body.checkCollision.down = false; // dá para subir por baixo
      ledge.body.checkCollision.left = ledge.body.checkCollision.right = false;
      this.solids.add(ledge);
    }

    this.pickups = this.physics.add.staticGroup();
    for (const p of LEVEL.pickups) {
      const f = this.pickups.create(p.x, p.y, 'fruit').setDepth(8);
      f.setData('heal', p.heal);
      this.tweens.add({ targets: f, y: p.y - 6, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.inOut' });
    }

    this.castle = this.add.image(CASTLE_GATE_X, GROUND_Y + 8, 'castle').setOrigin(0.5, 1).setDepth(-1);
    this.fenceGroup = this.physics.add.staticGroup();
  }

  // ------------------------------------------------------------ input

  setupInput() {
    const K = Phaser.Input.Keyboard.KeyCodes;
    // Mão esquerda na fileira ASDFG: A/D movem, Espaço pula, F ou G atacam.
    this.keys = this.input.keyboard.addKeys({ a: K.A, d: K.D, space: K.SPACE, f: K.F, g: K.G });
    this.mouseAttack = false;
    if (!this.sys.game.device.input.touch) {
      this.input.on('pointerdown', (p) => { if (p.leftButtonDown()) this.mouseAttack = true; });
    }
  }

  readInput() {
    const k = this.keys;
    const t = this.registry.get('touch') ?? {};
    const JD = Phaser.Input.Keyboard.JustDown;
    const jumpHeld = k.space.isDown || !!t.jump;
    const jumpKeyDown = JD(k.space);
    const attackKeyDown = JD(k.f) | JD(k.g);
    const input = {
      left: k.a.isDown || !!t.left,
      right: k.d.isDown || !!t.right,
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

    this.events.on('hero-landed', (x, y) => this.dust.explode(6, x, y));
    this.events.on('hero-jumped', (x, y) => this.dust.explode(4, x, y));
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
    const gained = this.hero.heal(fruit.getData('heal'));
    if (gained <= 0) return; // vida cheia: guarda a fruta para depois
    this.tweens.killTweensOf(fruit);
    fruit.disableBody(true, true);
    this.popText(fruit.x, fruit.y - 10, `+${gained}`, '#7dff8a');
    this.leaves.explode(10, fruit.x, fruit.y);
    this.syncRegistry();
  }

  checkEncounters() {
    if (this.run.active) return;
    const x = this.hero.x;
    for (const enc of LEVEL.encounters) {
      if (x > enc.x0 + 110 && x < enc.x1 && tryStartEncounter(this.run, enc.id)) {
        this.closeFences(enc);
        const msg = enc.boss ? 'O Rei Rex guarda o portão!' : `${enc.name}: derrote os dinossauros!`;
        this.registry.set('banner', { text: msg, ms: 2200, danger: true });
        if (enc.boss) {
          this.cameras.main.shake(500, 0.012);
          this.registry.set('boss', { name: 'Rei Rex', ratio: 1 });
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
    for (const d of this.dinos) {
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
      if (d.stats.boss) this.registry.set('boss', r.died ? null : { name: 'Rei Rex', ratio: d.fighter.hp / d.fighter.maxHp });
      if (r.died) this.onDinoKilled(d);
    }
  }

  onDinoKilled(d) {
    const enc = d.encounter;
    const cleared = recordKill(this.run, enc.id);
    this.popText(d.sprite.x, d.sprite.y - 60, `${d.stats.label} derrotado!`, '#ffffff', 18);
    if (cleared) {
      this.openFences(enc.id);
      const gained = this.hero.heal(HERO.clearHeal);
      if (gained > 0) this.time.delayedCall(500, () => this.popText(this.hero.x, this.hero.sprite.y - 80, `+${gained}`, '#7dff8a'));
      const msg = enc.boss ? 'O portão está livre! Entre no castelo!' : 'Caminho livre!  →';
      this.time.delayedCall(400, () => this.registry.set('banner', { text: msg, ms: 2000 }));
    }
    this.syncRegistry();
  }

  resolveDinoAttacks(now) {
    if (!this.hero.alive) return;
    const hb = this.hero.sprite.body;
    const heroBox = new Phaser.Geom.Rectangle(hb.x, hb.y, hb.width, hb.height);
    for (const d of this.dinos) {
      if (!d.alive || !d.attacking) continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(heroBox, d.bounds())) continue;
      const r = this.hero.takeHit(d.stats.damage, d.sprite.x, now);
      d.brain.hitLanded = true;
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
    this.run.outcome = 'defeat';
    this.run.finishedAt = this.time.now;
    this.registry.set('banner', { text: 'O herói caiu...', ms: 1800, danger: true });
    this.time.delayedCall(1800, () => this.finish());
  }

  checkCastle() {
    if (this.ended || !canEnterCastle(this.run) || this.hero.x < CASTLE_GATE_X - 30) return;
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
      kills: this.run.kills,
      total: this.run.total,
      timeMs: this.run.finishedAt - this.run.startedAt,
      hp: this.hero.fighter.hp,
    });
  }

  syncRegistry() {
    this.registry.set('hero', { hp: this.hero.fighter.hp, max: this.hero.fighter.maxHp });
    this.registry.set('kills', { kills: this.run.kills, total: this.run.total });
  }

  // ------------------------------------------------------------ loop

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    const cam = this.cameras.main;
    this.mountainsLayer.tilePositionX = cam.scrollX * 0.08;
    this.hillsLayer.tilePositionX = cam.scrollX * 0.22;
    this.forestLayer.tilePositionX = cam.scrollX * 0.5;
    for (const c of this.clouds) {
      c.x -= c.speed * dt;
      if (c.x < -200) c.x = this.scale.width + 120;
    }

    if (time < this.hitStopUntil) return; // congelado pelo impacto

    const input = this.ended && this.hero.alive ? {} : this.readInput();
    if (!this.ended || !this.hero.alive) this.hero.update(input, time, dt);
    else this.hero.placeSword(time);

    for (const d of this.dinos) {
      d.update(this.hero.x, this.hero.alive, this.run.active, delta);
      if (d.shadow) {
        if (d.sprite.active && d.alive) d.shadow.setPosition(d.sprite.x, GROUND_Y + 2);
        else d.shadow.setAlpha(d.sprite.active ? d.sprite.alpha : 0);
      }
    }
    const hs = this.hero.sprite;
    if (hs.body.blocked.down) this.lastGroundY = hs.body.bottom;
    const air = Math.min(1, Math.max(0, (this.lastGroundY - hs.body.bottom) / 140));
    this.heroShadow.setPosition(hs.x, this.lastGroundY + 1).setScale(0.75 - air * 0.35, 1).setAlpha((1 - air * 0.6) * hs.alpha);
    if (this.ended) return;

    this.checkEncounters();
    this.resolveSword(time);
    this.resolveDinoAttacks(time);
    this.checkCastle();
    this.registry.set('progress', progress(this.hero.x));
  }
}
