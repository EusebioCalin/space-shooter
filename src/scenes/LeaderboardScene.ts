import Phaser from 'phaser';
import { Starfield } from '../objects/Starfield';
import { getLeaderboard, getSession } from '../lib/auth';

export class LeaderboardScene extends Phaser.Scene {
  private starfield!: Starfield;

  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  create(): void {
    this.starfield = new Starfield(this);

    // Title
    this.add.text(240, 60, 'LEADERBOARD', {
      fontSize: '28px',
      color: '#00ccff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2);

    const loadingText = this.add.text(240, 400, 'Loading…', {
      fontSize: '20px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(2);

    // Back button
    const backBg = this.add
      .rectangle(240, 740, 160, 48, 0x333333)
      .setDepth(2)
      .setInteractive({ useHandCursor: true });
    this.add.text(240, 740, 'Back', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(3);
    backBg.on('pointerdown', () => this.scene.start('MenuScene'));
    backBg.on('pointerover', () => backBg.setAlpha(0.8));
    backBg.on('pointerout', () => backBg.setAlpha(1));

    this.loadScores(loadingText);
  }

  private async loadScores(loadingText: Phaser.GameObjects.Text): Promise<void> {
    try {
      const [scores, session] = await Promise.all([getLeaderboard(), getSession()]);
      loadingText.destroy();

      if (scores.length === 0) {
        this.add.text(240, 400, 'No scores yet — be the first!', {
          fontSize: '18px',
          color: '#888888',
          fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(2);
        return;
      }

      const currentUsername =
        session?.user?.user_metadata?.full_name ||
        session?.user?.email?.split('@')[0] ||
        null;

      const startY = 120;
      const rowHeight = 52;

      scores.forEach((entry, i) => {
        const y = startY + i * rowHeight;
        const isCurrentUser = currentUsername && entry.username === currentUsername;

        // Alternating row shading
        const rowColor = i % 2 === 0 ? 0x111122 : 0x0a0a1a;
        const rowBg = this.add.rectangle(240, y + 16, 420, rowHeight - 4, rowColor, 0.85).setDepth(1);

        if (isCurrentUser) {
          rowBg.setFillStyle(0x443300, 0.9);
          rowBg.setStrokeStyle(1, 0xffcc00);
        }

        // Rank
        this.add.text(50, y + 16, `#${i + 1}`, {
          fontSize: '16px',
          color: isCurrentUser ? '#ffcc00' : '#aaaaaa',
          fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(2);

        // Username
        this.add.text(180, y + 16, entry.username, {
          fontSize: '16px',
          color: isCurrentUser ? '#ffcc00' : '#ffffff',
          fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(2);

        // Score
        this.add.text(390, y + 16, entry.score.toString(), {
          fontSize: '16px',
          color: isCurrentUser ? '#ffcc00' : '#00ccff',
          fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(2);
      });
    } catch (err) {
      console.error(err);
      loadingText.setText('Failed to load scores').setColor('#ff4444');
    }
  }

  update(_time: number, delta: number): void {
    this.starfield.update(delta);
  }
}
