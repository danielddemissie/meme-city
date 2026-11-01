import Phaser from 'phaser';
import { Hud } from '../game/Hud';
import { Lighting } from '../game/Lighting';
import { Room } from '../game/Room';
import {
  COLORS,
  FONT_FAMILY,
  PRESSURE_FOCUS_SECONDS,
  PRESSURE_SPEED,
  WORLD_BOTTOM,
  WORLD_PADDING,
  WORLD_TOP,
} from '../theme';
import type {
  AccessibilitySettings,
  EnemyEntity,
  GameState,
  ObservationStatus,
  PlayerEntity,
  TemplateKeyItem,
} from '../types';

const OBSERVATION_COS = Math.cos(Math.PI / 5);
const OBSERVATION_RANGE = 640;
const BACKPEDAL_THRESHOLD = -0.35;
const BACKPEDAL_MULTIPLIER = 0.72;

type MovementKeys = Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;

export class StarterRoomScene extends Phaser.Scene {
  private player!: PlayerEntity;
  private enemy!: EnemyEntity;
  private templateKey!: TemplateKeyItem;
  private exitDoor!: Phaser.Physics.Arcade.Sprite;
  private room!: Room;
  private hud!: Hud;
  private lighting!: Lighting;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private movementKeys!: MovementKeys;
  private state: GameState = 'briefing';
  private settings: AccessibilitySettings;
  private hasBriefed = false;
  private graceRemaining = 0;
  private elapsed = 0;
  private noticeRemaining = 0;
  private noticeLockUntil = 0;
  private pointerAim = false;
  private readonly movement = new Phaser.Math.Vector2();
  private readonly toEnemy = new Phaser.Math.Vector2();
  private readonly toPlayer = new Phaser.Math.Vector2();

  constructor() {
    super('StarterRoomScene');
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.settings = {
      pressure: 'standard',
      reducedMotion: prefersReducedMotion,
      flashIntensity: 'full',
      screenEffects: true,
    };
  }

  create(): void {
    this.state = 'briefing';
    this.elapsed = 0;
    this.noticeRemaining = 0;
    this.noticeLockUntil = 0;
    this.pointerAim = false;

    this.createTextures();
    this.room = new Room(this);

    this.physics.world.setBounds(
      WORLD_PADDING,
      WORLD_TOP,
      1152 - WORLD_PADDING * 2,
      WORLD_BOTTOM - WORLD_TOP,
    );

    const spawn = Phaser.Math.RND.pick([...this.room.keySpawns]);
    this.templateKey = {
      sprite: this.physics.add.sprite(spawn.x, spawn.y, 'template-key'),
      collected: false,
    };
    this.templateKey.sprite.setDepth(14);
    this.templateKey.sprite.setAlpha(0.85);

    this.exitDoor = this.physics.add.staticSprite(
      this.room.doorPosition.x,
      this.room.doorPosition.y,
      'exit-door',
    );
    this.exitDoor.setDepth(5);

    const playerSprite = this.physics.add.sprite(140, 600, 'player');
    playerSprite.setDepth(6);
    playerSprite.setCollideWorldBounds(true);
    playerSprite.setRotation(0);
    this.player = {
      sprite: playerSprite,
      facing: new Phaser.Math.Vector2(0, -1),
      speed: 196,
      focus: 1,
      blinkRemaining: 0,
    };

    const enemySprite = this.physics.add.sprite(760, 150, 'glancing-man');
    enemySprite.setDepth(6);
    enemySprite.setCollideWorldBounds(true);
    const enemyBody = enemySprite.body as Phaser.Physics.Arcade.Body;
    enemyBody.setSize(24, 30, true);
    this.enemy = {
      sprite: enemySprite,
      observed: false,
      escalated: false,
    };

    this.physics.add.collider(playerSprite, this.room.obstacles);
    this.physics.add.overlap(playerSprite, this.templateKey.sprite, this.collectTemplateKey, undefined, this);
    this.physics.add.overlap(playerSprite, this.exitDoor, this.tryExit, undefined, this);
    this.physics.add.overlap(playerSprite, enemySprite, () => this.finishGame('lost'));

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is required.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.movementKeys = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    keyboard.on('keydown-ENTER', this.handleBrief, this);
    keyboard.on('keydown-R', this.restartRun, this);
    keyboard.on('keydown-ONE', this.cyclePressure, this);
    keyboard.on('keydown-TWO', this.toggleReducedMotion, this);
    keyboard.on('keydown-THREE', this.cycleFlash, this);
    keyboard.on('keydown-FOUR', this.toggleScreenEffects, this);

    const onEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !event.repeat) {
        this.handlePause();
      }
    };
    window.addEventListener('keydown', onEscape);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', onEscape);
    });

    this.input.on('pointerdown', this.handlePrimary, this);
    this.input.on('pointermove', () => {
      this.pointerAim = true;
    });

    this.lighting = new Lighting(this);
    this.hud = new Hud(this);
    this.hud.update({
      elapsedSeconds: 0,
      hasKey: false,
      focus: 1,
      observation: 'unseen',
      escalated: false,
    });
    this.hud.updateSettings(this.settings);
    this.installDebugProbe();

    if (this.hasBriefed) {
      this.startRun();
    } else {
      this.physics.world.pause();
      this.lighting.update(this.player, this.player.facing, 0, this.settings);
      this.hud.showBriefing(this.settings);
    }
  }

  update(_time: number, delta: number): void {
    if (this.state !== 'playing') {
      return;
    }

    this.elapsed += delta / 1000;
    this.updateGrace(delta);
    this.updatePlayer();
    const observation = this.evaluateObservation();
    this.updateFocusAndBlink(delta, observation);
    this.updateEnemy(observation);
    this.updateKeyPulse();
    this.updateNotices(delta);
    this.lighting.update(this.player, this.player.facing, this.player.blinkRemaining, this.settings);
    this.hud.update({
      elapsedSeconds: this.elapsed,
      hasKey: this.templateKey.collected,
      focus: this.player.focus,
      observation,
      escalated: this.enemy.escalated,
    });
  }

  private updatePlayer(): void {
    const left = this.cursors.left.isDown || this.movementKeys.left.isDown;
    const right = this.cursors.right.isDown || this.movementKeys.right.isDown;
    const up = this.cursors.up.isDown || this.movementKeys.up.isDown;
    const down = this.cursors.down.isDown || this.movementKeys.down.isDown;

    this.movement.set(Number(right) - Number(left), Number(down) - Number(up));
    if (this.movement.lengthSq() > 0) {
      this.movement.normalize();
    }

    if (this.pointerAim) {
      const pointer = this.input.activePointer;
      const dx = pointer.worldX - this.player.sprite.x;
      const dy = pointer.worldY - this.player.sprite.y;
      if (dx !== 0 || dy !== 0) {
        this.player.facing.set(dx, dy).normalize();
      }
      this.pointerAim = false;
    } else if (this.movement.lengthSq() > 0) {
      this.player.facing.copy(this.movement);
    }

    this.player.sprite.setRotation(
      Math.atan2(this.player.facing.y, this.player.facing.x) + Math.PI / 2,
    );

    const dot = this.movement.dot(this.player.facing);
    const speedMultiplier = dot < BACKPEDAL_THRESHOLD ? BACKPEDAL_MULTIPLIER : 1;
    this.player.sprite.setVelocity(
      this.movement.x * this.player.speed * speedMultiplier,
      this.movement.y * this.player.speed * speedMultiplier,
    );
  }

  private evaluateObservation(): ObservationStatus {
    if (this.graceRemaining > 0) {
      return 'intake';
    }

    this.toEnemy.set(
      this.enemy.sprite.x - this.player.sprite.x,
      this.enemy.sprite.y - this.player.sprite.y,
    );
    const distance = this.toEnemy.length();
    if (distance === 0) {
      return 'unseen';
    }

    const facingDot = this.player.facing.dot(this.toEnemy) / distance;
    const withinCone = facingDot >= OBSERVATION_COS;
    const openSight = this.room.hasLineOfSight(
      new Phaser.Math.Vector2(this.player.sprite.x, this.player.sprite.y),
      new Phaser.Math.Vector2(this.enemy.sprite.x, this.enemy.sprite.y),
    );

    if (this.player.blinkRemaining > 0) {
      return 'blinking';
    }
    if (withinCone && distance <= OBSERVATION_RANGE && openSight) {
      return 'observed';
    }
    if (withinCone && !openSight) {
      return 'occluded';
    }
    return 'unseen';
  }

  private updateFocusAndBlink(delta: number, observation: ObservationStatus): void {
    const seconds = delta / 1000;
    if (this.player.blinkRemaining > 0) {
      this.player.blinkRemaining = Math.max(0, this.player.blinkRemaining - seconds);
      if (this.player.blinkRemaining === 0) {
        this.player.focus = 0.3;
      }
      return;
    }

    if (observation === 'observed') {
      const drain = seconds / PRESSURE_FOCUS_SECONDS[this.settings.pressure];
      this.player.focus = Math.max(0, this.player.focus - drain);
      if (this.player.focus === 0) {
        this.player.blinkRemaining = this.settings.reducedMotion ? 0.16 : 0.32;
        this.showNoticeAfterLock('INVOLUNTARY BLINK LOGGED.', '#c45347');
      }
      return;
    }

    this.player.focus = Math.min(1, this.player.focus + seconds / 3);
  }

  private updateGrace(delta: number): void {
    if (this.graceRemaining <= 0) {
      return;
    }

    this.graceRemaining = Math.max(0, this.graceRemaining - delta / 1000);
    if (this.graceRemaining === 0) {
      this.showNoticeAfterLock('INTAKE CLOSED.', '#e0a34a');
    }
  }

  private updateEnemy(observation: ObservationStatus): void {
    this.enemy.observed = observation === 'observed';

    if (this.graceRemaining > 0 || this.enemy.observed) {
      this.enemy.sprite.setVelocity(0, 0);
      return;
    }

    this.toPlayer.set(
      this.player.sprite.x - this.enemy.sprite.x,
      this.player.sprite.y - this.enemy.sprite.y,
    );
    if (this.toPlayer.lengthSq() === 0) {
      this.enemy.sprite.setVelocity(0, 0);
      return;
    }

    this.toPlayer.normalize();
    const speed = PRESSURE_SPEED[this.settings.pressure] * (this.enemy.escalated ? 1.3 : 1);
    this.enemy.sprite.setVelocity(this.toPlayer.x * speed, this.toPlayer.y * speed);
  }

  private updateKeyPulse(): void {
    const sprite = this.templateKey.sprite;
    if (!sprite.active || this.settings.flashIntensity === 'off' || this.settings.reducedMotion) {
      sprite.setAlpha(0.85);
      return;
    }

    const fullFlash = this.settings.flashIntensity === 'full';
    const amplitude = fullFlash ? 0.45 : 0.2;
    const frequency = fullFlash ? 5.2 : 2.4;
    sprite.setAlpha(0.62 + amplitude * (0.5 + 0.5 * Math.sin(this.elapsed * frequency)));
  }

  private updateNotices(delta: number): void {
    if (this.noticeRemaining > 0) {
      this.noticeRemaining = Math.max(0, this.noticeRemaining - delta);
      this.hud.fadeNotice(this.noticeRemaining / 480);
    }
  }

  private collectTemplateKey(): void {
    if (this.templateKey.collected || this.state !== 'playing') {
      return;
    }

    this.templateKey.collected = true;
    this.templateKey.sprite.destroy();
    this.enemy.escalated = true;
    this.exitDoor.setTint(COLORS.oliveBright);
    this.add
      .text(this.room.doorPosition.x - 34, this.room.doorPosition.y - 66, 'AUTHORIZED', {
        color: '#a4c477',
        fontFamily: FONT_FAMILY,
        fontSize: '11px',
      })
      .setAngle(-Math.PI / 2)
      .setDepth(11)
      .setAlpha(0.95);

    if (!this.settings.reducedMotion) {
      this.cameras.main.shake(140, 0.003);
    }
    if (this.settings.flashIntensity !== 'off') {
      const strength = this.settings.reducedMotion ? 120 : 180;
      this.cameras.main.flash(strength, 80, 110, 70);
    }
    this.showNoticeAfterLock('TEMPLATE KEY REMOVED FROM ARCHIVE.', '#a4c477');
  }

  private tryExit(): void {
    if (this.state !== 'playing') {
      return;
    }

    if (this.templateKey.collected) {
      this.finishGame('won');
      return;
    }

    this.showNoticeAfterLock('EXIT 04 LOCKED. TEMPLATE KEY REQUIRED.', '#e0a34a');
  }

  private finishGame(nextState: Exclude<GameState, 'playing'>): void {
    if (this.state !== 'playing') {
      return;
    }

    this.state = nextState;
    this.player.sprite.setVelocity(0, 0);
    this.enemy.sprite.setVelocity(0, 0);
    this.physics.world.pause();
    this.hud.showOutcome(nextState === 'won', this.elapsed, this.enemy.escalated);
  }

  private startRun(): void {
    this.hasBriefed = true;
    this.state = 'playing';
    this.graceRemaining = 2.5;
    this.hud.hideOverlay();
    this.physics.world.resume();
  }

  private handleBrief(): void {
    if (this.state === 'briefing') {
      this.startRun();
    }
  }

  private handlePrimary(): void {
    if (this.state === 'briefing') {
      this.startRun();
      return;
    }
    if (this.state === 'paused') {
      this.handlePause();
    }
  }

  private handlePause(): void {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.player.sprite.setVelocity(0, 0);
      this.enemy.sprite.setVelocity(0, 0);
      this.physics.world.pause();
      this.hud.showPause(this.settings);
      return;
    }
    if (this.state === 'paused') {
      this.state = 'playing';
      this.hud.hideOverlay();
      this.physics.world.resume();
    }
  }

  private restartRun(): void {
    if (this.state === 'playing' && this.elapsed < 0.6) {
      return;
    }
    this.physics.world.resume();
    this.state = 'playing';
    this.scene.restart();
  }

  private cyclePressure(): void {
    this.settings.pressure =
      this.settings.pressure === 'story'
        ? 'standard'
        : this.settings.pressure === 'standard'
          ? 'relentless'
          : 'story';
    this.hud.updateSettings(this.settings);
  }

  private toggleReducedMotion(): void {
    this.settings.reducedMotion = !this.settings.reducedMotion;
    this.hud.updateSettings(this.settings);
  }

  private cycleFlash(): void {
    this.settings.flashIntensity =
      this.settings.flashIntensity === 'off'
        ? 'low'
        : this.settings.flashIntensity === 'low'
          ? 'full'
          : 'off';
    this.hud.updateSettings(this.settings);
  }

  private toggleScreenEffects(): void {
    this.settings.screenEffects = !this.settings.screenEffects;
    this.hud.updateSettings(this.settings);
  }

  private showNoticeAfterLock(text: string, color: string): void {
    if (this.time.now < this.noticeLockUntil) {
      return;
    }
    this.noticeLockUntil = this.time.now + 900;
    this.noticeRemaining = 1800;
    this.hud.showNotice(text, color);
  }

  private installDebugProbe(): void {
    (window as unknown as { __memecity?: Record<string, unknown> }).__memecity = {
      getState: () => ({
        state: this.state,
        elapsed: this.elapsed,
        focus: this.player?.focus,
        blink: this.player?.blinkRemaining,
        grace: this.graceRemaining,
        enemy: this.enemy ? { x: this.enemy.sprite.x, y: this.enemy.sprite.y } : null,
        player: this.player ? { x: this.player.sprite.x, y: this.player.sprite.y } : null,
        facing: this.player ? { x: this.player.facing.x, y: this.player.facing.y } : null,
        hasKey: this.templateKey?.collected,
        key: this.templateKey ? { x: this.templateKey.sprite.x, y: this.templateKey.sprite.y } : null,
        settings: { ...this.settings },
      }),
      teleportPlayer: (x: number, y: number) => this.player?.sprite.setPosition(x, y),
      teleportEnemy: (x: number, y: number) => this.enemy?.sprite.setPosition(x, y),
      restart: () => this.restartRun(),
    };
  }

  private createTextures(): void {
    if (this.textures.exists('pixel')) {
      return;
    }

    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff).fillRect(0, 0, 1, 1);
    graphics.generateTexture('pixel', 1, 1);

    graphics.clear();
    graphics.fillStyle(0xd6dbcd).fillCircle(15, 15, 13);
    graphics.fillStyle(0x9aa394).fillCircle(15, 15, 9);
    graphics.fillStyle(0x4aa3ff).fillTriangle(11, 2, 19, 2, 15, 10);
    graphics.generateTexture('player', 30, 30);

    graphics.clear();
    graphics.fillStyle(0x14171a).fillRect(10, 20, 24, 32);
    graphics.fillStyle(0x26292c).fillRect(10, 20, 24, 6);
    graphics.fillStyle(0xc5c2b4).fillCircle(22, 14, 11);
    graphics.fillStyle(0x0d0d0d).fillCircle(17, 12, 3);
    graphics.fillCircle(27, 12, 3);
    graphics.fillStyle(0xe8e6d8).fillCircle(17, 11, 2);
    graphics.generateTexture('glancing-man', 44, 56);

    graphics.clear();
    graphics.fillStyle(0xf5cd30).fillRect(4, 4, 16, 16);
    graphics.fillStyle(0x9c7d16).fillTriangle(20, 4, 20, 12, 12, 4);
    graphics.fillStyle(0x1a1a12).fillCircle(12, 13, 3);
    graphics.fillStyle(0x1a1a12).fillRect(11, 15, 2, 4);
    graphics.generateTexture('template-key', 24, 24);

    graphics.clear();
    graphics.fillStyle(0x4a4f42).fillRect(0, 0, 24, 112);
    graphics.fillStyle(0x3a3f34).fillRect(2, 2, 20, 108);
    graphics.fillStyle(0xf5cd30).fillCircle(8, 54, 3);
    graphics.fillStyle(0x111311).fillRect(3, 18, 18, 2);
    graphics.fillStyle(0x111311).fillRect(3, 88, 18, 2);
    graphics.generateTexture('exit-door', 24, 112);

    graphics.destroy();
  }
}
