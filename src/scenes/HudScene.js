// HUD em cena paralela (skill `phaser-core`): reage ao registry, não ao loop do jogo.
const FONT = 'Trebuchet MS, Verdana, sans-serif';

export default class HudScene extends Phaser.Scene {
  constructor() {
    super('hud');
  }

  create() {
    const W = this.scale.width;
    this.add.image(26, 28, 'heart').setScrollFactor(0);
    this.hpBar = this.add.graphics();
    this.hpText = this.add.text(52, 40, '', { fontFamily: FONT, fontSize: '14px', color: '#ffffff', stroke: '#1d1d28', strokeThickness: 4 });

    this.add.image(24, 74, 'hero', 'idle0').setScale(0.42);
    this.livesText = this.add.text(40, 62, '', { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#ffffff', stroke: '#1d1d28', strokeThickness: 5 });

    this.killText = this.add
      .text(W - 20, 16, '', { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#ffffff', stroke: '#1d1d28', strokeThickness: 5 })
      .setOrigin(1, 0);
    this.progressBar = this.add.graphics();
    this.bossBar = this.add.graphics();
    this.bossText = this.add
      .text(W / 2, 484, '', { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffffff', stroke: '#1d1d28', strokeThickness: 5 })
      .setOrigin(0.5);
    this.banner = this.add
      .text(W / 2, 110, '', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#ffffff', stroke: '#1d1d28', strokeThickness: 7, align: 'center' })
      .setOrigin(0.5)
      .setAlpha(0);

    const handlers = {
      'changedata-hero': (_p, v) => this.drawHp(v),
      'changedata-lives': (_p, v) => this.drawLives(v),
      'changedata-kills': (_p, v) => this.killText.setText(`🦖 ${v.kills} / ${v.total}`),
      'changedata-progress': (_p, v) => this.drawProgress(v),
      'changedata-banner': (_p, v) => this.showBanner(v),
      'changedata-boss': (_p, v) => this.drawBoss(v),
      'setdata-boss': (_p, _k, v) => this.drawBoss(v),
    };
    for (const [evt, fn] of Object.entries(handlers)) this.registry.events.on(evt, fn);
    // o registry sobrevive às cenas: remover listeners ou eles se acumulam a cada reinício
    this.events.once('shutdown', () => {
      for (const [evt, fn] of Object.entries(handlers)) this.registry.events.off(evt, fn);
    });

    this.drawHp(this.registry.get('hero') ?? { hp: 100, max: 100 });
    const k = this.registry.get('kills');
    if (k) this.killText.setText(`🦖 ${k.kills} / ${k.total}`);
    this.drawProgress(this.registry.get('progress') ?? 0);
    this.drawLives(this.registry.get('lives') ?? 3);
    this.registry.set('boss', null);
    const b = this.registry.get('banner');
    if (b) this.showBanner(b);

    this.buildTouchControls();
  }

  drawHp({ hp, max }) {
    const g = this.hpBar;
    const w = 200;
    const ratio = max ? hp / max : 0;
    g.clear();
    g.fillStyle(0x1d1d28, 0.75).fillRoundedRect(46, 18, w + 8, 20, 6);
    const color = ratio > 0.5 ? 0x5fd35f : ratio > 0.25 ? 0xf2b33d : 0xe5394a;
    if (ratio > 0) g.fillStyle(color).fillRoundedRect(50, 22, Math.max(6, w * ratio), 12, 4);
    this.hpText.setText(`${hp} / ${max}`);
    if (ratio <= 0.25 && ratio > 0) {
      this.tweens.add({ targets: this.hpText, scale: 1.2, yoyo: true, duration: 120 });
    }
  }

  drawLives(n) {
    const changed = this.livesText.text !== '' && this.livesText.text !== `× ${n}`;
    this.livesText.setText(`× ${n}`);
    if (changed) this.tweens.add({ targets: this.livesText, scale: 1.4, yoyo: true, duration: 160 });
  }

  drawProgress(p) {
    const g = this.progressBar;
    const x = this.scale.width - 236;
    const y = 50;
    g.clear();
    g.fillStyle(0x1d1d28, 0.6).fillRoundedRect(x, y, 200, 10, 5);
    g.fillStyle(0xe8b84a).fillRoundedRect(x, y, Math.max(10, 200 * p), 10, 5);
    g.fillStyle(0xc8453b).fillTriangle(x + 196, y - 12, x + 204, y - 22, x + 212, y - 12);
    g.fillStyle(0xb9b2a6).fillRect(x + 198, y - 12, 12, 12);
  }

  drawBoss(v) {
    const g = this.bossBar;
    g.clear();
    if (!v) {
      this.bossText.setText('');
      return;
    }
    const W = this.scale.width;
    const w = 420;
    g.fillStyle(0x1d1d28, 0.75).fillRoundedRect(W / 2 - w / 2 - 4, 500, w + 8, 20, 6);
    g.fillStyle(0xa35ac0).fillRoundedRect(W / 2 - w / 2, 504, Math.max(6, w * v.ratio), 12, 4);
    this.bossText.setText(v.name);
  }

  showBanner({ text, ms = 2000, danger = false }) {
    this.tweens.killTweensOf(this.banner);
    this.banner.setText(text).setColor(danger ? '#ffd2a6' : '#ffffff').setAlpha(0).setScale(0.8);
    this.tweens.add({ targets: this.banner, alpha: 1, scale: 1, duration: 220, ease: 'Back.out' });
    this.tweens.add({ targets: this.banner, alpha: 0, delay: ms, duration: 400 });
  }

  // Controles de toque para celular/tablet: escrevem num objeto compartilhado no registry.
  buildTouchControls() {
    const touch = { left: false, right: false, jump: false, attackPressed: false };
    this.registry.set('touch', touch);
    if (!this.sys.game.device.input.touch) return;
    this.input.addPointer(3);
    const H = this.scale.height;
    const W = this.scale.width;
    const button = (x, y, r, label, onDown, onUp) => {
      const c = this.add.circle(x, y, r, 0xffffff, 0.22).setStrokeStyle(3, 0xffffff, 0.5).setInteractive();
      this.add.text(x, y, label, { fontFamily: FONT, fontSize: `${Math.round(r * 0.7)}px`, color: '#ffffff' }).setOrigin(0.5).setAlpha(0.85);
      c.on('pointerdown', () => { c.setFillStyle(0xffffff, 0.45); onDown(); });
      const up = () => { c.setFillStyle(0xffffff, 0.22); onUp?.(); };
      c.on('pointerup', up);
      c.on('pointerout', up);
    };
    button(70, H - 70, 44, '◀', () => (touch.left = true), () => (touch.left = false));
    button(175, H - 70, 44, '▶', () => (touch.right = true), () => (touch.right = false));
    button(W - 180, H - 70, 44, '⤒', () => (touch.jump = true), () => (touch.jump = false));
    button(W - 72, H - 92, 54, '⚔', () => (touch.attackPressed = true));
  }
}
