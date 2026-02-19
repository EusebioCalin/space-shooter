import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { LoginScene } from './scenes/LoginScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { GameScene } from './scenes/GameScene';
import { UsernameScene } from './scenes/UsernameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 480,
  height: 800,
  parent: document.body,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, LoginScene, LeaderboardScene, GameScene, UsernameScene],
  input: {
    activePointers: 2,
  },
};

new Phaser.Game(config);


