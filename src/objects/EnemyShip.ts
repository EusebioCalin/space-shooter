import Phaser from 'phaser';
import { EnemyBullet } from './EnemyBullet';

export type EnemyType = 'scout' | 'gunship' | 'destroyer';

const ENEMY_CONFIG: Record<EnemyType, {
  texture: string;
  hp: number;
  score: number;
  speedY: number;
  driftAmplitude: number;
  driftFrequency: number;
  fireRate: number;
  bulletSpread: number;
  scale: number;
  burstCount: number;
}> = {
  scout:     { texture: 'enemy_scout',     hp: 2,  score: 50,  speedY: 120, driftAmplitude: 100, driftFrequency: 0.6, fireRate: 2500, bulletSpread: 70, scale: 1.1, burstCount: 1 },
  gunship:   { texture: 'enemy_gunship',   hp: 5,  score: 150, speedY: 75,  driftAmplitude: 30,  driftFrequency: 0.7, fireRate: 1200, bulletSpread: 30, scale: 1.0, burstCount: 1 },
  destroyer: { texture: 'enemy_destroyer', hp: 12, score: 400, speedY: 45,  driftAmplitude: 15,  driftFrequency: 0.3, fireRate: 1800, bulletSpread: 20, scale: 1.3, burstCount: 3 },
};

export class EnemyShip extends Phaser.Physics.Arcade.Sprite {
  readonly scoreValue: number;
  private hp: number;
  private cfg: typeof ENEMY_CONFIG[EnemyType];
  private spawnX: number;
  private age = 0;
  private fireTimer = 0;
  private enemyBullets: Phaser.Physics.Arcade.Group;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: EnemyType,
    enemyBullets: Phaser.Physics.Arcade.Group
  ) {
    const cfg = ENEMY_CONFIG[type];
    super(scene, x, y, cfg.texture);

    this.cfg = cfg;
    this.hp = cfg.hp;
    this.scoreValue = cfg.score;
    this.spawnX = x;
    this.enemyBullets = enemyBullets;

    scene.add.existing(this);
    this.setScale(cfg.scale);
    this.setDepth(3);
  }

  launch(): void {
    this.setVelocityY(this.cfg.speedY);
    this.setVelocityX(0);
  }

  takeDamage(): boolean {
    this.hp--;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) this.clearTint();
    });
    return this.hp <= 0;
  }

  private fire(): void {
    const count = this.cfg.burstCount;
    for (let i = 0; i < count; i++) {
      const spread = count === 1
        ? Phaser.Math.Between(-this.cfg.bulletSpread, this.cfg.bulletSpread)
        : Phaser.Math.Linear(-this.cfg.bulletSpread, this.cfg.bulletSpread, i / (count - 1));
      const bullet = new EnemyBullet(this.scene, this.x, this.y + 10);
      this.enemyBullets.add(bullet);
      bullet.launch(spread);
    }
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    this.age += delta;
    this.fireTimer += delta;

    // Horizontal sine weave
    const freq = this.cfg.driftFrequency;
    const amplitude = this.cfg.driftAmplitude;
    this.x = Phaser.Math.Clamp(
      this.spawnX + Math.sin((this.age / 1000) * freq * Math.PI * 2) * amplitude,
      20,
      460
    );

    if (this.fireTimer >= this.cfg.fireRate) {
      this.fireTimer = 0;
      this.fire();
    }

    if (this.y > 850) {
      this.destroy();
    }
  }
}
