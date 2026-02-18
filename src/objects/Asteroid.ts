import Phaser from 'phaser';

export type AsteroidSize = 'large' | 'medium' | 'small';

const SIZE_CONFIG: Record<AsteroidSize, { texture: string; hp: number; score: number; speed: [number, number]; scale: number }> = {
  large:  { texture: 'asteroid_large',  hp: 3, score: 30, speed: [60, 120],  scale: 1 },
  medium: { texture: 'asteroid_medium', hp: 2, score: 20, speed: [80, 150],  scale: 1 },
  small:  { texture: 'asteroid_small',  hp: 1, score: 10, speed: [100, 200], scale: 1 },
};

export class Asteroid extends Phaser.Physics.Arcade.Sprite {
  size: AsteroidSize;
  hp: number;
  scoreValue: number;
  private rotSpeed: number;
  private speedY: number;
  private speedX: number;

  constructor(scene: Phaser.Scene, x: number, y: number, size: AsteroidSize) {
    const cfg = SIZE_CONFIG[size];
    super(scene, x, y, cfg.texture);

    this.size = size;
    this.hp = cfg.hp;
    this.scoreValue = cfg.score;

    scene.add.existing(this);

    this.speedY = Phaser.Math.Between(cfg.speed[0], cfg.speed[1]);
    this.speedX = Phaser.Math.Between(-30, 30);
    this.setScale(cfg.scale);
    this.setDepth(3);

    this.rotSpeed = Phaser.Math.FloatBetween(-2, 2);
  }

  launch(): void {
    this.setVelocityY(this.speedY);
    this.setVelocityX(this.speedX);
  }

  takeDamage(): boolean {
    this.hp--;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) this.clearTint();
    });
    return this.hp <= 0;
  }

  getSplitSize(): AsteroidSize | null {
    if (this.size === 'large') return 'medium';
    if (this.size === 'medium') return 'small';
    return null;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.rotation += this.rotSpeed * (delta / 1000);

    if (this.y > 850) {
      this.destroy();
    }
  }
}
