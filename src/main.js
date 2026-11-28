// O Mundo do Pepe: ponto de entrada. Phaser 4.2.1 é carregado como global (vendor/).
import { BootScene, TitleScene, EndScene, StoryScene } from './scenes/MenuScenes.js';
import PlayScene from './scenes/PlayScene.js';
import HudScene from './scenes/HudScene.js';

const debug = new URLSearchParams(location.search).has('debug');

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#5fb3ea',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1500 }, debug } },
  input: { activePointers: 4 },
  scene: [BootScene, TitleScene, StoryScene, PlayScene, HudScene, EndScene], // HUD depois do jogo = desenhado por cima
});

Object.assign(window, { game });
