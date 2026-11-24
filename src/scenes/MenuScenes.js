import { buildTextures, buildAnimations } from '../art/textures.js';

const FONT = 'Trebuchet MS, Verdana, sans-serif';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create() {
    buildTextures(this);
    buildAnimations(this);
    this.scene.start('title');
  }
}

function backdrop(scene) {
  scene.add.image(0, 0, 'sky').setOrigin(0);
  scene.add.image(0, 0, 'rays').setOrigin(0).setBlendMode('ADD');
  scene.add.image(180, 110, 'cloud').setScale(0.8);
  scene.add.image(600, 70, 'cloud2').setScale(0.7);
  scene.add.tileSprite(0, 140, 960, 300, 'mountains').setOrigin(0);
  scene.add.image(720, 400, 'castleFar').setOrigin(0.5, 1).setScale(0.45);
  scene.add.tileSprite(0, 255, 960, 220, 'hills').setOrigin(0);
  scene.add.tileSprite(0, 245, 960, 260, 'forest').setOrigin(0);
  scene.add.tileSprite(0, 470, 960, 96, 'ground').setOrigin(0);
  scene.add.image(0, 0, 'vignette').setOrigin(0).setDepth(100);
}

function startOnInput(scene, cb) {
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    cb();
  };
  scene.input.keyboard.once('keydown-ENTER', go);
  scene.input.keyboard.once('keydown-SPACE', go);
  scene.time.delayedCall(250, () => scene.input.once('pointerdown', go));
}

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create() {
    const W = this.scale.width;
    backdrop(this);
    this.add.rectangle(0, 0, W, 540, 0x0d1b2a, 0.25).setOrigin(0);

    this.add.image(250, 474, 'shadow').setScale(1.4);
    this.add.image(590, 474, 'shadow').setScale(2.6, 1.6);
    const hero = this.add.sprite(250, 472, 'hero', 'idle0').setOrigin(0.5, 1).setScale(1.7);
    hero.play('hero-idle');
    this.add.image(250 + 10 * 1.7, 472 - 37 * 1.7, 'sword').setOrigin(0.12, 0.5).setScale(1.7).setRotation(-1.1).setDepth(1);
    const rex = this.add.sprite(600, 472, 'rex', 'walk0').setOrigin(0.5, 1).setFlipX(true).setScale(1.05);
    rex.play('rex-walk');

    this.add
      .text(W / 2, 92, 'RUMO AO CASTELO', { fontFamily: FONT, fontSize: '58px', fontStyle: 'bold', color: '#fff6dc', stroke: '#2a1a10', strokeThickness: 10 })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 150, 'Atravesse a floresta, vença os dinossauros e chegue ao castelo.', {
        fontFamily: FONT, fontSize: '19px', color: '#ffffff', stroke: '#1d1d28', strokeThickness: 5,
      })
      .setOrigin(0.5);

    const touch = this.sys.game.device.input.touch;
    const controls = touch
      ? 'Use os botões na tela:  ◀ ▶ mover   ⤒ pular   ⚔ atacar'
      : 'A D ou ← →: mover      Espaço ou ↑: pular      F ou G: espada      Maçã = +1 vida';
    this.add
      .text(W / 2, 196, controls, { fontFamily: FONT, fontSize: '16px', color: '#fff6dc', stroke: '#1d1d28', strokeThickness: 4 })
      .setOrigin(0.5);

    const cta = this.add
      .text(W / 2, 250, touch ? 'Toque para começar' : 'Enter ou clique para começar', {
        fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#ffe14a', stroke: '#1d1d28', strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: cta, scale: 1.08, yoyo: true, repeat: -1, duration: 650, ease: 'Sine.inOut' });

    startOnInput(this, () => this.scene.start('play'));
  }
}

export class EndScene extends Phaser.Scene {
  constructor() {
    super('end');
  }

  init(data) {
    this.result = data;
  }

  create() {
    const W = this.scale.width;
    const { outcome, kills, total, timeMs, hp, lives } = this.result;
    const won = outcome === 'victory';
    backdrop(this);
    this.add.rectangle(0, 0, W, 540, won ? 0x1a2a10 : 0x2a0d10, won ? 0.35 : 0.55).setOrigin(0);

    if (won) {
      this.add.image(W / 2, 470, 'castle').setOrigin(0.5, 1).setScale(0.55);
      const hero = this.add.sprite(W / 2 - 180, 472, 'hero', 'idle0').setOrigin(0.5, 1).setScale(1.5);
      hero.play('hero-idle');
    } else {
      this.add.image(W / 2, 466, 'hero-dead').setOrigin(0.5, 1).setScale(1.8);
    }

    this.add
      .text(W / 2, 96, won ? 'VITÓRIA!' : 'FIM DE JOGO', {
        fontFamily: FONT, fontSize: '62px', fontStyle: 'bold', color: won ? '#ffe14a' : '#ff8a8a', stroke: '#1d1d28', strokeThickness: 10,
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 156, won ? 'O herói chegou ao castelo.' : 'Os dinossauros venceram desta vez. O castelo ainda espera.', {
        fontFamily: FONT, fontSize: '20px', color: '#ffffff', stroke: '#1d1d28', strokeThickness: 5,
      })
      .setOrigin(0.5);

    const secs = Math.round(timeMs / 1000);
    const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    const stats = won
      ? `Dinossauros: ${kills}/${total}     Tempo: ${time}     Energia: ${hp}     Vidas: ${lives}`
      : `Dinossauros derrotados: ${kills}/${total}     Tempo: ${time}`;
    this.add
      .text(W / 2, 200, stats, { fontFamily: FONT, fontSize: '17px', color: '#fff6dc', stroke: '#1d1d28', strokeThickness: 4 })
      .setOrigin(0.5);

    const cta = this.add
      .text(W / 2, 250, 'Enter ou clique para jogar de novo', {
        fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#ffffff', stroke: '#1d1d28', strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: cta, alpha: 0.5, yoyo: true, repeat: -1, duration: 700 });

    this.time.delayedCall(600, () => startOnInput(this, () => this.scene.start('play')));
  }
}
