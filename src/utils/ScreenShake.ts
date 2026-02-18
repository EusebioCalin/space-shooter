import Phaser from 'phaser';

export function screenShake(camera: Phaser.Cameras.Scene2D.Camera, intensity = 0.01, duration = 150): void {
  camera.shake(duration, intensity);
}
