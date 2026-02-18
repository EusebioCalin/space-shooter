import Phaser from 'phaser';
import { Ship } from '../objects/Ship';
import { Asteroid } from '../objects/Asteroid';
import type { AsteroidSize } from '../objects/Asteroid';
import { EnemyShip } from '../objects/EnemyShip';
import type { EnemyType } from '../objects/EnemyShip';
import { EnemyBullet } from '../objects/EnemyBullet';
import { Starfield } from '../objects/Starfield';
import { screenShake } from '../utils/ScreenShake';
import { getSession, saveScore } from '../lib/auth';

export class GameScene extends Phaser.Scene {
  private ship!: Ship;
  private asteroids!: Phaser.Physics.Arcade.Group;
  private starfield!: Starfield;

  private score = 0;
  private lives = 3;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;

  private enemies!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private enemySpawnTimer = 0;
  private enemySpawnInterval = 8000;

  private spawnTimer = 0;
  private spawnInterval = 1200; // ms
  private elapsed = 0;
  private invincible = false;
  private gameOver = false;
  private paused = false;
  private pauseOverlay: Phaser.GameObjects.GameObject[] = [];
  private pauseBtn!: Phaser.GameObjects.Rectangle;
  private pauseBtnText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Reset state
    this.score = 0;
    this.lives = 3;
    this.spawnTimer = 0;
    this.spawnInterval = 1200;
    this.elapsed = 0;
    this.invincible = false;
    this.gameOver = false;
    this.paused = false;
    this.pauseOverlay = [];
    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 8000;

    this.starfield = new Starfield(this);
    this.ship = new Ship(this);

    this.asteroids = this.physics.add.group({
      classType: Asteroid,
      runChildUpdate: true,
    });

    this.enemies = this.physics.add.group({
      classType: EnemyShip,
      runChildUpdate: true,
    });

    this.enemyBullets = this.physics.add.group({
      classType: EnemyBullet,
      runChildUpdate: true,
    });

    // Bullet-asteroid collision
    this.physics.add.overlap(
      this.ship.bullets,
      this.asteroids,
      this.onBulletHitAsteroid as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Ship-asteroid collision
    this.physics.add.overlap(
      this.ship,
      this.asteroids,
      this.onShipHitAsteroid as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Bullet-enemy collision
    this.physics.add.overlap(
      this.ship.bullets,
      this.enemies,
      this.onBulletHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Enemy bullet-ship collision
    this.physics.add.overlap(
      this.ship,
      this.enemyBullets,
      this.onEnemyBulletHitShip as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Ship-enemy collision
    this.physics.add.overlap(
      this.ship,
      this.enemies,
      this.onShipHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // HUD
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setDepth(100).setScrollFactor(0);

    this.livesText = this.add.text(464, 16, 'Lives: 3', {
      fontSize: '18px',
      color: '#ff4444',
      fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

    // Pause button
    this.pauseBtn = this.add.rectangle(240, 20, 44, 26, 0x222222, 0.7)
      .setDepth(100).setScrollFactor(0).setInteractive({ useHandCursor: true });
    this.pauseBtnText = this.add.text(240, 20, 'II', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
    this.pauseBtn.on('pointerdown', () => this.showPauseMenu());

    // Touch input
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.paused || this.gameOver) return;
      this.ship.handleInput(pointer);
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.paused || this.gameOver) return;
      this.ship.handleInput(pointer);
    });
  }

  update(_time: number, delta: number): void {
    if (this.paused || this.gameOver) return;

    this.starfield.update(delta);
    this.elapsed += delta;

    // Increase difficulty over time
    this.spawnInterval = Math.max(300, 1200 - this.elapsed * 0.01);

    // Spawn asteroids
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnAsteroid();
    }

    // Spawn enemies
    this.enemySpawnInterval = Math.max(3500, 8000 - this.elapsed * 0.008);
    this.enemySpawnTimer += delta;
    if (this.enemySpawnTimer >= this.enemySpawnInterval) {
      this.enemySpawnTimer = 0;
      this.spawnEnemy();
    }
  }

  private spawnAsteroid(): void {
    const x = Phaser.Math.Between(30, 450);
    const roll = Math.random();
    let size: AsteroidSize;
    if (roll < 0.3) size = 'large';
    else if (roll < 0.65) size = 'medium';
    else size = 'small';

    const asteroid = new Asteroid(this, x, -40, size);
    this.asteroids.add(asteroid);
    asteroid.launch();
  }

  private spawnEnemy(): void {
    const x = Phaser.Math.Between(40, 440);
    const type: EnemyType = Math.random() < 0.7 ? 'scout' : 'gunship';
    const enemy = new EnemyShip(this, x, -50, type, this.enemyBullets);
    this.enemies.add(enemy);
    enemy.launch();
  }

  private onBulletHitEnemy(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
    const enemy = enemyObj as EnemyShip;

    if (!bullet.active || !enemy.active) return;

    bullet.destroy();

    const destroyed = enemy.takeDamage();
    if (destroyed) {
      this.score += enemy.scoreValue;
      this.scoreText.setText(`Score: ${this.score}`);

      this.add.particles(enemy.x, enemy.y, 'particle_explosion', {
        speed: { min: 50, max: 200 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 400,
        quantity: 12,
        tint: [0xff2222, 0xff6633, 0xffaa33],
        emitting: false,
      }).explode(12);

      enemy.destroy();
    }
  }

  private onEnemyBulletHitShip(
    _shipObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    if (this.invincible || this.gameOver) return;

    const bullet = bulletObj as EnemyBullet;
    if (!bullet.active) return;

    bullet.destroy();

    this.lives--;
    this.livesText.setText(`Lives: ${this.lives}`);
    this.ship.flash();
    screenShake(this.cameras.main, 0.015, 200);

    this.invincible = true;
    this.ship.setAlpha(0.5);

    const blinkEvent = this.time.addEvent({
      delay: 100,
      repeat: 15,
      callback: () => {
        if (this.ship.active) {
          this.ship.setAlpha(this.ship.alpha === 1 ? 0.3 : 1);
        }
      },
    });

    this.time.delayedCall(1600, () => {
      this.invincible = false;
      if (this.ship.active) this.ship.setAlpha(1);
      blinkEvent.destroy();
    });

    if (this.lives <= 0) {
      this.showGameOver();
    }
  }

  private onShipHitEnemy(
    _shipObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    if (this.invincible || this.gameOver) return;

    const enemy = enemyObj as EnemyShip;
    if (!enemy.active) return;

    enemy.destroy();

    this.lives--;
    this.livesText.setText(`Lives: ${this.lives}`);
    this.ship.flash();
    screenShake(this.cameras.main, 0.02, 200);

    this.invincible = true;
    this.ship.setAlpha(0.5);

    const blinkEvent = this.time.addEvent({
      delay: 100,
      repeat: 15,
      callback: () => {
        if (this.ship.active) {
          this.ship.setAlpha(this.ship.alpha === 1 ? 0.3 : 1);
        }
      },
    });

    this.time.delayedCall(1600, () => {
      this.invincible = false;
      if (this.ship.active) this.ship.setAlpha(1);
      blinkEvent.destroy();
    });

    if (this.lives <= 0) {
      this.showGameOver();
    }
  }

  private onBulletHitAsteroid(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    asteroidObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
    const asteroid = asteroidObj as Asteroid;

    if (!bullet.active || !asteroid.active) return;

    bullet.destroy();

    const destroyed = asteroid.takeDamage();
    if (destroyed) {
      this.score += asteroid.scoreValue;
      this.scoreText.setText(`Score: ${this.score}`);

      // Explosion particles
      this.add.particles(asteroid.x, asteroid.y, 'particle_explosion', {
        speed: { min: 50, max: 200 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 400,
        quantity: 12,
        tint: [0xff6633, 0xffaa33, 0xffdd66],
        emitting: false,
      }).explode(12);

      // Split into smaller asteroids flying apart diagonally
      const splitSize = asteroid.getSplitSize();
      if (splitSize) {
        const directions = [-1, 1];
        for (const dir of directions) {
          const child = new Asteroid(this, asteroid.x + dir * 12, asteroid.y, splitSize);
          this.asteroids.add(child);
          child.launch();
          child.setVelocityX(dir * Phaser.Math.Between(60, 130));
        }
      }

      asteroid.destroy();
    }
  }

  private onShipHitAsteroid(
    shipObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    asteroidObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    if (this.invincible || this.gameOver) return;

    const asteroid = asteroidObj as Asteroid;
    if (!asteroid.active) return;

    asteroid.destroy();

    this.lives--;
    this.livesText.setText(`Lives: ${this.lives}`);
    this.ship.flash();
    screenShake(this.cameras.main, 0.015, 200);

    // Brief invincibility
    this.invincible = true;
    this.ship.setAlpha(0.5);

    // Blink effect
    const blinkEvent = this.time.addEvent({
      delay: 100,
      repeat: 15,
      callback: () => {
        if (this.ship.active) {
          this.ship.setAlpha(this.ship.alpha === 1 ? 0.3 : 1);
        }
      },
    });

    this.time.delayedCall(1600, () => {
      this.invincible = false;
      if (this.ship.active) this.ship.setAlpha(1);
      blinkEvent.destroy();
    });

    if (this.lives <= 0) {
      this.showGameOver();
    }
  }

  private showPauseMenu(): void {
    this.paused = true;

    const dim = this.add.rectangle(240, 400, 480, 800, 0x000000, 0.72)
      .setDepth(150).setScrollFactor(0);

    const title = this.add.text(240, 310, 'PAUSED', {
      fontSize: '32px',
      color: '#00ffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(151).setScrollFactor(0);

    const resumeBg = this.add.rectangle(240, 410, 220, 54, 0x1a6b1a)
      .setDepth(151).setScrollFactor(0).setInteractive({ useHandCursor: true });
    const resumeText = this.add.text(240, 410, 'Resume', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(152).setScrollFactor(0);

    const quitBg = this.add.rectangle(240, 490, 220, 54, 0x444444)
      .setDepth(151).setScrollFactor(0).setInteractive({ useHandCursor: true });
    const quitText = this.add.text(240, 490, 'Quit to Menu', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(152).setScrollFactor(0);

    resumeBg.on('pointerdown', () => this.hidePauseMenu());
    resumeBg.on('pointerover', () => resumeBg.setAlpha(0.75));
    resumeBg.on('pointerout', () => resumeBg.setAlpha(1));

    quitBg.on('pointerdown', () => this.scene.start('MenuScene'));
    quitBg.on('pointerover', () => quitBg.setAlpha(0.75));
    quitBg.on('pointerout', () => quitBg.setAlpha(1));

    this.pauseOverlay = [dim, title, resumeBg, resumeText, quitBg, quitText];
  }

  private hidePauseMenu(): void {
    this.paused = false;
    this.pauseOverlay.forEach(obj => obj.destroy());
    this.pauseOverlay = [];
  }

  private showGameOver(): void {
    this.gameOver = true;
    this.ship.setVisible(false);
    this.ship.setActive(false);
    this.pauseBtn.setVisible(false);
    this.pauseBtnText.setVisible(false);

    // Darken overlay
    const overlay = this.add.rectangle(240, 400, 480, 800, 0x000000, 0.6);
    overlay.setDepth(90);

    this.add.text(240, 300, 'GAME OVER', {
      fontSize: '40px',
      color: '#ff4444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    this.add.text(240, 370, `Score: ${this.score}`, {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(100);

    const finalScore = this.score;

    // Auth-aware score saving
    getSession().then((session) => {
      if (session) {
        // Logged in: auto-save
        const savingText = this.add.text(240, 430, 'Saving score…', {
          fontSize: '16px',
          color: '#aaaaaa',
          fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(100);

        saveScore(finalScore)
          .then(() => {
            savingText.setText('Score saved!').setColor('#44ff88');
          })
          .catch(() => {
            savingText.setText('Save failed').setColor('#ff4444');
          });
      } else {
        // Guest: show Save Score button
        const saveBg = this.add
          .rectangle(240, 430, 200, 46, 0x0055aa)
          .setDepth(100)
          .setInteractive({ useHandCursor: true });
        this.add.text(240, 430, 'Save Score', {
          fontSize: '18px',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(101);
        saveBg.on('pointerdown', () => {
          this.scene.start('LoginScene', { returnTo: 'game-over', score: finalScore });
        });
        saveBg.on('pointerover', () => saveBg.setAlpha(0.8));
        saveBg.on('pointerout', () => saveBg.setAlpha(1));
      }
    });

    const restartText = this.add.text(240, 500, 'Tap to Restart', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: restartText,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Wait a moment before allowing restart to prevent accidental taps
    this.time.delayedCall(800, () => {
      this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, targets: Phaser.GameObjects.GameObject[]) => {
        if (targets.length === 0) {
          this.scene.restart();
        }
      });
    });
  }
}
