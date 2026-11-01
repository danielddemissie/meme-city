import Phaser from 'phaser';
import './style.css';
import { StarterRoomScene } from './scenes/StarterRoomScene';

const forceCanvas = new URLSearchParams(window.location.search).has('canvas');

const config: Phaser.Types.Core.GameConfig = {
  type: forceCanvas ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'game',
  width: 1152,
  height: 720,
  backgroundColor: '#0b0c0b',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  render: {
    antialias: true,
    powerPreference: 'high-performance',
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [StarterRoomScene],
};

const game = new Phaser.Game(config);

(window as unknown as { __game?: unknown }).__game = game;
