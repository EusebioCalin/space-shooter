import Phaser from 'phaser';

export function generateAssets(scene: Phaser.Scene): void {
  generateShipXWing(scene);
  generateShipAWing(scene);
  generateShipYWing(scene);
  generateBullet(scene);
  generateAsteroids(scene);
  generateStar(scene);
  generateExplosionParticle(scene);
  generateThrusterParticle(scene);
  generateEnemyBullet(scene);
  generateEnemyTIEFighter(scene);
  generateEnemyTIEBomber(scene);
  generateEnemyDestroyer(scene);
}

// ─── Player Ships ─────────────────────────────────────────────────────────────

function generateShipXWing(scene: Phaser.Scene): void {
  // 40×30 — classic X-Wing: central fuselage + S-foil wings splaying out from mid-body
  const g = scene.add.graphics();

  // Fuselage (cyan)
  g.fillStyle(0x00ccff);
  g.fillRect(18, 0, 4, 4);   // nose tip
  g.fillRect(16, 4, 8, 4);
  g.fillRect(14, 8, 12, 4);
  g.fillRect(12, 12, 16, 4);
  g.fillRect(10, 16, 20, 4);
  g.fillRect(8, 20, 24, 4);
  g.fillRect(6, 24, 28, 6);  // rear hull

  // S-foil wings — upper pair (spread outward from mid-body)
  g.fillStyle(0x0099cc);
  g.fillRect(0, 10, 10, 3);  // left upper foil
  g.fillRect(30, 10, 10, 3); // right upper foil
  // S-foil wings — lower pair
  g.fillRect(0, 16, 10, 3);  // left lower foil
  g.fillRect(30, 16, 10, 3); // right lower foil

  // Wing engine tips
  g.fillStyle(0x0066aa);
  g.fillRect(0, 13, 4, 3);   // left tip glow
  g.fillRect(36, 13, 4, 3);  // right tip glow

  // Cockpit highlight
  g.fillStyle(0x66eeff);
  g.fillRect(18, 4, 4, 4);
  g.fillRect(16, 8, 8, 3);

  // Engine glow at rear
  g.fillStyle(0x0088cc);
  g.fillRect(6, 26, 6, 4);
  g.fillRect(28, 26, 6, 4);

  g.generateTexture('ship_xwing', 40, 30);
  g.destroy();
}

function generateShipAWing(scene: Phaser.Scene): void {
  // 28×24 — sleek swept-wing wedge, twin engine pods at rear corners
  const g = scene.add.graphics();

  // Fuselage — narrow dart shape
  g.fillStyle(0x00ccff);
  g.fillRect(12, 0, 4, 4);   // nose
  g.fillRect(10, 4, 8, 4);
  g.fillRect(8, 8, 12, 4);
  g.fillRect(6, 12, 16, 4);
  g.fillRect(4, 16, 20, 4);
  g.fillRect(6, 20, 16, 4);  // narrower at rear (engine mount)

  // Swept wings — angular outward lines from mid-body
  g.fillStyle(0x0099cc);
  g.fillRect(0, 12, 6, 2);   // left sweep
  g.fillRect(22, 12, 6, 2);  // right sweep
  g.fillRect(0, 14, 4, 2);
  g.fillRect(24, 14, 4, 2);

  // Twin rear engine pods
  g.fillStyle(0x0066aa);
  g.fillRect(4, 20, 4, 4);   // left engine
  g.fillRect(20, 20, 4, 4);  // right engine

  // Cockpit — small slit
  g.fillStyle(0x66eeff);
  g.fillRect(12, 4, 4, 3);

  g.generateTexture('ship_awing', 28, 24);
  g.destroy();
}

function generateShipYWing(scene: Phaser.Scene): void {
  // 36×34 — elongated center hull + twin cylindrical nacelles flanking the rear
  const g = scene.add.graphics();

  // Central hull
  g.fillStyle(0x00ccff);
  g.fillRect(14, 0, 8, 4);   // nose
  g.fillRect(12, 4, 12, 4);
  g.fillRect(10, 8, 16, 4);
  g.fillRect(12, 12, 12, 6); // fuselage body
  g.fillRect(14, 18, 8, 4);  // rear hull center

  // Twin engine nacelles (parallel to hull, starting at mid-body)
  g.fillStyle(0x0088cc);
  g.fillRect(2, 10, 8, 20);  // left nacelle
  g.fillRect(26, 10, 8, 20); // right nacelle

  // Nacelle engine glow at rear
  g.fillStyle(0x0055aa);
  g.fillRect(2, 28, 8, 4);
  g.fillRect(26, 28, 8, 4);

  // Connecting struts from hull to nacelles
  g.fillStyle(0x0099cc);
  g.fillRect(10, 14, 2, 4);  // left strut
  g.fillRect(24, 14, 2, 4);  // right strut

  // Cockpit bubble
  g.fillStyle(0x66eeff);
  g.fillRect(14, 4, 8, 4);
  g.fillRect(16, 8, 4, 3);

  g.generateTexture('ship_ywing', 36, 34);
  g.destroy();
}

// ─── Bullets ──────────────────────────────────────────────────────────────────

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

function generateEnemyBullet(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  g.fillStyle(0xff2222);
  g.fillRect(1, 2, 4, 6);
  g.fillStyle(0xff8800);
  g.fillRect(1, 0, 4, 2);
  g.fillStyle(0xffffff);
  g.fillRect(2, 3, 2, 3);
  g.generateTexture('enemy_bullet', 6, 10);
  g.destroy();
}

// ─── Asteroids / environment ───────────────────────────────────────────────────

function generateAsteroids(scene: Phaser.Scene): void {
  const sizes = [
    { key: 'asteroid_large', s: 48 },
    { key: 'asteroid_medium', s: 28 },
    { key: 'asteroid_small', s: 16 },
  ];

  for (const { key, s } of sizes) {
    const g = scene.add.graphics();
    const half = s / 2;
    const colors = [0x8b7355, 0x6b5b45, 0x9b8365, 0x554433];
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

// ─── Enemy Ships ──────────────────────────────────────────────────────────────

function generateEnemyTIEFighter(scene: Phaser.Scene): void {
  // 28×22 — TIE Fighter: central ball cockpit + flat hexagonal solar panel wings
  const g = scene.add.graphics();

  // Left solar panel wing — tall thin rectangle with notched corners
  g.fillStyle(0x333333);
  g.fillRect(0, 2, 8, 18);   // main panel
  g.fillRect(1, 0, 6, 22);   // slightly wider center strip of panel

  // Right solar panel wing
  g.fillRect(20, 2, 8, 18);
  g.fillRect(21, 0, 6, 22);

  // Wing connector struts
  g.fillStyle(0x555555);
  g.fillRect(8, 8, 3, 6);    // left strut to cockpit
  g.fillRect(17, 8, 3, 6);   // right strut to cockpit

  // Central ball cockpit
  g.fillStyle(0x555555);
  g.fillRect(10, 6, 8, 10);  // cockpit body
  g.fillRect(11, 4, 6, 14);  // cockpit rounded vertical

  // Cockpit window
  g.fillStyle(0x00aaff);
  g.fillRect(12, 8, 4, 5);

  // Ion engine glow at bottom of cockpit
  g.fillStyle(0x0066cc);
  g.fillRect(12, 16, 4, 3);

  // Panel detail lines (slightly lighter)
  g.fillStyle(0x444444);
  g.fillRect(2, 6, 5, 1);
  g.fillRect(2, 11, 5, 1);
  g.fillRect(2, 16, 5, 1);
  g.fillRect(21, 6, 5, 1);
  g.fillRect(21, 11, 5, 1);
  g.fillRect(21, 16, 5, 1);

  g.generateTexture('enemy_scout', 28, 22);
  g.destroy();
}

function generateEnemyTIEBomber(scene: Phaser.Scene): void {
  // 44×26 — TIE Bomber: twin-pod fuselage + narrow hex wings
  const g = scene.add.graphics();

  // Left command pod (rounded box)
  g.fillStyle(0x444444);
  g.fillRect(6, 4, 12, 18);
  g.fillRect(7, 2, 10, 22);

  // Right bomb pod (slightly larger)
  g.fillStyle(0x333333);
  g.fillRect(22, 4, 14, 18);
  g.fillRect(23, 2, 12, 22);

  // Connecting strut between pods
  g.fillStyle(0x555555);
  g.fillRect(18, 10, 4, 6);

  // Narrow solar wings
  g.fillStyle(0x2a2a2a);
  g.fillRect(0, 6, 6, 14);   // left wing
  g.fillRect(38, 6, 6, 14);  // right wing

  // Command pod window
  g.fillStyle(0xffaa00);
  g.fillRect(9, 8, 6, 5);

  // Bomb pod vents
  g.fillStyle(0x222222);
  g.fillRect(25, 7, 8, 2);
  g.fillRect(25, 11, 8, 2);
  g.fillRect(25, 15, 8, 2);

  // Engine glow on command pod
  g.fillStyle(0x0055aa);
  g.fillRect(8, 20, 8, 3);

  g.generateTexture('enemy_gunship', 44, 26);
  g.destroy();
}

function generateEnemyDestroyer(scene: Phaser.Scene): void {
  // 56×38 — Imperial-style wedge capital ship: wide triangular hull, bridge tower, cannon ports
  const g = scene.add.graphics();

  // Main wedge hull — triangular shape pointing down
  g.fillStyle(0x2a2a2a);
  g.fillRect(24, 0, 8, 4);   // nose tip
  g.fillRect(20, 4, 16, 4);
  g.fillRect(14, 8, 28, 4);
  g.fillRect(8, 12, 40, 4);
  g.fillRect(4, 16, 48, 4);
  g.fillRect(2, 20, 52, 4);
  g.fillRect(0, 24, 56, 4);
  g.fillRect(0, 28, 56, 6);  // rear hull plate

  // Lighter leading edge highlight
  g.fillStyle(0x3d3d3d);
  g.fillRect(24, 0, 8, 2);
  g.fillRect(20, 4, 16, 2);
  g.fillRect(14, 8, 28, 2);

  // Bridge tower at rear center
  g.fillStyle(0x3a3a3a);
  g.fillRect(22, 24, 12, 8);
  g.fillRect(24, 20, 8, 4);

  // Bridge windows
  g.fillStyle(0xaaccff);
  g.fillRect(24, 25, 8, 3);

  // Cannon ports along the nose edge
  g.fillStyle(0x888888);
  g.fillRect(22, 0, 4, 3);   // center cannon
  g.fillRect(16, 8, 3, 3);   // left cannon
  g.fillRect(37, 8, 3, 3);   // right cannon

  // Hull panel detail lines
  g.fillStyle(0x222222);
  g.fillRect(4, 18, 20, 1);
  g.fillRect(32, 18, 20, 1);
  g.fillRect(8, 22, 14, 1);
  g.fillRect(34, 22, 14, 1);

  // Engine glow ports at rear
  g.fillStyle(0x4400aa);
  g.fillRect(6, 32, 8, 4);
  g.fillRect(42, 32, 8, 4);
  g.fillRect(24, 32, 8, 4);

  g.generateTexture('enemy_destroyer', 56, 38);
  g.destroy();
}
