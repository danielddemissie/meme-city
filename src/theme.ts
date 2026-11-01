export const GAME_WIDTH = 1152;
export const GAME_HEIGHT = 720;
export const WORLD_PADDING = 40;
export const WORLD_TOP = 112;
export const WORLD_BOTTOM = 680;
export const FONT_FAMILY = '"Courier New", Courier, monospace';

export const COLORS = {
  void: 0x0b0c0b,
  floor: 0x151713,
  floorRaised: 0x1c1f19,
  floorLine: 0x2b3025,
  wall: 0x363b30,
  wallEdge: 0x59634a,
  ink: 0xe7eadf,
  muted: 0xa4aa9a,
  olive: 0x738c50,
  oliveBright: 0xa4c477,
  amber: 0xe0a34a,
  red: 0xc45347,
  paper: 0xb9b9a7,
  black: 0x000000,
} as const;

export const PRESSURE_SPEED = {
  story: 52,
  standard: 78,
  relentless: 106,
} as const;

export const PRESSURE_FOCUS_SECONDS = {
  story: 8,
  standard: 5.5,
  relentless: 4,
} as const;
