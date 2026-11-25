import { MOVE } from '../rules/movement.js';
import { HERO, createFighter, applyDamage, heal, jumpVelocity } from '../rules/combat.js';

export { MOVE };

export default class Hero {
  constructor(scene, x, y) {
    this.scene = scene;
    this.fighter = createFighter(HERO.maxHp);
    this.facing = 1;
    this.lastGroundAt = -1e9;
    this.lastJumpPressAt = -1e9;
    this.attackReadyAt = 0;
    this.attack = null; // { startedAt, hitIds:Set }
    this.landed = true;
    this.hurtUntil = 0;

    this.sprite = scene.physics.add.sprite(x, y, 'hero', 'idle0').setDepth(10);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.body.setSize(22, 56).setOffset(19, 24);
    this.sprite.body.setMaxVelocityY(MOVE.maxFall);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.play('hero-idle');

    this.sword = scene.add.image(x, y, 'sword').setOrigin(0.12, 0.5).setDepth(11);
    this.slash = scene.add.image(x, y, 'slash').setDepth(12).setVisible(false).setBlendMode('ADD');
    // escudo (Fase 3): nas costas quando guardado, na frente quando segurando S
    this.hasShield = false;
    this.blocking = false;
    this.shieldImg = scene.add.image(x, y, 'shield').setVisible(false);
  }

  get x() {
    return this.sprite.x;
  }

  get alive() {
    return !this.fighter.dead;
  }

  /** Retângulo de acerto da espada (só existe na janela ativa do golpe). */
  swordHitbox(now) {
    if (!this.attack) return null;
    const t = now - this.attack.startedAt;
    if (t < HERO.attackWindupMs || t > HERO.attackWindupMs + HERO.attackActiveMs) return null;
    const w = 84;
    const h = 76;
    const cx = this.sprite.x + this.facing * 46;
    return new Phaser.Geom.Rectangle(cx - w / 2, this.sprite.y - 80, w, h);
  }

  update(input, now, dt) {
    const s = this.sprite;
    const body = s.body;
    if (!this.alive) {
      this.sword.setVisible(false);
      return;
    }

    const onGround = body.blocked.down;
    if (onGround && body.velocity.y >= 0) {
      this.lastGroundAt = now;
      if (!this.landed) {
        this.landed = true;
        this.scene.events.emit('hero-landed', s.x, s.y);
      }
    } else if (!onGround) {
      this.landed = false;
    }

    // corrida com aceleração
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (dir !== 0 && !this.attack) this.facing = dir;
    this.blocking = this.hasShield && !!input.shield && !this.attack;
    const target = dir * MOVE.runSpeed * (this.blocking ? HERO.shield.speedMult : 1); // golpear não trava as pernas
    const accel = onGround ? MOVE.accelGround : MOVE.accelAir;
    const vx = body.velocity.x;
    const step = accel * dt;
    body.setVelocityX(Math.abs(target - vx) <= step ? target : vx + Math.sign(target - vx) * step);

    // pulo com buffer + coyote
    if (input.jumpPressed) this.lastJumpPressAt = now;
    if (now - this.lastJumpPressAt <= MOVE.bufferMs && now - this.lastGroundAt <= MOVE.coyoteMs) {
      body.setVelocityY(jumpVelocity(MOVE.jumpHeight, MOVE.gravity));
      this.lastJumpPressAt = this.lastGroundAt = -1e9;
      if (!input.jumpHeld) body.velocity.y *= MOVE.jumpCut;
      this.scene.events.emit('hero-jumped', s.x, s.y);
    }
    if (input.jumpReleased && body.velocity.y < 0) body.velocity.y *= MOVE.jumpCut;
    body.setGravityY(body.velocity.y > 0 ? MOVE.fallGravityExtra : 0);

    // ataque
    if (input.attackPressed && !this.blocking && now >= this.attackReadyAt) this.startAttack(now);
    if (this.attack && now - this.attack.startedAt > HERO.attackCooldownMs) this.attack = null;

    // animação
    const moving = Math.abs(body.velocity.x) > 30;
    if (now < this.hurtUntil) s.anims.stop(), s.setTexture('hero', 'hurt');
    else if (!onGround) s.anims.stop(), s.setTexture('hero', body.velocity.y < 0 ? 'jump' : 'fall');
    else if (moving) this.playRun(this.attack ? 'hero-run-attack' : 'hero-run');
    else if (this.attack) s.anims.stop(), s.setTexture('hero', 'attack');
    else s.anims.currentAnim?.key !== 'hero-idle' && s.play('hero-idle');
    s.setFlipX(this.facing < 0);

    // piscar durante invencibilidade
    s.setAlpha(now < this.fighter.invulnUntil ? (Math.floor(now / 70) % 2 ? 0.35 : 1) : 1);

    this.placeSword(now);
    this.placeShield();
  }

  placeShield() {
    const s = this.sprite;
    const img = this.shieldImg;
    if (!this.hasShield || !this.alive) return img.setVisible(false);
    const f = this.facing;
    if (this.blocking) {
      img.setPosition(s.x + f * 17, s.y - 42).setScale(1.05).setFlipX(f < 0).setDepth(12).setAlpha(s.alpha).setVisible(true);
    } else {
      img.setPosition(s.x - f * 9, s.y - 46).setScale(0.7).setFlipX(f > 0).setDepth(9).setAlpha(s.alpha).setVisible(true);
    }
  }

  /** Troca entre corrida normal e corrida golpeando sem perder o passo. */
  playRun(key) {
    const a = this.sprite.anims;
    if (a.isPlaying && a.currentAnim?.key === key) return;
    const wasRunning = a.isPlaying && a.currentAnim?.key.startsWith('hero-run');
    const step = wasRunning ? a.currentFrame.index - 1 : 0;
    this.sprite.play({ key, startFrame: step });
  }

  startAttack(now) {
    this.attack = { startedAt: now, hitIds: new Set() };
    this.attackReadyAt = now + HERO.attackCooldownMs;
    this.scene.events.emit('hero-swing');
  }

  placeSword(now) {
    const s = this.sprite;
    const f = this.facing;
    let angle = -1.1; // em repouso: lâmina levantada à frente
    let handX = 10;
    let handY = -37;
    const frame = s.frame.name;
    if (frame === 'jump' || frame === 'fall') { handX = 12; handY = frame === 'jump' ? -45 : -41; }
    else if (frame === 'hurt') { handX = 4; handY = -50; angle = -2; }
    if (this.attack) {
      const t = Math.min(1, (now - this.attack.startedAt) / (HERO.attackWindupMs + HERO.attackActiveMs));
      const eased = 1 - Math.pow(1 - t, 3);
      angle = -2.3 + eased * 3.4; // arco de trás/cima para frente/baixo
      handX = 14;
      handY = -56 + eased * 12;
    }
    this.sword.setVisible(true).setAlpha(s.alpha);
    this.sword.setPosition(s.x + f * handX, s.y + handY);
    this.sword.setScale(f, 1).setRotation(f * angle);

    const active = this.swordHitbox(now);
    this.slash.setVisible(!!active);
    if (active) {
      this.slash.setPosition(s.x + f * 34, s.y - 44).setScale(f * 0.8, 0.8).setAlpha(0.9);
    }
  }

  takeHit(amount, fromX, now) {
    const r = applyDamage(this.fighter, amount, now, HERO.invulnMs);
    if (!r.hit) return r;
    const away = Math.sign(this.sprite.x - fromX) || -this.facing;
    this.sprite.body.setVelocity(away * HERO.knockback.x, HERO.knockback.y);
    this.attack = null;
    this.hurtUntil = now + 260;
    if (r.died) this.die();
    return r;
  }

  heal(amount) {
    return heal(this.fighter, amount);
  }

  /** Renasce com vida cheia e um tempo de invencibilidade. */
  revive(x, y, now) {
    this.fighter = createFighter(HERO.maxHp);
    this.fighter.invulnUntil = now + 1500;
    this.attack = null;
    this.hurtUntil = 0;
    const s = this.sprite;
    s.setTexture('hero', 'idle0').setAlpha(1);
    s.body.setSize(22, 56).setOffset(19, 24);
    s.setPosition(x, y);
    s.body.reset(x, y);
    this.facing = 1;
    s.play('hero-idle');
  }

  die() {
    const s = this.sprite;
    s.anims.stop();
    s.setTexture('hero-dead').setAlpha(1).setFlipX(this.facing < 0);
    s.body.setSize(40, 20).setOffset(22, 14);
    s.body.setVelocityX(0);
    this.sword.setVisible(false);
    this.slash.setVisible(false);
    this.shieldImg.setVisible(false);
    this.blocking = false;
  }
}
