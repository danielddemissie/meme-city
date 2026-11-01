import Phaser from 'phaser';
import {
  COLORS,
  FONT_FAMILY,
  GAME_HEIGHT,
  GAME_WIDTH,
  WORLD_BOTTOM,
  WORLD_PADDING,
  WORLD_TOP,
} from '../theme';

interface ObstacleDefinition {
  x: number;
  y: number;
  width: number;
  height: number;
  tint: number;
  label?: string;
}

const OBSTACLES: readonly ObstacleDefinition[] = [
  { x: 300, y: 300, width: 44, height: 240, tint: 0x2f352a, label: 'CASE FILES' },
  { x: 560, y: 220, width: 250, height: 36, tint: 0x2f352a, label: 'INTAKE COUNTER' },
  { x: 610, y: 470, width: 230, height: 64, tint: 0x2a3026, label: 'RETURNS DESK' },
  { x: 880, y: 350, width: 44, height: 200, tint: 0x2f352a },
  { x: 190, y: 510, width: 160, height: 50, tint: 0x2a3026, label: 'PENDING FORMS' },
];

export class Room {
  readonly obstacles: Phaser.Physics.Arcade.StaticGroup;
  readonly keySpawns: readonly Phaser.Math.Vector2[];
  readonly doorPosition: Phaser.Math.Vector2;
  private readonly blocking: Phaser.Geom.Rectangle[];

  constructor(scene: Phaser.Scene) {
    this.obstacles = scene.physics.add.staticGroup();
    this.blocking = OBSTACLES.map(
      (obstacle) =>
        new Phaser.Geom.Rectangle(
          obstacle.x - obstacle.width / 2,
          obstacle.y - obstacle.height / 2,
          obstacle.width,
          obstacle.height,
        ),
    );
    this.keySpawns = [
      new Phaser.Math.Vector2(990, 170),
      new Phaser.Math.Vector2(790, 590),
      new Phaser.Math.Vector2(450, 360),
      new Phaser.Math.Vector2(150, 170),
      new Phaser.Math.Vector2(1010, 580),
    ];
    this.doorPosition = new Phaser.Math.Vector2(GAME_WIDTH - WORLD_PADDING, 440);

    this.drawEnvironment(scene);
    this.buildObstacles(scene);
  }

  hasLineOfSight(from: Phaser.Math.Vector2, to: Phaser.Math.Vector2): boolean {
    const line = new Phaser.Geom.Line(from.x, from.y, to.x, to.y);
    return !this.blocking.some((rect) => Phaser.Geom.Intersects.LineToRectangle(line, rect));
  }

  private drawEnvironment(scene: Phaser.Scene): void {
    scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.floor);

    const grid = scene.add.graphics();
    grid.lineStyle(1, COLORS.floorLine, 0.4);
    for (let x = WORLD_PADDING; x <= GAME_WIDTH - WORLD_PADDING; x += 64) {
      grid.lineBetween(x, WORLD_TOP, x, WORLD_BOTTOM);
    }
    for (let y = WORLD_TOP; y <= WORLD_BOTTOM; y += 64) {
      grid.lineBetween(WORLD_PADDING, y, GAME_WIDTH - WORLD_PADDING, y);
    }
    grid.destroy();

    const stains = scene.add.graphics();
    stains.fillStyle(COLORS.floorRaised, 0.5);
    stains.fillCircle(430, 590, 34);
    stains.fillCircle(755, 300, 26);
    stains.fillCircle(1010, 420, 20);
    stains.fillStyle(0x241f16, 0.4);
    stains.fillEllipse(640, 620, 120, 44);
    stains.fillEllipse(920, 150, 90, 34);
    stains.destroy();

    this.addStencil(scene, 205, 660, 'RECORDS / CIVIC INTAKE', COLORS.muted, 0.42, -Math.PI / 2);
    this.addStencil(scene, 520, 145, 'ANOMALY TRANSFER', COLORS.muted, 0.42);
    this.addStencil(scene, 950, 660, 'EXIT 04 ROUTING', COLORS.olive, 0.48);
    this.addStencil(scene, 1030, 260, 'NO ADMISSION', COLORS.red, 0.52, Math.PI / 2);
    this.addStencil(scene, 420, 300, 'LOT 44-B', COLORS.muted, 0.3);

    for (let i = 0; i < 14; i += 1) {
      const x = Phaser.Math.Between(WORLD_PADDING + 40, GAME_WIDTH - WORLD_PADDING - 40);
      const y = Phaser.Math.Between(WORLD_TOP + 40, WORLD_BOTTOM - 40);
      scene.add.rectangle(x, y, Phaser.Math.Between(16, 30), Phaser.Math.Between(11, 17), COLORS.paper, 0.1);
    }

    scene.add.rectangle(WORLD_PADDING / 2, GAME_HEIGHT / 2, WORLD_PADDING, GAME_HEIGHT, COLORS.wall);
    scene.add.rectangle(GAME_WIDTH - WORLD_PADDING / 2, GAME_HEIGHT / 2, WORLD_PADDING, GAME_HEIGHT, COLORS.wall);
    scene.add.rectangle(GAME_WIDTH / 2, WORLD_TOP - (WORLD_TOP - 40) / 2, GAME_WIDTH, WORLD_TOP - 40, COLORS.wall);
    scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT - WORLD_PADDING / 2,
      GAME_WIDTH,
      WORLD_PADDING,
      COLORS.wall,
    );

    const wallEdges = scene.add.graphics();
    wallEdges.lineStyle(2, COLORS.wallEdge, 0.6);
    wallEdges.strokeRect(WORLD_PADDING, WORLD_TOP, GAME_WIDTH - WORLD_PADDING * 2, WORLD_BOTTOM - WORLD_TOP);
    wallEdges.destroy();
  }

  private buildObstacles(scene: Phaser.Scene): void {
    OBSTACLES.forEach((definition, index) => {
      const block = this.obstacles.create(definition.x, definition.y, 'pixel') as Phaser.Physics.Arcade.Image;
      block.setDisplaySize(definition.width, definition.height);
      block.setTint(definition.tint);
      block.refreshBody();

      scene.add
        .rectangle(definition.x, definition.y, definition.width, definition.height)
        .setFillStyle(0, 0)
        .setStrokeStyle(1, COLORS.wallEdge, 0.5)
        .setDepth(6);

      if (definition.label) {
        scene.add
          .text(definition.x, definition.y - definition.height / 2 + 4, definition.label, {
            color: '#a4aa9a',
            fontFamily: FONT_FAMILY,
            fontSize: '10px',
          })
          .setOrigin(0.5, 0)
          .setAlpha(0.6)
          .setAngle(index % 2 === 0 ? 0 : 180)
          .setDepth(11);
      }
    });
  }

  private addStencil(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    color: number,
    alpha: number,
    angle = 0,
  ): void {
    scene.add
      .text(x, y, label, {
        color: `#${color.toString(16).padStart(6, '0')}`,
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
      })
      .setOrigin(0.5)
      .setAlpha(alpha)
      .setAngle(angle)
      .setDepth(11);
  }
}
