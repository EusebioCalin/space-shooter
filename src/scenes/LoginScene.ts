import Phaser from 'phaser';
import { Starfield } from '../objects/Starfield';
import { signInWithGoogle, signInWithApple } from '../lib/auth';
import type { PendingAuthState } from '../lib/auth';

interface LoginSceneData {
  returnTo: 'leaderboard' | 'game-over';
  score?: number;
}

export class LoginScene extends Phaser.Scene {
  private starfield!: Starfield;
  private sceneData!: LoginSceneData;

  constructor() {
    super({ key: 'LoginScene' });
  }

  init(data: LoginSceneData): void {
    this.sceneData = data;
  }

  create(): void {
    this.starfield = new Starfield(this);

    // Semi-transparent overlay panel
    this.add.rectangle(240, 400, 360, 440, 0x000000, 0.75).setDepth(1);

    this.add.text(240, 220, 'SIGN IN', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2);

    const statusText = this.add.text(240, 570, '', {
      fontSize: '16px',
      color: '#ff4444',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(2);

    // Button factory
    const makeButton = (
      y: number,
      label: string,
      bgColor: number,
      textColor: string,
      onClick: () => void
    ): { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text } => {
      const bg = this.add.rectangle(240, y, 280, 52, bgColor).setDepth(2).setInteractive({ useHandCursor: true });
      const text = this.add.text(240, y, label, {
        fontSize: '17px',
        color: textColor,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(3);

      bg.on('pointerdown', onClick);
      bg.on('pointerover', () => bg.setAlpha(0.85));
      bg.on('pointerout', () => bg.setAlpha(1));

      return { bg, text };
    };

    const pendingState: PendingAuthState = {
      returnTo: this.sceneData.returnTo,
      score: this.sceneData.score,
    };

    const googleBtn = makeButton(310, 'Sign in with Google', 0x4285f4, '#ffffff', () => {
      googleBtn.bg.disableInteractive();
      appleBtn.bg.disableInteractive();
      statusText.setText('Redirecting to sign in…').setColor('#aaaaaa');
      signInWithGoogle(pendingState).catch((err) => {
        console.error(err);
        googleBtn.bg.setInteractive({ useHandCursor: true });
        appleBtn.bg.setInteractive({ useHandCursor: true });
        statusText.setText('Sign in failed — try again').setColor('#ff4444');
      });
    });

    const appleBtn = makeButton(380, 'Sign in with Apple', 0x000000, '#ffffff', () => {
      googleBtn.bg.disableInteractive();
      appleBtn.bg.disableInteractive();
      statusText.setText('Redirecting to sign in…').setColor('#aaaaaa');
      signInWithApple(pendingState).catch((err) => {
        console.error(err);
        googleBtn.bg.setInteractive({ useHandCursor: true });
        appleBtn.bg.setInteractive({ useHandCursor: true });
        statusText.setText('Sign in failed — try again').setColor('#ff4444');
      });
    });
    // Add white border for Apple button visibility
    this.add.rectangle(240, 380, 280, 52).setStrokeStyle(1, 0xffffff).setDepth(2);

    if (this.sceneData.returnTo === 'leaderboard') {
      makeButton(450, 'Continue as Guest', 0x555555, '#cccccc', () => {
        this.scene.start('LeaderboardScene');
      });
    }
  }

  update(_time: number, delta: number): void {
    this.starfield.update(delta);
  }
}
