// Fase 4 (Cidade das Torres): titãs, moradores e perigos do terremoto.
// Decisões dos titãs: o mesmo cérebro do Colosso (src/rules/monsterBrain.js);
// terremoto e espinhos: src/rules/cityRules.js. Aqui só física, animação e desenho.
import { GROUND_Y } from '../rules/level.js';
import { spikeLine, createRubble, hitRubble } from '../rules/cityRules.js';
import { Kaiju } from './Monsters.js';

const R = (x, y, w, h) => new Phaser.Geom.Rectangle(x, y, w, h);

// ------------------------------------------------------------------ perigos

/** Pedra do terremoto: o chão marca onde cai; o escudo na cabeça segura. */
export function dropRock(scene, x, damage, delayMs = 700) {
  const marker = scene.add.image(x, GROUND_Y + 2, 'shadow').setDepth(7).setScale(0.25, 1.4).setAlpha(0.5);
  scene.tweens.add({ targets: marker, scaleX: 0.75, alpha: 1, duration: delayMs, ease: 'Sine.in' });
  scene.time.delayedCall(delayMs, () => {
    marker.destroy();
    if (!scene.sys.isActive()) return;
    const p = scene.physics.add.image(x, GROUND_Y - 360, 'rock').setDepth(25);
    p.body.setAllowGravity(false).setSize(24, 22).setVelocity(0, 650);
    const hz = {
      kind: 'rock',
      sprite: p,
      damage,
      fromAbove: true,
      destroyable: true,
      dead: false,
      box: () => R(p.body.x, p.body.y, p.body.width, p.body.height),
      update() {
        p.rotation += 0.08;
        if (p.y >= GROUND_Y - 14) {
          scene.events.emit('hazard-ground', 'rock', p.x);
          hz.kill();
        }
      },
      kill() {
        if (hz.dead) return;
        hz.dead = true;
        p.destroy();
      },
    };
    scene.hazards.push(hz);
  });
}

/** Espinho que rasga o chão: a rachadura brilha antes; escudo não segura, é preciso pular. */
export function spawnSpike(scene, x, { warnMs, upMs, damage, height }) {
  const crack = scene.add.image(x, GROUND_Y + 2, 'crack').setDepth(7).setScale(0.6, 1);
  scene.tweens.add({ targets: crack, alpha: { from: 0.4, to: 1 }, scaleX: 0.8, yoyo: true, repeat: -1, duration: 160 });
  scene.time.delayedCall(warnMs, () => {
    scene.tweens.killTweensOf(crack);
    crack.destroy();
    if (!scene.sys.isActive()) return;
    const img = scene.add.image(x, GROUND_Y + 4, 'spike').setOrigin(0.5, 1).setDepth(23).setScale(1, 0.1);
    scene.tweens.add({ targets: img, scaleY: height / 52, duration: 90, ease: 'Back.out' });
    scene.dust?.explode(4, x, GROUND_Y);
    const hz = {
      kind: 'spike',
      sprite: img,
      damage,
      unblockable: true,
      persistent: true,
      dead: false,
      born: scene.time.now,
      box: () => R(x - 16, GROUND_Y - height + 6, 32, height - 6),
      update() {
        if (scene.time.now - hz.born > upMs) {
          hz.dead = true;
          scene.tweens.add({ targets: img, scaleY: 0, duration: 200, onComplete: () => img.destroy() });
        }
      },
      kill() {
        hz.dead = true;
        img.destroy();
      },
    };
    scene.hazards.push(hz);
  });
}

// ------------------------------------------------------------------ titãs

/** Titã dos Espinhos: quem causa os terremotos. */
export class SpikeTitan extends Kaiju {
  constructor(scene, x, encounter) {
    super(scene, x, encounter, 'spikeTitan');
  }

  fire(attack, ctx, enraged) {
    const s = this.sprite;
    const f = this.out.facing;
    const st = this.stats;
    const spike = { warnMs: st.spikeWarnMs, upMs: st.spikeUpMs, damage: st.spikeDamage, height: st.spikeHeight };
    if (attack === 'stomp') {
      // pisão: o chão treme e caem pedras em volta do herói
      this.scene.events.emit('kaiju-stomp', s.x + f * 120);
      const n = enraged ? 5 : 3;
      for (let i = 0; i < n; i++) {
        const x = Phaser.Math.Clamp(ctx.heroX + (i - (n - 1) / 2) * 110, this.encounter.x0 + 40, this.encounter.x1 - 40);
        dropRock(this.scene, x, st.rockDamage, 700 + i * 120);
      }
    } else if (attack === 'bolts') {
      // de longe: uma fileira de espinhos vem pelo chão até o herói
      this.scene.events.emit('kaiju-roar');
      const xs = spikeLine(s.x, ctx.heroX, st.spikeStep, enraged ? 9 : 7, this.encounter.x0 + 30, this.encounter.x1 - 30);
      xs.forEach((x, i) => this.scene.time.delayedCall(i * 140, () => spawnSpike(this.scene, x, spike)));
    } else if (attack === 'tail') {
      this.scene.events.emit('kaiju-tail');
    }
  }
}

/** Titã de Plasma: saiu da usina. A baforada é bloqueada com o escudo de frente. */
export class PlasmaTitan extends Kaiju {
  constructor(scene, x, encounter) {
    super(scene, x, encounter, 'plasmaTitan');
    this.beam = null;
  }

  update(ctx) {
    super.update(ctx);
    if (this.beam && (this.out.state !== 'active' || this.out.attack !== 'bolts' || !this.alive)) this.stopBeam();
    if (this.beam) this.updateBeam(ctx.now);
  }

  fire(attack, ctx, enraged) {
    const s = this.sprite;
    const f = this.out.facing;
    const st = this.stats;
    if (attack === 'stomp') {
      // ondas de choque pelo chão (pule)
      const fx = s.x + f * 110;
      for (const dir of [-1, 1]) spawnShock(this.scene, fx, dir, st);
      this.scene.events.emit('kaiju-stomp', fx);
    } else if (attack === 'bolts') {
      this.startBeam(enraged);
    } else if (attack === 'tail') {
      this.scene.events.emit('kaiju-tail');
    }
  }

  startBeam() {
    const sc = this.scene;
    const st = this.stats;
    const f = this.out.facing;
    const s = this.sprite;
    const mouth = { x: s.x + f * 130, y: s.y - 100 };
    const groundX = mouth.x + f * 130;
    // jato inclinado da boca até o chão + fogo correndo rente ao chão
    const len = Math.hypot(groundX - mouth.x, GROUND_Y - 40 - mouth.y);
    const stream = sc.add.tileSprite(mouth.x, mouth.y, len, 60, 'plasmabeam').setOrigin(0, 0.5).setDepth(24).setBlendMode('ADD');
    stream.setRotation(Math.atan2(GROUND_Y - 40 - mouth.y, groundX - mouth.x));
    const reach = st.beamLength;
    const floor = sc.add.tileSprite(groundX, GROUND_Y - 34, reach, 70, 'plasmabeam').setOrigin(f > 0 ? 0 : 1, 0.5).setDepth(24).setBlendMode('ADD');
    floor.setScale(0.05, 1);
    sc.tweens.add({ targets: floor, scaleX: 1, duration: 260, ease: 'Cubic.out' });
    const x0 = f > 0 ? groundX : groundX - reach;
    const hz = {
      kind: 'beam',
      sprite: floor,
      damage: st.beamDamage,
      persistent: true,
      dead: false,
      box: () => {
        const w = reach * floor.scaleX;
        return R(f > 0 ? groundX : groundX - w, GROUND_Y - 70, w, 70);
      },
      update() {},
      kill() {
        hz.dead = true;
      },
    };
    hz.fromX = s.x;
    sc.hazards.push(hz);
    this.beam = { stream, floor, hz, x0 };
    sc.cameras.main.shake(1400, 0.006);
  }

  updateBeam(now) {
    const { stream, floor } = this.beam;
    stream.tilePositionX -= 14;
    floor.tilePositionX += this.out.facing * 16;
    const a = 0.85 + Math.sin(now / 40) * 0.15;
    stream.setAlpha(a);
    floor.setAlpha(a);
    if (Math.random() < 0.6) this.scene.embers?.explode(2, floor.x + this.out.facing * Math.random() * this.stats.beamLength * floor.scaleX, GROUND_Y - 30);
  }

  stopBeam() {
    const { stream, floor, hz } = this.beam;
    hz.dead = true;
    this.scene.tweens.add({ targets: [stream, floor], alpha: 0, duration: 250, onComplete: () => (stream.destroy(), floor.destroy()) });
    this.beam = null;
  }

  die(away) {
    if (this.beam) this.stopBeam();
    super.die(away);
  }
}

/** Onda de choque (mesma ideia do Colosso), registrada nos perigos da cena. */
function spawnShock(scene, x, dir, st) {
  const img = scene.add.image(x, GROUND_Y + 2, 'shockwave').setOrigin(0.5, 1).setDepth(24).setFlipX(dir < 0).setTint(0xffe080);
  const hz = {
    kind: 'shockwave',
    sprite: img,
    damage: st.shockDamage,
    persistent: true,
    unblockable: true, // vem pelo chão: pule
    dead: false,
    born: scene.time.now,
    box: () => R(img.x - 24, GROUND_Y - st.shockHeight, 48, st.shockHeight),
    update(dt) {
      img.x += dir * st.shockSpeed * dt;
      const age = scene.time.now - hz.born;
      img.setAlpha(Math.max(0, 1 - age / 1800));
      if (age > 1800) hz.kill();
    },
    kill() {
      if (hz.dead) return;
      hz.dead = true;
      img.destroy();
    },
  };
  scene.hazards.push(hz);
}

// ------------------------------------------------------------------ moradores

/** Morador da cidade: passeia; no terremoto, se abaixa e protege a cabeça; comemora as vitórias. */
export class Citizen {
  constructor(scene, x, look) {
    this.scene = scene;
    this.look = look;
    this.homeX = x;
    this.dir = look % 2 ? 1 : -1;
    this.sprite = scene.add.sprite(x, GROUND_Y + 2, `citizen${look}`, 'idle').setOrigin(0.5, 1).setDepth(8);
    this.sprite.play(`citizen${look}-walk`);
  }

  update(ctx, dt) {
    const s = this.sprite;
    if (ctx.danger) {
      s.anims.stop();
      s.setFrame('cower');
      return;
    }
    if (ctx.cheer) {
      if (s.anims.currentAnim?.key !== `citizen${this.look}-cheer`) s.play(`citizen${this.look}-cheer`);
      return;
    }
    if (s.anims.currentAnim?.key !== `citizen${this.look}-walk` || !s.anims.isPlaying) s.play(`citizen${this.look}-walk`);
    s.x += this.dir * 35 * dt;
    if (Math.abs(s.x - this.homeX) > 110) this.dir = -Math.sign(s.x - this.homeX);
    s.setFlipX(this.dir < 0);
  }
}

/** Morador preso nos escombros: dois golpes de espada libertam (+1 vida). */
export class Trapped {
  constructor(scene, x, look) {
    this.scene = scene;
    this.look = look;
    this.rubble = createRubble(2);
    this.person = scene.add.sprite(x, GROUND_Y + 2, `citizen${look}`, 'cower').setOrigin(0.5, 1).setDepth(8);
    this.pile = scene.add.image(x + 4, GROUND_Y + 6, 'rubble').setOrigin(0.5, 1).setDepth(9);
    this.help = scene.add
      .text(x, GROUND_Y - 96, 'Socorro!', { fontFamily: 'Trebuchet MS, Verdana, sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#ffffff', stroke: '#1d1d28', strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(40);
    scene.tweens.add({ targets: this.help, y: GROUND_Y - 104, yoyo: true, repeat: -1, duration: 500 });
  }

  get freed() {
    return this.rubble.freed;
  }

  bounds() {
    return R(this.pile.x - 44, GROUND_Y - 54, 88, 54);
  }

  /** @returns {boolean} true quando acabou de ser libertado */
  hit() {
    const freed = hitRubble(this.rubble);
    this.scene.dust?.explode(8, this.pile.x, GROUND_Y - 20);
    this.scene.tweens.add({ targets: this.pile, x: this.pile.x + 3, yoyo: true, repeat: 2, duration: 40 });
    if (freed) {
      this.help.destroy();
      this.scene.tweens.add({ targets: this.pile, alpha: 0, scaleY: 0.2, duration: 300, onComplete: () => this.pile.destroy() });
      this.person.play(`citizen${this.look}-cheer`);
      this.scene.time.delayedCall(1600, () => {
        this.person.play(`citizen${this.look}-walk`);
        this.scene.tweens.add({ targets: this.person, x: this.person.x - 260, alpha: 0, duration: 2600, onComplete: () => this.person.destroy() });
      });
    }
    return freed;
  }
}
