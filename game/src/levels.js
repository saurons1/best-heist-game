// The three rooms of the heist. Each level is one walled gallery inside ROOM
// (x 24..1256, y 80..704): obstacles are cover that blocks both movement and sight,
// guards walk waypoint loops, cameras sweep from the walls, small loot is optional
// score, the vault piece is the target, and the exit only opens once it is taken.
//
// Every layout leaves at least two routes to the vault: a fast open lane under the
// cones and a slow covered lane behind the cases. Coordinates are world pixels.

export const LEVELS = [
  {
    name: 'The Gallery',
    sub: 'Night one — the Halcyon Gallery',
    brief: 'Two guards, one camera. Learn the cones, then lift the Sapphire.',
    obstacles: [
      { x: 400, y: 200, w: 220, h: 60, label: 'display case' },
      { x: 180, y: 380, w: 120, h: 90, label: 'crates' },
      { x: 700, y: 480, w: 220, h: 60, label: 'display case' },
      { x: 1000, y: 220, w: 70, h: 70, label: 'pillar' },
    ],
    guards: [
      { path: [[200, 180], [600, 180], [600, 420], [200, 420]] },
      { path: [[900, 500], [1100, 500], [1100, 250], [900, 250]] },
    ],
    cameras: [
      { x: 640, y: 84, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.55 },
    ],
    loot: [
      { x: 120, y: 150, kind: 'gold' },
      { x: 1150, y: 150, kind: 'art' },
      { x: 120, y: 640, kind: 'art' },
      { x: 1150, y: 640, kind: 'gold' },
    ],
    vault: { x: 1150, y: 380, name: 'the Sapphire' },
    exit: { x: 1224, y: 560, w: 32, h: 80, side: 'right' },
    start: { x: 80, y: 620 },
  },
  {
    name: 'The Vault Hall',
    sub: 'Night two — the Vault Hall',
    brief: 'Three guards, two cameras. The Ruby sits top-right; the door is below.',
    obstacles: [
      { x: 300, y: 180, w: 320, h: 60, label: 'display case' },
      { x: 660, y: 480, w: 320, h: 60, label: 'display case' },
      { x: 150, y: 300, w: 110, h: 110, label: 'crates' },
      { x: 1020, y: 300, w: 110, h: 110, label: 'crates' },
      { x: 590, y: 330, w: 80, h: 80, label: 'pillar' },
    ],
    guards: [
      { path: [[150, 150], [1100, 150]] },
      { path: [[640, 200], [640, 600]] },
      { path: [[250, 550], [1000, 550], [1000, 380], [250, 380]] },
    ],
    cameras: [
      { x: 320, y: 84, baseAngle: Math.PI / 2 + 0.5, sweep: 0.8, speed: 0.6 },
      { x: 960, y: 84, baseAngle: Math.PI / 2 - 0.5, sweep: 0.8, speed: 0.6 },
    ],
    loot: [
      { x: 120, y: 620, kind: 'gold' },
      { x: 120, y: 150, kind: 'art' },
      { x: 1150, y: 620, kind: 'gold' },
      { x: 640, y: 640, kind: 'art' },
      { x: 640, y: 130, kind: 'gold' },
    ],
    vault: { x: 1150, y: 150, name: 'the Ruby' },
    exit: { x: 560, y: 680, w: 160, h: 24, side: 'bottom' },
    start: { x: 80, y: 150 },
  },
  {
    name: 'The Diamond Room',
    sub: 'Night three — the Diamond Room',
    brief: 'Four guards, three cameras. The Marlowe Diamond is on the pedestal. Get out left.',
    obstacles: [
      { x: 300, y: 200, w: 200, h: 60, label: 'display case' },
      { x: 780, y: 200, w: 200, h: 60, label: 'display case' },
      { x: 300, y: 460, w: 200, h: 60, label: 'display case' },
      { x: 780, y: 460, w: 200, h: 60, label: 'display case' },
      { x: 600, y: 320, w: 80, h: 80, label: 'pedestal' },
      { x: 120, y: 300, w: 90, h: 90, label: 'crates' },
      { x: 1070, y: 300, w: 90, h: 90, label: 'crates' },
    ],
    guards: [
      { path: [[150, 140], [1130, 140]] },
      { path: [[200, 200], [200, 600]] },
      { path: [[1080, 200], [1080, 600]] },
      { path: [[500, 260], [780, 260], [780, 460], [500, 460]] },
    ],
    cameras: [
      { x: 200, y: 84, baseAngle: Math.PI / 2 + 0.4, sweep: 0.7, speed: 0.65 },
      { x: 1080, y: 84, baseAngle: Math.PI / 2 - 0.4, sweep: 0.7, speed: 0.65 },
      { x: 640, y: 700, baseAngle: -Math.PI / 2, sweep: 0.8, speed: 0.5 },
    ],
    loot: [
      { x: 120, y: 150, kind: 'gold' },
      { x: 1150, y: 150, kind: 'art' },
      { x: 120, y: 620, kind: 'art' },
      { x: 1150, y: 620, kind: 'gold' },
      { x: 640, y: 130, kind: 'gold' },
      { x: 640, y: 640, kind: 'art' },
    ],
    vault: { x: 640, y: 292, name: 'the Marlowe Diamond' },
    exit: { x: 24, y: 560, w: 32, h: 80, side: 'left' },
    start: { x: 80, y: 620 },
  },
];
