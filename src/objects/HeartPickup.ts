import Phaser from 'phaser';

export class HeartPickup extends Phaser.Physics.Arcade.Sprite {
  private age = 0;
  private spawnX: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'heart_pickup');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.spawnX = x;
    this.setDepth(4);
    this.setScale(2);

    scene.tweens.add({
      targets: this,
      scaleX: 2.4, scaleY: 2.4,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  launch(): void {
    this.setVelocityY(80);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.age += delta;
    this.x = Phaser.Math.Clamp(
      this.spawnX + Math.sin((this.age / 1000) * 1.2 * Math.PI * 2) * 30,
      20, 460
    );
    if (this.y > 850) this.destroy();
  }
}
