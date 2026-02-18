import Phaser from 'phaser';

interface SpaceObject {
  x: number;
  y: number;
  speed: number;
  image: Phaser.GameObjects.Image;
}

export class Starfield {
  private objects: SpaceObject[] = [];
  private readonly screenWidth: number;
  private readonly screenHeight: number;

  constructor(scene: Phaser.Scene) {
    this.screenWidth = scene.scale.width;
    this.screenHeight = scene.scale.height;

    // 1. Create Background Stars (Tiny, slow, many)
    this.createLayer(scene, 100, { minSize: 0.1, maxSize: 0.3, speedMult: 10, alpha: 0.4, texture: 'star' });

    // 2. Create Foreground Stars (Bigger, faster, fewer)
    this.createLayer(scene, 20, { minSize: 0.5, maxSize: 0.8, speedMult: 50, alpha: 0.9, texture: 'star' });

    // 3. Create Planets (Rare, vary in speed)
    this.createPlanets(scene, 1);
  }

  private createLayer(scene: Phaser.Scene, count: number, config: any) {
    for (let i = 0; i < count; i++) {
      const scale = Phaser.Math.FloatBetween(config.minSize, config.maxSize);
      // Speed is proportional to scale (Parallax effect)
      const speed = scale * config.speedMult;

      const img = scene.add.image(
        Math.random() * this.screenWidth,
        Math.random() * this.screenHeight,
        config.texture
      );

      img.setAlpha(config.alpha);
      img.setScale(scale);
      img.setDepth(-20); // Deep background

      this.objects.push({ x: img.x, y: img.y, speed, image: img });
    }
  }

  private createPlanets(scene: Phaser.Scene, count: number) {
    const planetTextures = ['planet1', 'planet2', 'planet3']; // Ensure these are preloaded

    for (let i = 0; i < count; i++) {
      const texture = Phaser.Utils.Array.GetRandom(planetTextures);
      const img = scene.add.image(
        Math.random() * this.screenWidth,
        Math.random() * this.screenHeight,
        texture
      );

      const scale = Phaser.Math.FloatBetween(0.4, 1.2);
      img.setScale(scale);
      img.setAlpha(0.8);
      img.setDepth(-15); // Sit in front of distant stars

      this.objects.push({
        x: img.x,
        y: img.y,
        speed: scale * 15, // Planets move slower than close stars for scale
        image: img
      });
    }
  }

  update(delta: number): void {
    const dt = delta / 1000;
    for (const obj of this.objects) {
      obj.y += obj.speed * dt;

      // Wrap around logic
      if (obj.y > this.screenHeight + 100) {
        obj.y = -100;
        obj.x = Math.random() * this.screenWidth;

        // If it's a planet, maybe randomize the texture again for variety
        if (obj.image.texture.key.includes('planet')) {
          obj.image.setRotation(Math.random() * Math.PI);
        }
      }
      obj.image.setPosition(obj.x, obj.y);
    }
  }
}