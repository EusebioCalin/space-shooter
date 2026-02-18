import Phaser from 'phaser';
import { Bullet } from './Bullet';

export class Ship extends Phaser.Physics.Arcade.Sprite {
  private targetX: number;
  private fireTimer = 0;
  private fireRate = 250; // ms between shots
  private thrusterEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  bullets: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene) {
    super(scene, 240, 720, 'ship');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDepth(5);
    this.targetX = this.x;

    this.bullets = scene.physics.add.group({
      classType: Bullet,
      runChildUpdate: true,
    });

    // Thruster particles
    this.thrusterEmitter = scene.add.particles(0, 0, 'particle_thruster', {
      speed: { min: 30, max: 80 },
      angle: { min: 80, max: 100 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 300,
      frequency: 30,
      follow: this,
      followOffset: { x: 0, y: 14 },
      tint: [0x4488ff, 0x2266dd, 0x66aaff],
    });
    this.thrusterEmitter.setDepth(4);
  }

  handleInput(pointer: Phaser.Input.Pointer): void {
    if (pointer.isDown) {
      this.targetX = Phaser.Math.Clamp(pointer.x / this.scene.scale.displayScale.x, 16, 464);
      // Transform from display coords to game coords
      const cam = this.scene.cameras.main;
      this.targetX = (pointer.x - cam.x) / cam.zoom;
      // Simpler approach: use worldX
      this.targetX = Phaser.Math.Clamp(pointer.worldX, 16, 464);
    }
  }

  flash(): void {
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    // Smooth movement toward target
    this.x = Phaser.Math.Linear(this.x, this.targetX, 0.15);

    // Auto-fire
    this.fireTimer += delta;
    if (this.fireTimer >= this.fireRate) {
      this.fireTimer = 0;
      this.fire();
    }
  }

  private fire(): void {
    const bullet = new Bullet(this.scene, this.x, this.y - 16);
    this.bullets.add(bullet);
    bullet.launch();
  }

  destroy(fromScene?: boolean): void {
    this.thrusterEmitter.destroy();
    super.destroy(fromScene);
  }
}
