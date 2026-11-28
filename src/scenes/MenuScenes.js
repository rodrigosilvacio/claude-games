import { buildTextures, buildAnimations } from '../art/textures.js';
import { buildNightTextures, buildNightAnimations } from '../art/night.js';
import { buildIceTextures, buildIceAnimations } from '../art/ice.js';
import { buildCityTextures, buildCityAnimations } from '../art/city.js';
import { LAST_PHASE, LEVELS, livesForNextPhase } from '../rules/level.js';

// Maior fase liberada fica guardada só neste navegador (conveniência; o jogo funciona sem).
const UNLOCK_KEY = 'pepe.fase';
const unlockedPhase = () => {
  try {
    const n = Number(localStorage.getItem(UNLOCK_KEY));
    if (n >= 2) return n;
    return localStorage.getItem('pepe.fase2') === '1' ? 2 : 1; // versão anterior
  } catch {
    return 1;
  }
};
const unlock = (phase) => {
  try {
    if (phase > unlockedPhase()) localStorage.setItem(UNLOCK_KEY, String(phase));
  } catch {
    /* sem armazenamento: ok */
  }
};

const FONT = 'Trebuchet MS, Verdana, sans-serif';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create() {
    buildTextures(this);
    buildAnimations(this);
    buildNightTextures(this);
    buildNightAnimations(this);
    buildIceTextures(this);
    buildIceAnimations(this);
    buildCityTextures(this);
    buildCityAnimations(this);
    this.scene.start('title');
  }
}

function backdrop(scene, theme = 'day') {
  if (theme === 'city') {
    scene.add.image(0, 0, 'sky4').setOrigin(0);
    scene.add.tileSprite(0, 150, 960, 300, 'far4').setOrigin(0);
    scene.add.tileSprite(0, 250, 960, 220, 'mid4').setOrigin(0);
    scene.add.tileSprite(0, 215, 960, 260, 'near4').setOrigin(0);
    scene.add.tileSprite(0, 470, 960, 96, 'ground4').setOrigin(0);
    scene.add.image(0, 0, 'vignette').setOrigin(0).setDepth(100);
    return;
  }
  if (theme === 'ice') {
    scene.add.image(0, 0, 'sky3').setOrigin(0);
    scene.add.tileSprite(0, 120, 960, 300, 'far3').setOrigin(0);
    scene.add.image(720, 300, 'castleFar3').setOrigin(0.5, 1).setScale(0.4);
    scene.add.tileSprite(0, 250, 960, 220, 'mid3').setOrigin(0);
    scene.add.tileSprite(0, 245, 960, 260, 'forest3').setOrigin(0);
    scene.add.tileSprite(0, 470, 960, 96, 'ground3').setOrigin(0);
    scene.add.image(0, 0, 'vignette').setOrigin(0).setDepth(100);
    return;
  }
  if (theme === 'night') {
    scene.add.image(0, 0, 'sky2').setOrigin(0);
    scene.add.tileSprite(0, 130, 960, 300, 'far2').setOrigin(0);
    scene.add.image(720, 330, 'castleFar2').setOrigin(0.5, 1).setScale(0.4);
    scene.add.tileSprite(0, 250, 960, 220, 'mid2').setOrigin(0);
    scene.add.tileSprite(0, 245, 960, 260, 'forest2').setOrigin(0);
    scene.add.tileSprite(0, 470, 960, 96, 'ground2').setOrigin(0);
    scene.add.tileSprite(0, 330, 960, 160, 'mist').setOrigin(0).setAlpha(0.8);
    scene.add.image(0, 0, 'vignette').setOrigin(0).setDepth(100);
    return;
  }
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
      .text(W / 2, 92, 'O MUNDO DO PEPE', { fontFamily: FONT, fontSize: '58px', fontStyle: 'bold', color: '#fff6dc', stroke: '#2a1a10', strokeThickness: 10 })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 150, 'Atravesse florestas e montanhas, vença os monstros e encontre a princesa.', {
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

    // links diretos para testar: #fase2, #fase3, #fase4
    const m = /^#fase([234])$/.exec(location.hash);
    if (m) unlock(Number(m[1]));
    const max = unlockedPhase();
    if (max >= 2 && !touch) {
      const keys = [2, 3, 4].filter((n) => n <= max).join(', ');
      this.add
        .text(W / 2, 290, `Tecla ${keys}: ir direto para a fase`, { fontFamily: FONT, fontSize: '17px', color: '#c8e0ff', stroke: '#1d1d28', strokeThickness: 4 })
        .setOrigin(0.5);
      const names = { 2: 'TWO', 3: 'THREE', 4: 'FOUR' };
      for (let n = 2; n <= max; n++) this.input.keyboard.once(`keydown-${names[n]}`, () => startPhase(this, n));
    }
    startOnInput(this, () => this.scene.start('play', { phase: 1 }));
  }
}

/** Começa uma fase, passando pela história dela quando houver. */
function startPhase(scene, phase, lives) {
  if (LEVELS[phase]?.story) scene.scene.start('story', { phase, lives });
  else scene.scene.start('play', { phase, lives });
}

// ------------------------------------------------------------------ história em quadros

/**
 * Narrativa entre fases: frases curtas, uma por quadro, com uma ilustração do próprio jogo.
 * Enter/Espaço/clique avança; no último quadro, a fase começa.
 */
export class StoryScene extends Phaser.Scene {
  constructor() {
    super('story');
  }

  init(data) {
    this.data_ = data;
    this.page = 0;
  }

  create() {
    this.pages = LEVELS[this.data_.phase].story;
    this.show();
    const next = () => {
      this.page += 1;
      if (this.page >= this.pages.length) this.scene.start('play', { phase: this.data_.phase, lives: this.data_.lives });
      else this.show();
    };
    this.input.keyboard.on('keydown-ENTER', next);
    this.input.keyboard.on('keydown-SPACE', next);
    this.input.on('pointerdown', next);
  }

  show() {
    const W = this.scale.width;
    this.children.removeAll(true);
    const p = this.pages[this.page];
    if (p.art === 'castle3') {
      backdrop(this, 'ice');
      this.add.image(W / 2 + 120, 470, 'castle3').setOrigin(0.5, 1).setScale(0.5);
      this.add.sprite(W / 2 - 60, 472, 'princess', 'wave').setOrigin(0.5, 1).setScale(1.4).setFlipX(true).play('princess-wave');
      this.add.sprite(W / 2 - 150, 472, 'hero', 'idle0').setOrigin(0.5, 1).setScale(1.4).play('hero-idle');
      this.cameras.main.shake(900, 0.006);
    } else if (p.art === 'city') {
      backdrop(this, 'city');
      for (const [x, look] of [[260, 0], [420, 2], [620, 1]]) {
        this.add.sprite(x, 472, `citizen${look}`, 'cower').setOrigin(0.5, 1).setScale(1.3);
      }
      this.cameras.main.shake(1200, 0.005);
    } else {
      backdrop(this, 'city');
      this.add.rectangle(0, 0, W, 540, 0x1a1020, 0.45).setOrigin(0);
      const t = this.add.sprite(W / 2 + 120, 472, 'spikeTitan', 'breath').setOrigin(0.5, 1).setScale(1.2).setFlipX(true);
      this.add.sprite(W / 2 - 220, 472, 'hero', 'attack').setOrigin(0.5, 1).setScale(1.4);
      this.tweens.add({ targets: t, y: 466, yoyo: true, repeat: -1, duration: 600 });
    }
    // caixa de texto
    const g = this.add.graphics();
    g.fillStyle(0x1d1d28, 0.78).fillRoundedRect(40, 40, W - 80, 140, 18);
    g.lineStyle(3, 0xffe07a, 0.9).strokeRoundedRect(40, 40, W - 80, 140, 18);
    this.add
      .text(W / 2, 100, p.text, { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#ffffff', align: 'center', wordWrap: { width: W - 140 } })
      .setOrigin(0.5);
    const more = this.page < this.pages.length - 1 ? 'Enter: continuar' : 'Enter: começar a Fase ' + this.data_.phase;
    const cta = this.add.text(W - 60, 160, more + '  ▶', { fontFamily: FONT, fontSize: '16px', color: '#ffe07a' }).setOrigin(1, 0.5);
    this.tweens.add({ targets: cta, alpha: 0.4, yoyo: true, repeat: -1, duration: 600 });
    this.add.text(60, 160, `${this.page + 1} / ${this.pages.length}`, { fontFamily: FONT, fontSize: '16px', color: '#c8c0d8' }).setOrigin(0, 0.5);
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
    const { outcome, kills, total, timeMs, hp, lives, phase = 1 } = this.result;
    const won = outcome === 'victory';
    const next = won && phase < LAST_PHASE ? phase + 1 : null;
    const finalWin = won && !next;
    const theme = LEVELS[phase]?.theme ?? 'day';
    backdrop(this, theme);
    this.add.rectangle(0, 0, W, 540, won ? 0x1a2a10 : 0x2a0d10, won ? 0.25 : 0.55).setOrigin(0);
    if (won && next) unlock(next);

    if (won) {
      const castle = { day: 'castle', night: 'castle2', ice: 'castle3' }[theme];
      if (castle) this.add.image(W / 2, 470, castle).setOrigin(0.5, 1).setScale(0.55);
      if (theme === 'city') {
        const portal = this.add.image(W / 2 + 60, 360, 'portal').setScale(0.9);
        this.tweens.add({ targets: portal, angle: 360, duration: 6000, repeat: -1 });
        for (const [x, look] of [[W / 2 - 300, 0], [W / 2 - 250, 2], [W / 2 + 230, 1]]) this.add.sprite(x, 472, `citizen${look}`, 'idle').setOrigin(0.5, 1).setScale(1.2).play(`citizen${look}-cheer`);
      }
      const hero = this.add.sprite(W / 2 - 180, 472, 'hero', 'idle0').setOrigin(0.5, 1).setScale(1.5);
      hero.play('hero-idle');
      if (phase === 3) {
        const p = this.add.sprite(W / 2 - 110, 472, 'princess', 'idle').setOrigin(0.5, 1).setScale(1.5).setFlipX(true);
        p.play('princess-wave');
      }
    } else {
      this.add.image(W / 2, 466, 'hero-dead').setOrigin(0.5, 1).setScale(1.8);
    }

    const title = finalWin ? 'VOCÊ É DEMAIS!' : won ? `FASE ${phase} CONCLUÍDA!` : 'FIM DE JOGO';
    const line = finalWin
      ? 'O Pepe salvou a Cidade das Torres e atravessou o portal para um novo mundo!'
      : won && phase === 3
        ? 'O Pepe encontrou a princesa! Mas lá longe, o chão começou a tremer...'
        : won
        ? `O Pepe chegou ao castelo... mas a jornada continua: ${LEVELS[next].name}.`
        : `Os ${LEVELS[phase].enemyWord} venceram desta vez. O castelo ainda espera.`;
    this.add
      .text(W / 2, 96, title, {
        fontFamily: FONT, fontSize: '58px', fontStyle: 'bold', color: won ? '#ffe14a' : '#ff8a8a', stroke: '#1d1d28', strokeThickness: 10,
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 156, line, { fontFamily: FONT, fontSize: '20px', color: '#ffffff', stroke: '#1d1d28', strokeThickness: 5 })
      .setOrigin(0.5);

    const secs = Math.round(timeMs / 1000);
    const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    const stats = won
      ? `Inimigos: ${kills}/${total}     Tempo: ${time}     Energia: ${hp}     Vidas: ${lives}`
      : `Inimigos derrotados: ${kills}/${total}     Tempo: ${time}`;
    this.add
      .text(W / 2, 200, stats, { fontFamily: FONT, fontSize: '17px', color: '#fff6dc', stroke: '#1d1d28', strokeThickness: 4 })
      .setOrigin(0.5);

    // Para onde o Enter leva: próxima fase (levando as vidas), mesma fase de novo, ou início.
    let label;
    let go;
    if (next) {
      const carry = livesForNextPhase(lives);
      label = `Enter: Fase ${next}  (você leva ${carry} vidas)`;
      go = () => startPhase(this, next, carry);
    } else if (finalWin) {
      label = 'Enter: jogar de novo';
      go = () => this.scene.start('title');
    } else {
      label = `Enter: tentar a Fase ${phase} de novo`;
      go = () => this.scene.start('play', { phase });
    }
    this.next = { phase: next, label };
    const cta = this.add
      .text(W / 2, 250, label, { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#ffffff', stroke: '#1d1d28', strokeThickness: 6 })
      .setOrigin(0.5);
    this.tweens.add({ targets: cta, alpha: 0.5, yoyo: true, repeat: -1, duration: 700 });
    if (!won) {
      this.add
        .text(W / 2, 290, 'Esc: voltar ao início', { fontFamily: FONT, fontSize: '16px', color: '#fff6dc', stroke: '#1d1d28', strokeThickness: 4 })
        .setOrigin(0.5);
      this.input.keyboard.once('keydown-ESC', () => this.scene.start('title'));
    }

    this.time.delayedCall(600, () => startOnInput(this, go));
  }
}
