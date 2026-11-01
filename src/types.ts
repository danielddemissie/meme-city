import type Phaser from 'phaser';

export type GameState = 'briefing' | 'playing' | 'paused' | 'won' | 'lost';
export type Pressure = 'story' | 'standard' | 'relentless';
export type FlashIntensity = 'off' | 'low' | 'full';
export type ObservationStatus = 'observed' | 'unseen' | 'occluded' | 'blinking' | 'intake';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  texture: string;
  tint: number;
  speedFactor: number;
  focusFactor: number;
  knockPattern: readonly number[];
  voice: 'knock' | 'squeak' | 'engine' | 'taps' | 'whistle';
  notice: string;
}

export interface AccessibilitySettings {
  pressure: Pressure;
  reducedMotion: boolean;
  flashIntensity: FlashIntensity;
  screenEffects: boolean;
  audio: boolean;
}

export interface PlayerEntity {
  sprite: Phaser.Physics.Arcade.Sprite;
  facing: Phaser.Math.Vector2;
  speed: number;
  focus: number;
  blinkRemaining: number;
}

export interface EnemyEntity {
  sprite: Phaser.Physics.Arcade.Sprite;
  observed: boolean;
  escalated: boolean;
}

export interface TemplateKeyItem {
  sprite: Phaser.Physics.Arcade.Sprite;
  collected: boolean;
}

export interface HudSnapshot {
  elapsedSeconds: number;
  hasKey: boolean;
  focus: number;
  observation: ObservationStatus;
  escalated: boolean;
}
