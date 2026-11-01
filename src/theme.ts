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

const STAFF = [
  {
    id: 'glancing',
    name: 'THE GLANCING MAN',
    role: 'NIGHT CLERK — FILE 27-B',
    texture: 'glancing-man',
    tint: 0xffffff,
    speedFactor: 1,
    focusFactor: 1,
    knockPattern: [0],
    voice: 'knock',
    notice: 'THE GLANCING MAN HAS YOUR FILE OPEN.',
  },
  {
    id: 'tung',
    name: 'SR. TUNG TUNG TUNG',
    role: 'RECORDS ANNEX — KNOCKS THRICE',
    texture: 'staff-tung',
    tint: 0xffffff,
    speedFactor: 0.85,
    focusFactor: 1,
    knockPattern: [0, 0.28, 0.56],
    voice: 'knock',
    notice: 'A KNOCK FOLLOWS YOU. SR. TUNG TUNG TUNG HAS YOUR FILE.',
  },
  {
    id: 'tralalero',
    name: 'ERWIN TRALALERO',
    role: 'FIELD OFFICER — WEARS SNEAKERS',
    texture: 'staff-tralalero',
    tint: 0xffffff,
    speedFactor: 1.35,
    focusFactor: 1.15,
    knockPattern: [0],
    voice: 'squeak',
    notice: 'SNEAKER SQUEAKS APPROACH. ERWIN TRALALERO HAS YOUR FILE.',
  },
  {
    id: 'bombardiro',
    name: 'CAPT. BOMBARDIRO',
    role: 'AIR CARGO — NEVER LOGS A LANDING',
    texture: 'staff-bombardiro',
    tint: 0xffffff,
    speedFactor: 1.1,
    focusFactor: 0.85,
    knockPattern: [0, 1.4],
    voice: 'engine',
    notice: 'PROPELLER NOISE ON THE FLOOR. CAPT. BOMBARDIRO HAS YOUR FILE.',
  },
  {
    id: 'ballerina',
    name: 'BALLERINA C.',
    role: 'RECEPTION — HUMS WHILE YOU BLINK',
    texture: 'staff-ballerina',
    tint: 0xffffff,
    speedFactor: 0.9,
    focusFactor: 1.25,
    knockPattern: [0, 0.36, 0.72, 1.08],
    voice: 'taps',
    notice: 'POINTE SHOES TAP DOWN THE AISLE. BALLERINA C. HAS YOUR FILE.',
  },
  {
    id: 'patapim',
    name: 'GROUNDSKEEPER PATAPIM',
    role: 'GROUNDS — WHISTLES, ON OCCASION',
    texture: 'staff-patapim',
    tint: 0xffffff,
    speedFactor: 0.75,
    focusFactor: 1.05,
    knockPattern: [0],
    voice: 'whistle',
    notice: 'FOOTSTEPS IN LEAF LITTER. GROUNDSKEEPER PATAPIM HAS YOUR FILE.',
  },
] as const;

export const ROSTER: readonly (typeof STAFF[number] & { knockPattern: readonly number[] })[] = STAFF;

export const ROSTER_IMAGES = [
  { key: 'staff-tung', file: 'assets/tung.png' },
  { key: 'staff-tralalero', file: 'assets/tralalero.webp' },
  { key: 'staff-bombardiro', file: 'assets/bombardiro.jpg' },
  { key: 'staff-ballerina', file: 'assets/ballerina.png' },
  { key: 'staff-patapim', file: 'assets/patapim.jpg' },
] as const;

export const MEME_PACK_SLOTS = ['spotted', 'blink', 'win', 'fail', 'voice'] as const;
export type MemePackSlot = (typeof MEME_PACK_SLOTS)[number];
