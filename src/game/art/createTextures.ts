import Phaser from 'phaser';

export const TEXTURE_KEYS = Object.freeze({
  marine: 'marine',
  alienDrone: 'alien-drone',
  alienRunner: 'alien-runner',
  alienSpitter: 'alien-spitter',
  alienBrute: 'alien-brute',
  alienStalker: 'alien-stalker',
  alienQueen: 'alien-queen',
  projectileBullet: 'projectile-bullet',
  projectilePlasma: 'projectile-plasma',
  projectileAcid: 'projectile-acid',
  muzzleFlash: 'muzzle-flash',
  pickup: 'pickup',
  door: 'facility-door',
  wall: 'facility-wall',
  floor: 'facility-floor',
  grate: 'facility-grate',
  hazard: 'facility-hazard',
  console: 'facility-console',
  crate: 'facility-crate',
  barrel: 'facility-barrel',
  generator: 'facility-generator',
  teleporter: 'facility-teleporter',
  armory: 'facility-armory',
  turret: 'facility-turret',
  radar: 'facility-radar',
  touchStick: 'touch-stick',
  touchButton: 'touch-button',
  splatter: 'effect-splatter',
  scorch: 'effect-scorch',
  shellCasing: 'effect-shell-casing',
  hudHealth: 'hud-health',
  hudArmor: 'hud-armor',
  hudAmmo: 'hud-ammo',
} as const);

export type TextureKey = (typeof TEXTURE_KEYS)[keyof typeof TEXTURE_KEYS];

type TextureDefinition = Readonly<{
  key: TextureKey;
  width: number;
  height: number;
  draw: (graphics: Phaser.GameObjects.Graphics) => void;
}>;

const COLORS = {
  hull: 0x070a0f,
  panel: 0x111923,
  steel: 0x81909e,
  cyan: 0x69d8e7,
  orange: 0xf39237,
  bone: 0xf4efe6,
  alien: 0x91be61,
  alienDark: 0x263d2c,
  acid: 0xb6e35f,
} as const;

const polygon = (
  graphics: Phaser.GameObjects.Graphics,
  points: readonly number[],
  color: number,
): void => {
  graphics.fillStyle(color, 1);
  graphics.beginPath();
  graphics.moveTo(points[0], points[1]);
  for (let index = 2; index < points.length; index += 2) {
    graphics.lineTo(points[index], points[index + 1]);
  }
  graphics.closePath();
  graphics.fillPath();
};

const alienBody = (
  graphics: Phaser.GameObjects.Graphics,
  variant: 'drone' | 'runner' | 'spitter' | 'brute' | 'stalker',
): void => {
  const wide = variant === 'brute';
  const long = variant === 'runner';
  const bodyWidth = wide ? 40 : long ? 24 : 30;
  graphics.fillStyle(COLORS.alienDark, 1);
  graphics.fillEllipse(32, 34, bodyWidth + 10, wide ? 34 : 28);
  graphics.fillStyle(COLORS.alien, 1);
  graphics.fillEllipse(32, 29, bodyWidth, wide ? 30 : 24);
  polygon(graphics, [23, 18, 28, 6, 33, 18], COLORS.alien);
  polygon(graphics, [31, 18, 38, 5, 42, 20], COLORS.alien);
  graphics.lineStyle(wide ? 6 : 4, COLORS.alien, 1);
  graphics.lineBetween(22, 37, 8, 52);
  graphics.lineBetween(42, 37, 56, 52);
  graphics.lineBetween(24, 40, 17, 59);
  graphics.lineBetween(40, 40, 47, 59);
  if (variant === 'spitter') {
    graphics.fillStyle(COLORS.acid, 1);
    graphics.fillCircle(32, 30, 7);
  } else if (variant === 'stalker') {
    graphics.lineStyle(2, COLORS.cyan, 0.8);
    graphics.strokeEllipse(32, 29, 24, 18);
  } else if (variant === 'drone') {
    graphics.fillStyle(COLORS.orange, 1);
    graphics.fillCircle(26, 25, 2);
    graphics.fillCircle(38, 25, 2);
  }
};

const DEFINITIONS: readonly TextureDefinition[] = [
  {
    key: TEXTURE_KEYS.marine,
    width: 64,
    height: 64,
    draw: (g) => {
      g.fillStyle(0x182632, 1);
      g.fillCircle(30, 30, 20);
      g.fillStyle(COLORS.steel, 1);
      g.fillRoundedRect(18, 20, 25, 28, 7);
      g.fillStyle(COLORS.bone, 1);
      g.fillCircle(30, 16, 8);
      g.fillStyle(COLORS.cyan, 1);
      g.fillRect(23, 14, 14, 4);
      g.fillStyle(0x28343d, 1);
      g.fillRect(39, 27, 21, 6);
      g.fillStyle(COLORS.orange, 1);
      g.fillRect(54, 28, 7, 4);
    },
  },
  ...(
    [
      [TEXTURE_KEYS.alienDrone, 'drone'],
      [TEXTURE_KEYS.alienRunner, 'runner'],
      [TEXTURE_KEYS.alienSpitter, 'spitter'],
      [TEXTURE_KEYS.alienBrute, 'brute'],
      [TEXTURE_KEYS.alienStalker, 'stalker'],
    ] as const
  ).map(([key, variant]) => ({
    key,
    width: 64,
    height: 64,
    draw: (g: Phaser.GameObjects.Graphics) => alienBody(g, variant),
  })),
  {
    key: TEXTURE_KEYS.alienQueen,
    width: 128,
    height: 128,
    draw: (g) => {
      g.fillStyle(0x18291e, 1);
      g.fillEllipse(64, 70, 82, 62);
      g.fillStyle(0x789c50, 1);
      g.fillEllipse(64, 57, 64, 55);
      polygon(g, [34, 48, 10, 14, 48, 36], 0x91be61);
      polygon(g, [50, 38, 42, 4, 62, 35], 0xa5cc70);
      polygon(g, [66, 35, 82, 3, 82, 42], 0xa5cc70);
      polygon(g, [82, 42, 118, 16, 94, 55], 0x91be61);
      g.lineStyle(9, 0x789c50, 1);
      g.lineBetween(38, 76, 10, 110);
      g.lineBetween(50, 84, 32, 124);
      g.lineBetween(78, 84, 96, 124);
      g.lineBetween(90, 76, 118, 110);
      g.fillStyle(COLORS.orange, 1);
      g.fillCircle(52, 55, 4);
      g.fillCircle(76, 55, 4);
    },
  },
  {
    key: TEXTURE_KEYS.projectileBullet,
    width: 18,
    height: 6,
    draw: (g) => {
      g.fillStyle(COLORS.bone, 1);
      g.fillRoundedRect(0, 1, 14, 4, 2);
      g.fillStyle(COLORS.orange, 1);
      g.fillRect(13, 0, 5, 6);
    },
  },
  {
    key: TEXTURE_KEYS.projectilePlasma,
    width: 16,
    height: 16,
    draw: (g) => {
      g.fillStyle(COLORS.cyan, 0.3);
      g.fillCircle(8, 8, 8);
      g.fillStyle(0xd7fbff, 1);
      g.fillCircle(8, 8, 4);
    },
  },
  {
    key: TEXTURE_KEYS.projectileAcid,
    width: 16,
    height: 16,
    draw: (g) => {
      g.fillStyle(COLORS.acid, 0.35);
      g.fillCircle(8, 8, 8);
      g.fillStyle(COLORS.acid, 1);
      g.fillCircle(8, 8, 4);
    },
  },
  {
    key: TEXTURE_KEYS.muzzleFlash,
    width: 32,
    height: 24,
    draw: (g) => {
      polygon(g, [0, 12, 18, 6, 14, 0, 32, 12, 14, 24, 18, 17], COLORS.orange);
      polygon(g, [2, 12, 19, 9, 25, 12, 19, 15], COLORS.bone);
    },
  },
  {
    key: TEXTURE_KEYS.pickup,
    width: 32,
    height: 32,
    draw: (g) => {
      g.fillStyle(COLORS.cyan, 0.2);
      g.fillCircle(16, 16, 15);
      g.lineStyle(3, COLORS.cyan, 1);
      g.strokeRect(8, 8, 16, 16);
      g.lineBetween(16, 10, 16, 22);
      g.lineBetween(10, 16, 22, 16);
    },
  },
  {
    key: TEXTURE_KEYS.door,
    width: 64,
    height: 64,
    draw: (g) => {
      g.fillStyle(0x17212a, 1);
      g.fillRect(0, 0, 64, 64);
      g.lineStyle(4, 0x354754, 1);
      g.strokeRect(2, 2, 60, 60);
      g.fillStyle(COLORS.orange, 1);
      for (let x = -24; x < 72; x += 20) polygon(g, [x, 64, x + 10, 64, x + 42, 0, x + 32, 0], COLORS.orange);
      g.fillStyle(0x111923, 0.82);
      g.fillRect(0, 20, 64, 24);
      g.fillStyle(COLORS.cyan, 1);
      g.fillRect(8, 29, 48, 6);
    },
  },
  {
    key: TEXTURE_KEYS.wall,
    width: 64,
    height: 64,
    draw: (g) => {
      g.fillStyle(0x16202a, 1);
      g.fillRect(0, 0, 64, 64);
      g.lineStyle(3, 0x34434e, 1);
      g.strokeRect(2, 2, 60, 60);
      g.lineStyle(2, 0x24323d, 1);
      g.lineBetween(8, 8, 56, 56);
      g.lineBetween(56, 8, 8, 56);
      g.fillStyle(COLORS.steel, 1);
      g.fillCircle(8, 8, 3);
      g.fillCircle(56, 8, 3);
      g.fillCircle(8, 56, 3);
      g.fillCircle(56, 56, 3);
    },
  },
  {
    key: TEXTURE_KEYS.floor,
    width: 96,
    height: 96,
    draw: (g) => {
      g.fillStyle(0x0c1218, 1);
      g.fillRect(0, 0, 96, 96);
      g.lineStyle(2, 0x18232c, 1);
      g.strokeRect(2, 2, 92, 92);
      g.lineBetween(48, 2, 48, 94);
      g.fillStyle(0x26333d, 1);
      g.fillCircle(9, 9, 2);
      g.fillCircle(87, 87, 2);
    },
  },
  {
    key: TEXTURE_KEYS.grate,
    width: 64,
    height: 64,
    draw: (g) => {
      g.fillStyle(0x091016, 1);
      g.fillRect(0, 0, 64, 64);
      g.lineStyle(3, 0x263640, 1);
      for (let x = 6; x < 64; x += 10) g.lineBetween(x, 0, x, 64);
      g.lineStyle(1, 0x69d8e7, 0.16);
      g.lineBetween(0, 16, 64, 16);
      g.lineBetween(0, 48, 64, 48);
    },
  },
  {
    key: TEXTURE_KEYS.hazard,
    width: 64,
    height: 32,
    draw: (g) => {
      g.fillStyle(0x111923, 1);
      g.fillRect(0, 0, 64, 32);
      for (let x = -28; x < 72; x += 24) {
        polygon(g, [x, 32, x + 12, 32, x + 40, 0, x + 28, 0], COLORS.orange);
      }
      g.lineStyle(2, 0x354754, 1);
      g.strokeRect(1, 1, 62, 30);
    },
  },
  {
    key: TEXTURE_KEYS.console,
    width: 80,
    height: 48,
    draw: (g) => {
      g.fillStyle(0x17212a, 1);
      g.fillRoundedRect(0, 0, 80, 48, 6);
      g.lineStyle(2, 0x3e5260, 1);
      g.strokeRoundedRect(2, 2, 76, 44, 5);
      g.fillStyle(0x0b2830, 1);
      g.fillRect(10, 9, 48, 23);
      g.fillStyle(COLORS.cyan, 1);
      g.fillRect(15, 14, 30, 3);
      g.fillRect(15, 21, 20, 3);
      g.fillStyle(COLORS.orange, 1);
      g.fillCircle(68, 15, 4);
    },
  },
  {
    key: TEXTURE_KEYS.crate,
    width: 72,
    height: 72,
    draw: (g) => {
      g.fillStyle(0x29343b, 1);
      g.fillRect(0, 0, 72, 72);
      g.lineStyle(5, 0x53616a, 1);
      g.strokeRect(3, 3, 66, 66);
      g.lineBetween(8, 8, 64, 64);
      g.lineBetween(64, 8, 8, 64);
      g.fillStyle(COLORS.orange, 1);
      g.fillRect(27, 3, 18, 6);
    },
  },
  {
    key: TEXTURE_KEYS.barrel,
    width: 48,
    height: 48,
    draw: (g) => {
      g.fillStyle(0x34434b, 1);
      g.fillCircle(24, 24, 22);
      g.lineStyle(4, 0x64747d, 1);
      g.strokeCircle(24, 24, 20);
      g.lineBetween(8, 24, 40, 24);
      g.fillStyle(COLORS.orange, 1);
      g.fillCircle(24, 24, 5);
    },
  },
  {
    key: TEXTURE_KEYS.generator,
    width: 120,
    height: 80,
    draw: (g) => {
      g.fillStyle(0x17212a, 1);
      g.fillRoundedRect(2, 8, 116, 68, 8);
      g.lineStyle(4, 0x526264, 1);
      g.strokeRoundedRect(4, 10, 112, 64, 7);
      g.fillStyle(0x0a1016, 1);
      g.fillRect(18, 20, 54, 42);
      g.lineStyle(3, COLORS.cyan, 0.7);
      for (let x = 24; x <= 66; x += 14) g.lineBetween(x, 24, x, 58);
      g.fillStyle(COLORS.orange, 1);
      g.fillCircle(94, 28, 6);
      g.fillStyle(COLORS.steel, 1);
      g.fillRect(84, 48, 22, 10);
    },
  },
  {
    key: TEXTURE_KEYS.teleporter,
    width: 120,
    height: 120,
    draw: (g) => {
      g.fillStyle(0x101820, 1);
      g.fillCircle(60, 60, 56);
      g.lineStyle(8, 0x34434e, 1);
      g.strokeCircle(60, 60, 48);
      g.lineStyle(4, COLORS.cyan, 0.85);
      g.strokeCircle(60, 60, 34);
      g.lineStyle(2, COLORS.cyan, 0.5);
      g.lineBetween(60, 16, 60, 104);
      g.lineBetween(16, 60, 104, 60);
      g.fillStyle(COLORS.orange, 1);
      g.fillCircle(60, 60, 8);
    },
  },
  {
    key: TEXTURE_KEYS.armory,
    width: 80,
    height: 80,
    draw: (g) => {
      g.fillStyle(0x17212a, 1);
      g.fillRoundedRect(2, 2, 76, 76, 8);
      g.lineStyle(4, COLORS.orange, 1);
      g.strokeRoundedRect(4, 4, 72, 72, 7);
      g.fillStyle(COLORS.bone, 1);
      g.fillRect(19, 36, 42, 9);
      g.fillRect(49, 29, 10, 23);
      g.fillStyle(COLORS.cyan, 1);
      g.fillRect(12, 62, 56, 4);
    },
  },
  {
    key: TEXTURE_KEYS.turret,
    width: 80,
    height: 80,
    draw: (g) => {
      g.fillStyle(0x18232c, 1);
      g.fillCircle(36, 40, 25);
      g.lineStyle(5, 0x60717d, 1);
      g.strokeCircle(36, 40, 21);
      g.fillStyle(0x81909e, 1);
      g.fillRoundedRect(30, 17, 18, 46, 6);
      g.fillRect(43, 34, 35, 10);
      g.fillStyle(COLORS.cyan, 1);
      g.fillCircle(36, 40, 6);
    },
  },
  {
    key: TEXTURE_KEYS.radar,
    width: 128,
    height: 128,
    draw: (g) => {
      g.fillStyle(0x0a151b, 1);
      g.fillCircle(64, 64, 62);
      g.lineStyle(2, COLORS.cyan, 0.6);
      g.strokeCircle(64, 64, 58);
      g.strokeCircle(64, 64, 38);
      g.strokeCircle(64, 64, 19);
      g.lineStyle(1, COLORS.cyan, 0.45);
      g.lineBetween(6, 64, 122, 64);
      g.lineBetween(64, 6, 64, 122);
      g.fillStyle(COLORS.orange, 1);
      g.fillCircle(89, 46, 4);
    },
  },
  {
    key: TEXTURE_KEYS.touchStick,
    width: 128,
    height: 128,
    draw: (g) => {
      g.fillStyle(0x0a151b, 0.48);
      g.fillCircle(64, 64, 60);
      g.lineStyle(3, COLORS.cyan, 0.65);
      g.strokeCircle(64, 64, 58);
      g.strokeCircle(64, 64, 24);
      g.lineStyle(1, COLORS.cyan, 0.35);
      g.lineBetween(12, 64, 116, 64);
      g.lineBetween(64, 12, 64, 116);
    },
  },
  {
    key: TEXTURE_KEYS.touchButton,
    width: 72,
    height: 72,
    draw: (g) => {
      g.fillStyle(0x111923, 0.72);
      g.fillCircle(36, 36, 34);
      g.lineStyle(3, COLORS.orange, 0.9);
      g.strokeCircle(36, 36, 31);
      g.fillStyle(COLORS.orange, 1);
      g.fillCircle(36, 36, 7);
    },
  },
  {
    key: TEXTURE_KEYS.splatter,
    width: 64,
    height: 64,
    draw: (g) => {
      g.fillStyle(0x385d2b, 0.72);
      g.fillEllipse(32, 34, 40, 27);
      g.fillCircle(12, 20, 6);
      g.fillCircle(51, 15, 4);
      g.fillCircle(54, 49, 7);
      g.fillCircle(19, 55, 3);
      polygon(g, [24, 25, 27, 3, 34, 27], 0x385d2b);
    },
  },
  {
    key: TEXTURE_KEYS.scorch,
    width: 72,
    height: 72,
    draw: (g) => {
      g.fillStyle(0x020303, 0.2);
      g.fillCircle(36, 36, 34);
      g.fillStyle(0x050708, 0.42);
      g.fillCircle(36, 36, 25);
      g.lineStyle(3, 0x293036, 0.32);
      g.lineBetween(10, 18, 62, 54);
      g.lineBetween(17, 61, 55, 9);
    },
  },
  {
    key: TEXTURE_KEYS.shellCasing,
    width: 12,
    height: 5,
    draw: (g) => {
      g.fillStyle(0xb18a48, 1);
      g.fillRoundedRect(0, 0, 10, 5, 2);
      g.fillStyle(0x5e4927, 1);
      g.fillRect(9, 0, 3, 5);
    },
  },
  {
    key: TEXTURE_KEYS.hudHealth,
    width: 32,
    height: 32,
    draw: (g) => {
      g.fillStyle(COLORS.bone, 1);
      g.fillRect(12, 4, 8, 24);
      g.fillRect(4, 12, 24, 8);
    },
  },
  {
    key: TEXTURE_KEYS.hudArmor,
    width: 32,
    height: 32,
    draw: (g) => {
      polygon(g, [16, 2, 28, 8, 25, 23, 16, 30, 7, 23, 4, 8], COLORS.cyan);
      polygon(g, [16, 7, 23, 11, 21, 20, 16, 24, 11, 20, 9, 11], COLORS.hull);
    },
  },
  {
    key: TEXTURE_KEYS.hudAmmo,
    width: 32,
    height: 32,
    draw: (g) => {
      g.fillStyle(COLORS.orange, 1);
      g.fillRoundedRect(11, 3, 10, 26, 4);
      polygon(g, [11, 9, 16, 2, 21, 9], COLORS.bone);
      g.fillStyle(0x5e4927, 1);
      g.fillRect(10, 24, 12, 5);
    },
  },
];

export const createTextures = (scene: Phaser.Scene): void => {
  for (const definition of DEFINITIONS) {
    if (scene.textures.exists(definition.key)) continue;

    const graphics = scene.add.graphics().setVisible(false);
    try {
      definition.draw(graphics);
      graphics.generateTexture(definition.key, definition.width, definition.height);
    } finally {
      graphics.destroy();
    }
  }
};
