import Phaser from 'phaser';

export class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy_bullet');
    scene.add.existing(this);
    this.setDepth(1);
  }

  launch(vx = 0): void {
    this.setVelocityY(400);
    this.setVelocityX(vx);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.y > 850) {
      this.destroy();
    }
  }
}
