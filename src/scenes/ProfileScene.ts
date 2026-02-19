import Phaser from 'phaser';
import { Starfield } from '../objects/Starfield';
import { getSession, getUsernameFromMetadata } from '../lib/auth';
import { getSelectedShip, loadShipPreference, saveShipPreference } from '../utils/ShipPreference';
import type { ShipType } from '../utils/ShipPreference';
import type { Session } from '@supabase/supabase-js';

const SHIPS: { type: ShipType; label: string; texture: string }[] = [
  { type: 'xwing', label: 'X-Wing',  texture: 'ship_xwing' },
  { type: 'awing', label: 'A-Wing',  texture: 'ship_awing' },
  { type: 'ywing', label: 'Y-Wing',  texture: 'ship_ywing' },
];

// x positions of the three panels (canvas width 480)
const PANEL_XS = [88, 240, 392];
const PANEL_Y  = 340;
const PANEL_W  = 116;
const PANEL_H  = 150;

export class ProfileScene extends Phaser.Scene {
  private starfield!: Starfield;
  private borders: Phaser.GameObjects.Rectangle[] = [];
  private labels: Phaser.GameObjects.Text[] = [];
  private selected: ShipType = getSelectedShip();

  constructor() {
    super({ key: 'ProfileScene' });
  }

  create(): void {
    this.starfield = new Starfield(this);
    this.borders = [];
    this.labels = [];
    this.selected = getSelectedShip();

    // Title
    this.add.text(240, 60, 'Profile', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Username / Set Username area
    getSession().then((session: Session | null) => {
      if (session) {
        const username = getUsernameFromMetadata(session.user);
        const hasCustomUsername = !!session.user.user_metadata?.custom_username;

        if (hasCustomUsername) {
          const usernameText = this.add.text(240, 120, `\u{1F464} ${username}`, {
            fontSize: '18px',
            color: '#aaffaa',
            fontFamily: 'monospace',
          }).setOrigin(0.5).setInteractive({ useHandCursor: true });
          usernameText.on('pointerdown', () => this.scene.start('UsernameScene', {}));

          this.add.text(240, 148, 'Tap to edit username', {
            fontSize: '12px',
            color: '#666666',
            fontFamily: 'monospace',
          }).setOrigin(0.5);
        } else {
          const setUsernameBg = this.add
            .rectangle(240, 120, 160, 36, 0x1a4d1a)
            .setInteractive({ useHandCursor: true });
          this.add.text(240, 120, 'Set Username', {
            fontSize: '16px',
            color: '#88ff88',
            fontFamily: 'monospace',
          }).setOrigin(0.5);
          setUsernameBg.on('pointerdown', () => this.scene.start('UsernameScene', {}));
          setUsernameBg.on('pointerover', () => setUsernameBg.setAlpha(0.8));
          setUsernameBg.on('pointerout', () => setUsernameBg.setAlpha(1));
        }
      } else {
        // Guest
        this.add.text(240, 120, 'Playing as Guest', {
          fontSize: '16px',
          color: '#888888',
          fontFamily: 'monospace',
        }).setOrigin(0.5);
      }
    });

    // Ship selection label
    this.add.text(240, 190, 'Choose your ship', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Ship panels
    SHIPS.forEach(({ type, label, texture }, i) => {
      const px = PANEL_XS[i];

      // Panel border (highlight = selected)
      const border = this.add
        .rectangle(px, PANEL_Y, PANEL_W, PANEL_H, 0x000000, 0)
        .setStrokeStyle(2, this.selected === type ? 0x00ccff : 0x333333)
        .setInteractive({ useHandCursor: true });
      this.borders.push(border);

      // Ship sprite preview
      const shipSprite = this.add.image(px, PANEL_Y - 20, texture).setScale(2.5).setDepth(1);

      // Label
      const labelText = this.add.text(px, PANEL_Y + 54, label, {
        fontSize: '13px',
        color: this.selected === type ? '#00ccff' : '#888888',
        fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(1);
      this.labels.push(labelText);

      border.on('pointerdown', () => {
        this.selectShip(type);
        // Re-tint sprite briefly to confirm tap
        shipSprite.setTint(0xffffff);
        this.time.delayedCall(80, () => shipSprite.clearTint());
      });
      border.on('pointerover', () => { if (this.selected !== type) border.setStrokeStyle(2, 0x555555); });
      border.on('pointerout',  () => { if (this.selected !== type) border.setStrokeStyle(2, 0x333333); });
    });

    // Back button
    const backBg = this.add
      .rectangle(240, 520, 160, 44, 0x222222)
      .setInteractive({ useHandCursor: true });
    this.add.text(240, 520, 'Back', {
      fontSize: '18px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    backBg.on('pointerdown', () => this.scene.start('MenuScene'));
    backBg.on('pointerover', () => backBg.setAlpha(0.8));
    backBg.on('pointerout',  () => backBg.setAlpha(1));

    // Sync from DB — may override the localStorage value shown initially
    loadShipPreference().then(ship => {
      if (ship !== this.selected) {
        this.selected = ship;
        this.refreshPanels();
      }
    });
  }

  private refreshPanels(): void {
    SHIPS.forEach(({ type }, i) => {
      const isSelected = type === this.selected;
      this.borders[i].setStrokeStyle(2, isSelected ? 0x00ccff : 0x333333);
      this.labels[i].setColor(isSelected ? '#00ccff' : '#888888');
    });
  }

  private selectShip(type: ShipType): void {
    this.selected = type;
    this.refreshPanels();
    saveShipPreference(type).catch(console.error);
  }

  update(_time: number, delta: number): void {
    this.starfield.update(delta);
  }
}
