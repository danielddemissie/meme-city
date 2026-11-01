import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../theme';
import type { AccessibilitySettings, PlayerEntity } from '../types';

const CONE_HALF_ANGLE = Math.PI / 5;
const LIGHT_RANGE = 640;

export class Lighting {
  private readonly darkness: Phaser.GameObjects.RenderTexture;
  private readonly coneMask: Phaser.GameObjects.Sprite;
  private readonly ambientMask: Phaser.GameObjects.Sprite;
  private readonly grain: Phaser.GameObjects.TileSprite;

  constructor(scene: Phaser.Scene) {
    this.createLightTextures(scene);

    this.darkness = scene.add.renderTexture(0, 0, GAME_WIDTH, GAME_HEIGHT).setOrigin(0, 0).setDepth(12);
    this.coneMask = scene.make.sprite({ key: 'cone-light', add: false });
    this.ambientMask = scene.make.sprite({ key: 'ambient-light', add: false });
    this.grain = scene.add
      .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'grain')
      .setOrigin(0, 0)
      .setDepth(13)
      .setBlendMode(Phaser.BlendModes.SCREEN);
  }

  update(
    player: PlayerEntity,
    facing: Phaser.Math.Vector2,
    blinkRemaining: number,
    settings: AccessibilitySettings,
  ): void {
    const darknessAlpha = blinkRemaining > 0
      ? 0.99
      : settings.screenEffects
        ? 0.88
        : 0.68;

    this.darkness.fill(COLORS.void, darknessAlpha);

    if (blinkRemaining <= 0) {
      this.ambientMask.setPosition(player.sprite.x, player.sprite.y);
      this.darkness.erase(this.ambientMask);

      this.coneMask
        .setPosition(player.sprite.x, player.sprite.y)
        .setRotation(Math.atan2(facing.y, facing.x) + Math.PI / 2);
      this.darkness.erase(this.coneMask);
    }

    this.grain.setVisible(settings.screenEffects);
    if (settings.screenEffects) {
      this.grain.setAlpha(settings.reducedMotion ? 0.016 : 0.03);
      if (!settings.reducedMotion) {
        this.grain.setTilePosition(Phaser.Math.Between(0, 96), Phaser.Math.Between(0, 96));
      }
    }
  }

  private createLightTextures(scene: Phaser.Scene): void {
    if (scene.textures.exists('cone-light')) {
      return;
    }

    const size = LIGHT_RANGE * 2;
    const half = LIGHT_RANGE;
    const cone = scene.textures.createCanvas('cone-light', size, size);
    if (cone) {
      const ctx = cone.getContext();
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(half, half);
      ctx.arc(half, half, half - 8, -Math.PI / 2 - CONE_HALF_ANGLE, -Math.PI / 2 + CONE_HALF_ANGLE);
      ctx.closePath();
      ctx.clip();
      const gradient = ctx.createRadialGradient(half, half, 12, half, half, half);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.72, 'rgba(255,255,255,0.55)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();
      cone.refresh();
    }

    const ambientSize = 224;
    const ambientHalf = ambientSize / 2;
    const ambient = scene.textures.createCanvas('ambient-light', ambientSize, ambientSize);
    if (ambient) {
      const ctx = ambient.getContext();
      const gradient = ctx.createRadialGradient(ambientHalf, ambientHalf, 8, ambientHalf, ambientHalf, ambientHalf);
      gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
      gradient.addColorStop(0.55, 'rgba(255,255,255,0.4)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, ambientSize, ambientSize);
      ambient.refresh();
    }

    const noise = scene.textures.createCanvas('grain', 128, 128);
    if (noise) {
      const ctx = noise.getContext();
      const image = ctx.createImageData(128, 128);
      for (let i = 0; i < image.data.length; i += 4) {
        const value = Phaser.Math.Between(40, 235);
        image.data[i] = value;
        image.data[i + 1] = value;
        image.data[i + 2] = value;
        image.data[i + 3] = 255;
      }
      ctx.putImageData(image, 0, 0);
      noise.refresh();
    }
  }
}
