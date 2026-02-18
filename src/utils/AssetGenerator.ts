import Phaser from 'phaser';

export function generateAssets(scene: Phaser.Scene): void {
  generateShip(scene);
  generateBullet(scene);
  generateAsteroids(scene);
  generateStar(scene);
  generateExplosionParticle(scene);
  generateThrusterParticle(scene);
  generateEnemyBullet(scene);
  generateEnemyScout(scene);
  generateEnemyGunship(scene);
}

function generateShip(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  // Ship body — cyan/blue pixel art style triangle
  g.fillStyle(0x00ccff);
  g.fillRect(14, 0, 4, 4);   // nose
  g.fillRect(10, 4, 12, 4);
  g.fillRect(6, 8, 20, 4);
  g.fillRect(4, 12, 24, 4);
  g.fillRect(2, 16, 28, 8);
  g.fillRect(0, 24, 32, 4);
  // Cockpit highlight
  g.fillStyle(0x66eeff);
  g.fillRect(14, 4, 4, 4);
  g.fillRect(12, 8, 8, 4);
  // Engine glow
  g.fillStyle(0x0088cc);
  g.fillRect(4, 24, 8, 4);
  g.fillRect(20, 24, 8, 4);

  g.generateTexture('ship', 32, 28);
  g.destroy();
}

function generateBullet(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  g.fillStyle(0xffff88);
  g.fillRect(1, 0, 4, 2);
  g.fillStyle(0xffffff);
  g.fillRect(2, 0, 2, 2);
  g.fillRect(1, 2, 4, 6);
  g.fillStyle(0xffff44);
  g.fillRect(2, 6, 2, 4);

  g.generateTexture('bullet', 6, 10);
  g.destroy();
}

function generateAsteroids(scene: Phaser.Scene): void {
  const sizes = [
    { key: 'asteroid_large', s: 48 },
    { key: 'asteroid_medium', s: 28 },
    { key: 'asteroid_small', s: 16 },
  ];

  for (const { key, s } of sizes) {
    const g = scene.add.graphics();
    // Rocky irregular shape
    const half = s / 2;
    const colors = [0x8b7355, 0x6b5b45, 0x9b8365, 0x554433];

    // Fill with blocky pixels
    for (let y = 0; y < s; y += 2) {
      for (let x = 0; x < s; x += 2) {
        const dx = x - half;
        const dy = y - half;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = half * (0.7 + 0.3 * Math.sin(dx * 1.5 + dy * 0.8));
        if (dist < radius) {
          g.fillStyle(colors[Math.floor(Math.random() * colors.length)]);
          g.fillRect(x, y, 2, 2);
        }
      }
    }
    // Highlight edge
    g.fillStyle(0xbbaa88);
    for (let y = 0; y < s; y += 2) {
      for (let x = 0; x < s; x += 2) {
        const dx = x - half;
        const dy = y - half;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = half * (0.7 + 0.3 * Math.sin(dx * 1.5 + dy * 0.8));
        if (dist < radius && dist > radius - 3) {
          g.fillStyle(dy < 0 ? 0xbbaa88 : 0x443322);
          g.fillRect(x, y, 2, 2);
        }
      }
    }

    g.generateTexture(key, s, s);
    g.destroy();
  }
}

function generateStar(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  g.fillStyle(0xffffff);
  g.fillRect(0, 0, 2, 2);
  g.generateTexture('star', 2, 2);
  g.destroy();
}

function generateExplosionParticle(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  g.fillStyle(0xffaa33);
  g.fillRect(0, 0, 4, 4);
  g.generateTexture('particle_explosion', 4, 4);
  g.destroy();
}

function generateThrusterParticle(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  g.fillStyle(0x4488ff);
  g.fillRect(0, 0, 3, 3);
  g.generateTexture('particle_thruster', 3, 3);
  g.destroy();
}

function generateEnemyBullet(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  // Red pellet body
  g.fillStyle(0xff2222);
  g.fillRect(1, 2, 4, 6);
  // Orange tip
  g.fillStyle(0xff8800);
  g.fillRect(1, 0, 4, 2);
  // White core
  g.fillStyle(0xffffff);
  g.fillRect(2, 3, 2, 3);
  g.generateTexture('enemy_bullet', 6, 10);
  g.destroy();
}

function generateEnemyScout(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  // Dark green downward arrowhead body
  g.fillStyle(0x226622);
  g.fillRect(8, 0, 4, 4);   // nose (pointing down)
  g.fillRect(6, 4, 8, 4);
  g.fillRect(2, 8, 16, 4);
  g.fillRect(0, 12, 20, 4);
  // Lime cockpit
  g.fillStyle(0x88ff44);
  g.fillRect(8, 4, 4, 4);
  // Orange engines at top (trailing edge)
  g.fillStyle(0xff8800);
  g.fillRect(0, 12, 4, 4);
  g.fillRect(16, 12, 4, 4);
  g.generateTexture('enemy_scout', 20, 18);
  g.destroy();
}

function generateEnemyGunship(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  // Wide maroon warship body
  g.fillStyle(0x8b1a1a);
  g.fillRect(12, 0, 12, 6);  // nose
  g.fillRect(6, 6, 24, 6);
  g.fillRect(0, 12, 36, 8);
  g.fillRect(4, 20, 28, 6);
  // Amber cockpit window
  g.fillStyle(0xffaa00);
  g.fillRect(14, 6, 8, 6);
  // Purple engines at trailing edge
  g.fillStyle(0x8844cc);
  g.fillRect(2, 22, 6, 6);
  g.fillRect(14, 22, 8, 6);
  g.fillRect(28, 22, 6, 6);
  // Gray cannon ports at nose
  g.fillStyle(0x888888);
  g.fillRect(12, 0, 4, 4);
  g.fillRect(20, 0, 4, 4);
  g.generateTexture('enemy_gunship', 36, 30);
  g.destroy();
}
