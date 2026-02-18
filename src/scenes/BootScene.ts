import Phaser from 'phaser';
import { generateAssets } from '../utils/AssetGenerator';
import { consumePendingAuthState, getSession, saveScore } from '../lib/auth';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.image('planet1', '/assets/planet1.png');
    this.load.image('planet2', '/assets/planet2.png');
    this.load.image('planet3', '/assets/planet3.png');

    console.log('BootScene preload: Assets are being loaded.');
  }

  create(): void {
    const text = this.add.text(240, 400, 'Loading...', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    text.setOrigin(0.5);

    generateAssets(this);

    this.handleStartup();
  }

  private async handleStartup(): Promise<void> {
    const pendingState = consumePendingAuthState();
    const session = await getSession();

    if (pendingState && session) {
      if (pendingState.returnTo === 'game-over' && pendingState.score !== undefined) {
        try {
          await saveScore(pendingState.score);
          const saved = this.add.text(240, 450, 'Score saved!', {
            fontSize: '20px',
            color: '#44ff88',
            fontFamily: 'monospace',
          });
          saved.setOrigin(0.5);
          this.time.delayedCall(1200, () => this.scene.start('MenuScene'));
        } catch {
          this.scene.start('MenuScene');
        }
      } else {
        this.scene.start('LeaderboardScene');
      }
    } else if (pendingState && !session) {
      // OAuth was cancelled — clear stale state, go to menu normally
      this.time.delayedCall(300, () => this.scene.start('MenuScene'));
    } else {
      this.time.delayedCall(300, () => this.scene.start('MenuScene'));
    }
  }
}
