// Tuning and shared constants for The Marlowe Job. One place holds every number the
// world and the renderer agree on, so a balance change is a one-line edit here.

export const VIEW = { width: 1280, height: 720 };
export const HUD_HEIGHT = 64;
export const STEP = 1 / 60;
export const BEST_KEY = 'marlowe-job-best';

// The playfield: the walled room below the HUD bar.
export const ROOM = { x: 24, y: HUD_HEIGHT + 16, width: 1232, height: 624 };

export const THIEF = {
  radius: 13,
  walkSpeed: 178,
  sneakSpeed: 96,
  // While sneaking the thief is harder to spot: detection fills the alarm this much slower.
  sneakSpotFactor: 0.45,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 62,
  suspiciousSpeed: 108,
  chaseSpeed: 148,
  pauseAtWaypoint: 1.4,
  // Vision cone, in world units and radians.
  sightRange: 215,
  sightHalfAngle: 0.56,
  // Alarm per second while this guard has the thief in its cone with a clear line of sight.
  spotRate: 26,
};

export const CAMERA = {
  sightRange: 235,
  sightHalfAngle: 0.46,
  spotRate: 34,
  sweepSpeed: 0.55,
};

export const ALARM = {
  decayPerSecond: 9,
  suspiciousAt: 40,
  alertAt: 70,
  // Alarm level the thief respawns at after being busted.
  respawnAt: 35,
};

export const TOOLS = {
  smokePerLevel: 2,
  smokeRadius: 78,
  smokeSeconds: 4.5,
  empPerLevel: 1,
  empSeconds: 6,
  // Using a tool costs score: tools are powerful, so they are never free.
  scoreCost: 25,
};

export const SCORE = {
  smallLoot: 40,
  vaultLoot: 150,
  toolCost: 25,
  levelTimeBonusMax: 300,
  levelTimeBonusPerSecond: 2,
  ghostBonus: 100,
  lifeBonus: 150,
};

export const SCREENS = {
  TITLE: 'title',
  PLAY: 'play',
  PAUSED: 'paused',
  LEVEL_DONE: 'level-done',
  BUSTED: 'busted',
  OVER: 'over',
  WIN: 'win',
};

export const EVENTS = {
  NONE: 0,
  LOOT: 1 << 0,
  VAULT: 1 << 1,
  BUSTED: 1 << 2,
  LEVEL_DONE: 1 << 3,
  GAME_OVER: 1 << 4,
  WIN: 1 << 5,
  SPOTTED: 1 << 6,
};
