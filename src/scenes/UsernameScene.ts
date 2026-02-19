import Phaser from 'phaser';
import { Starfield } from '../objects/Starfield';
import { setCustomUsername, saveScore } from '../lib/auth';
import type { PendingAuthState } from '../lib/auth';

export class UsernameScene extends Phaser.Scene {
  private starfield!: Starfield;
  private inputEl!: HTMLInputElement;
  private errorText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UsernameScene' });
  }

  create(): void {
    const pendingState = (this.scene.settings.data as { pendingState?: PendingAuthState })
      ?.pendingState;

    this.starfield = new Starfield(this);

    this.add.text(240, 280, 'Choose your username', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(240, 316, '3–20 chars · letters, numbers, underscores', {
      fontSize: '13px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // HTML input overlay
    this.inputEl = this.createInputOverlay();

    // Confirm button
    const confirmBg = this.add
      .rectangle(240, 470, 220, 50, 0x1a6b1a)
      .setInteractive({ useHandCursor: true });
    this.add.text(240, 470, 'Confirm', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    confirmBg.on('pointerover', () => confirmBg.setAlpha(0.8));
    confirmBg.on('pointerout', () => confirmBg.setAlpha(1));
    confirmBg.on('pointerdown', () => this.handleConfirm(pendingState));

    this.errorText = this.add.text(240, 535, '', {
      fontSize: '13px',
      color: '#ff4444',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setVisible(false);

    // Cancel button — only shown when editing an existing username (no pendingState)
    if (!pendingState) {
      const cancelBg = this.add
        .rectangle(240, 578, 160, 40, 0x222222)
        .setInteractive({ useHandCursor: true });
      this.add.text(240, 578, 'Cancel', {
        fontSize: '16px',
        color: '#aaaaaa',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
      cancelBg.on('pointerover', () => cancelBg.setAlpha(0.8));
      cancelBg.on('pointerout', () => cancelBg.setAlpha(1));
      cancelBg.on('pointerdown', () => this.scene.start('MenuScene'));
    }

    // Clean up input on scene shutdown
    this.events.once('shutdown', () => this.inputEl.remove());
  }

  private createInputOverlay(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 20;
    input.placeholder = 'your_username';

    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / (this.game.config.width as number);
    const scaleY = rect.height / (this.game.config.height as number);

    const inputW = 260 * scaleX;
    const inputH = 44 * scaleY;
    const inputX = rect.left + 240 * scaleX - inputW / 2;
    const inputY = rect.top + 390 * scaleY - inputH / 2;

    Object.assign(input.style, {
      position: 'fixed',
      left: `${inputX}px`,
      top: `${inputY}px`,
      width: `${inputW}px`,
      height: `${inputH}px`,
      background: '#111111',
      border: '1px solid #444444',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontSize: `${14 * Math.min(scaleX, scaleY)}px`,
      textAlign: 'center',
      outline: 'none',
      borderRadius: '4px',
      zIndex: '1000',
      boxSizing: 'border-box',
      padding: '0 8px',
    });

    document.body.appendChild(input);
    input.focus();
    return input;
  }

  private async handleConfirm(pendingState?: PendingAuthState): Promise<void> {
    const value = this.inputEl.value.trim();

    if (value.length < 3 || value.length > 20) {
      this.showError('Username must be 3–20 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      this.showError('Only letters, numbers, and underscores allowed.');
      return;
    }

    this.errorText.setVisible(false);

    try {
      await setCustomUsername(value);

      if (pendingState?.returnTo === 'game-over' && pendingState.score !== undefined) {
        await saveScore(pendingState.score);
        this.scene.start('MenuScene');
      } else if (pendingState?.returnTo === 'leaderboard') {
        this.scene.start('LeaderboardScene');
      } else {
        this.scene.start('MenuScene');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      this.showError(msg);
    }
  }

  private showError(msg: string): void {
    this.errorText.setText(msg).setVisible(true);
  }

  update(_time: number, delta: number): void {
    this.starfield.update(delta);
  }
}
