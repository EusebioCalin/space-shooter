import Phaser from 'phaser';
import { Starfield } from '../objects/Starfield';
import { getSession, signOut, getUsernameFromMetadata } from '../lib/auth';
import { loadShipPreference } from '../utils/ShipPreference';
import type { Session } from '@supabase/supabase-js';

export class MenuScene extends Phaser.Scene {
  private starfield!: Starfield;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.starfield = new Starfield(this);

    // Title
    this.add.text(240, 260, 'Space', {
      fontSize: '48px',
      color: '#00ccff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(240, 320, 'Madness', {
      fontSize: '48px',
      color: '#00ccff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Blinking "Tap to Start"
    const startText = this.add.text(240, 470, 'Tap to Start', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Leaderboard button
    const lbBg = this.add
      .rectangle(240, 540, 220, 48, 0x003366)
      .setInteractive({ useHandCursor: true });
    this.add.text(240, 540, 'LEADERBOARD', {
      fontSize: '18px',
      color: '#00ccff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    lbBg.on('pointerover', () => lbBg.setAlpha(0.8));
    lbBg.on('pointerout', () => lbBg.setAlpha(1));

    // Load session to show auth state
    getSession().then((session: Session | null) => {
      if (session) {
        loadShipPreference(); // sync DB → localStorage before game starts
        const username = getUsernameFromMetadata(session.user);
        const hasCustomUsername = !!session.user.user_metadata?.custom_username;

        if (hasCustomUsername) {
          // Username top-LEFT, tappable → ProfileScene
          const usernameText = this.add.text(16, 14, `\u{1F464} ${username}`, {
            fontSize: '14px',
            color: '#aaffaa',
            fontFamily: 'monospace',
          }).setOrigin(0, 0).setDepth(10).setInteractive({ useHandCursor: true });
          usernameText.on('pointerdown', () => this.scene.start('ProfileScene'));
        } else {
          // No custom username yet — "Set Username" top-LEFT → ProfileScene
          const setUsernameBg = this.add
            .rectangle(62, 14, 110, 26, 0x1a4d1a)
            .setDepth(10)
            .setInteractive({ useHandCursor: true });
          this.add.text(62, 14, 'Set Username', {
            fontSize: '13px',
            color: '#88ff88',
            fontFamily: 'monospace',
          }).setOrigin(0.5).setDepth(11);
          setUsernameBg.on('pointerdown', () => this.scene.start('ProfileScene'));
          setUsernameBg.on('pointerover', () => setUsernameBg.setAlpha(0.8));
          setUsernameBg.on('pointerout', () => setUsernameBg.setAlpha(1));
        }

        // Sign Out — top-RIGHT, away from username
        const signOutBg = this.add
          .rectangle(440, 14, 88, 26, 0x330000)
          .setDepth(10)
          .setInteractive({ useHandCursor: true });
        this.add.text(440, 14, 'Sign Out', {
          fontSize: '13px',
          color: '#ff8888',
          fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(11);
        signOutBg.on('pointerdown', async () => { await signOut(); this.scene.restart(); });
        signOutBg.on('pointerover', () => signOutBg.setAlpha(0.8));
        signOutBg.on('pointerout', () => signOutBg.setAlpha(1));
      }

      // Leaderboard tap handler (set after session check)
      lbBg.on('pointerdown', () => {
        if (session) {
          this.scene.start('LeaderboardScene');
        } else {
          this.scene.start('LoginScene', { returnTo: 'leaderboard' });
        }
      });
    });

    // Start on tap — only when no interactive object was tapped
    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, targets: Phaser.GameObjects.GameObject[]) => {
      if (targets.length === 0) {
        this.scene.start('GameScene');
      }
    });
  }

  update(_time: number, delta: number): void {
    this.starfield.update(delta);
  }
}
