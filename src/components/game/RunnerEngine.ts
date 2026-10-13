export const WORLD_H = 150;
export const GROUND_Y = 130;
export const MIN_WORLD_W = 300;
export const FRAME_MS = 1000 / 60;

const PLAYER_X = 24;
export const PLAYER_SIZE = { w: 20, h: 35 };
export const PLAYER_DUCK_SIZE = { w: 35, h: 20 };

const GRAVITY = 0.6;
const INITIAL_JUMP_VELOCITY = 8.5;
const DROP_VELOCITY = -3.5;
const MIN_JUMP_HEIGHT = 20;
const SPEED_DROP_COEFFICIENT = 3.0;

export const START_SPEED = 6.0;
export const MAX_SPEED = 13.0;
const ACCELERATION = 0.001;

export const SCORE_COEFFICIENT = 0.025;
const RESTART_DELAY_MS = 300;
const CLEAR_TIME_MS = 2500;

export type ObstacleKind =
  "brokenPc" | "serverRack" | "coffee" | "rubberDuck" | "books" | "bug" | "floppy";

interface ObstacleDef {
  w: number;
  h: number;
  air: boolean;
  maxGroup: number;
}

export const OBSTACLES: Record<ObstacleKind, ObstacleDef> = {
  brokenPc: { w: 24, h: 24, air: false, maxGroup: 1 },
  serverRack: { w: 16, h: 34, air: false, maxGroup: 2 },
  coffee: { w: 14, h: 18, air: false, maxGroup: 3 },
  rubberDuck: { w: 20, h: 18, air: false, maxGroup: 2 },
  books: { w: 18, h: 20, air: false, maxGroup: 1 },
  bug: { w: 24, h: 14, air: true, maxGroup: 1 },
  floppy: { w: 16, h: 16, air: true, maxGroup: 1 },
};

const AIR_HEIGHTS = [6, 24, 52];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Obstacle {
  kind: ObstacleKind;
  x: number;
  y: number;
  w: number;
  h: number;
  group: number;
  gap: number;
}

export interface Player {
  y: number;
  vy: number;
  jumping: boolean;
  ducking: boolean;
  reachedMinHeight: boolean;
}

export type GameStatus = "running" | "over";

export interface GameState {
  status: GameStatus;
  worldW: number;
  speed: number;
  distance: number;
  time: number;
  overTime: number;
  player: Player;
  obstacles: Obstacle[];
  noObstacles: boolean;
  random: () => number;
}

export interface InputState {
  jumpQueued: boolean;
  jumpHeld: boolean;
  duckHeld: boolean;
}

export function createInput(): InputState {
  return { jumpQueued: false, jumpHeld: false, duckHeld: false };
}

export function createGame(worldW: number, random: () => number = Math.random): GameState {
  return {
    status: "running",
    worldW: Math.max(worldW, MIN_WORLD_W),
    speed: START_SPEED,
    distance: 0,
    time: 0,
    overTime: 0,
    player: {
      y: GROUND_Y,
      vy: 0,
      jumping: false,
      ducking: false,
      reachedMinHeight: false,
    },
    obstacles: [],
    noObstacles: false,
    random,
  };
}

export function resetGame(state: GameState, noObstacles = false): void {
  Object.assign(state, createGame(state.worldW, state.random), { noObstacles });
}

export function setWorldWidth(state: GameState, worldW: number): void {
  state.worldW = Math.max(worldW, MIN_WORLD_W);
}

export function getScore(state: GameState): number {
  return Math.floor(state.distance * SCORE_COEFFICIENT);
}

export function canRestart(state: GameState): boolean {
  return state.status === "over" && state.overTime >= RESTART_DELAY_MS;
}

export function playerRect(player: Player): Rect {
  const size = player.ducking && !player.jumping ? PLAYER_DUCK_SIZE : PLAYER_SIZE;
  return { x: PLAYER_X, y: player.y - size.h, w: size.w, h: size.h };
}

export function obstacleRect(obstacle: Obstacle): Rect {
  return {
    x: obstacle.x,
    y: obstacle.y,
    w: obstacle.w * obstacle.group,
    h: obstacle.h,
  };
}

export function collides(player: Player, obstacle: Obstacle): boolean {
  const p = playerRect(player);
  const o = obstacleRect(obstacle);
  return (
    p.x + 3 < o.x + o.w - 3 &&
    p.x + p.w - 3 > o.x + 3 &&
    p.y + 3 < o.y + o.h - 3 &&
    p.y + p.h - 3 > o.y + 3
  );
}

function spawnObstacle(state: GameState): Obstacle {
  const score = getScore(state);
  const kinds = (Object.keys(OBSTACLES) as ObstacleKind[]).filter(
    (kind) => !OBSTACLES[kind].air || score >= 200
  );

  const kind = kinds[Math.floor(state.random() * kinds.length)];
  const def = OBSTACLES[kind];
  const group = !def.air && state.speed >= 6.5 ? 1 + Math.floor(state.random() * def.maxGroup) : 1;
  const bottom = def.air
    ? GROUND_Y - AIR_HEIGHTS[Math.floor(state.random() * AIR_HEIGHTS.length)]
    : GROUND_Y;

  const minGap = Math.round(def.w * group * state.speed + 72);
  const gap = minGap + Math.round(state.random() * (minGap * 0.5));

  return {
    kind,
    x: state.worldW + 10,
    y: bottom - def.h,
    w: def.w,
    h: def.h,
    group,
    gap,
  };
}

function updatePlayer(state: GameState, input: InputState, frames: number): void {
  const player = state.player;

  if (input.jumpQueued && !player.jumping && !input.duckHeld) {
    player.jumping = true;
    player.vy = -(INITIAL_JUMP_VELOCITY + state.speed / 30);
    player.reachedMinHeight = false;
  }
  input.jumpQueued = false;
  player.ducking = input.duckHeld;

  if (!player.jumping) return;

  if (GROUND_Y - player.y >= MIN_JUMP_HEIGHT || player.ducking) player.reachedMinHeight = true;

  if (!input.jumpHeld && player.reachedMinHeight && player.vy < DROP_VELOCITY)
    player.vy = DROP_VELOCITY;

  if (player.ducking && player.vy < 1) player.vy = 1;

  const dropMultiplier = player.ducking ? SPEED_DROP_COEFFICIENT : 1;
  player.y += (player.vy + 0.5 * GRAVITY * frames) * dropMultiplier * frames;
  player.vy += GRAVITY * frames;

  if (player.y >= GROUND_Y) {
    player.y = GROUND_Y;
    player.vy = 0;
    player.jumping = false;
    player.reachedMinHeight = false;
  }
}

function updateObstacles(state: GameState, frames: number): void {
  for (const obstacle of state.obstacles) obstacle.x -= state.speed * frames;

  state.obstacles = state.obstacles.filter((o) => o.x + o.w * o.group > -10);

  if (state.noObstacles || state.time < CLEAR_TIME_MS) return;

  const last = state.obstacles[state.obstacles.length - 1];
  if (!last || last.x + last.w * last.group + last.gap < state.worldW)
    state.obstacles.push(spawnObstacle(state));
}

export function update(state: GameState, input: InputState, dtMs: number): boolean {
  if (state.status === "over") {
    state.overTime += dtMs;
    input.jumpQueued = false;
    return false;
  }

  const frames = dtMs / FRAME_MS;
  state.time += dtMs;
  state.distance += state.speed * frames;
  state.speed = Math.min(MAX_SPEED, state.speed + ACCELERATION * frames);

  updatePlayer(state, input, frames);
  updateObstacles(state, frames);

  if (state.obstacles.some((obstacle) => collides(state.player, obstacle))) {
    state.status = "over";
    state.overTime = 0;
    return true;
  }
  return false;
}
