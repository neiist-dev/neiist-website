// Pure game logic, no DOM. Distances are in world units (WORLD_H tall); velocities are per 60fps frame.

export const WORLD_H = 150;
export const GROUND_Y = 130;
export const MIN_WORLD_W = 300;

export const FRAME_MS = 1000 / 60;

const PLAYER_X = 24;

export const PLAYER_SIZE = { w: 20, h: 35 };
export const PLAYER_DUCK_SIZE = { w: 35, h: 20 };

const GRAVITY = 0.6;
const JUMP_VELOCITY = -8.5;
const DROP_VELOCITY = -5;
const MIN_JUMP_HEIGHT = 30;
const FAST_FALL_MULTIPLIER = 3;

export const START_SPEED = 2.5;
export const MAX_SPEED = 5.5;
const ACCELERATION = 0.0004;

export const SCORE_COEFFICIENT = 0.06;
const AIR_OBSTACLE_MIN_SCORE = 200;
const BASE_GAP = 120;
const GAP_COEFFICIENT = 0.6;
const MAX_GAP_FACTOR = 1.5;
const RESTART_DELAY_MS = 500;

const CLEAR_TIME_MS = 1500;

export type ObstacleKind =
  "brokenPc" | "serverRack" | "coffee" | "rubberDuck" | "books" | "bug" | "floppy";

interface ObstacleDef {
  w: number;
  h: number;
  air: boolean;
  maxGroup: number;
  minSpeed: number;
}

export const OBSTACLES: Record<ObstacleKind, ObstacleDef> = {
  brokenPc: { w: 24, h: 24, air: false, maxGroup: 1, minSpeed: 0 },
  serverRack: { w: 16, h: 34, air: false, maxGroup: 2, minSpeed: 0 },
  coffee: { w: 14, h: 18, air: false, maxGroup: 3, minSpeed: 0 },
  rubberDuck: { w: 20, h: 18, air: false, maxGroup: 2, minSpeed: 0 },
  books: { w: 18, h: 20, air: false, maxGroup: 1, minSpeed: 0 },
  bug: { w: 24, h: 14, air: true, maxGroup: 1, minSpeed: 0 },
  floppy: { w: 16, h: 16, air: true, maxGroup: 1, minSpeed: 0 },
};

const AIR_HEIGHTS = [6, 24, 52];
const GROUP_MIN_SPEED = 3.5;
const AIR_SPEED_OFFSET = 0.8;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Obstacle {
  kind: ObstacleKind;
  x: number;
  /** Top edge. */
  y: number;
  w: number;
  h: number;
  group: number;
  speedOffset: number;
  gap: number;
}

export interface Player {
  y: number;
  vy: number;
  jumping: boolean;
  ducking: boolean;
  falling: boolean;
  jumpStartY: number;
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
      falling: false,
      jumpStartY: GROUND_Y,
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

function inset(rect: Rect, fx: number, fy: number): Rect {
  return {
    x: rect.x + rect.w * fx,
    y: rect.y + rect.h * fy,
    w: rect.w * (1 - 2 * fx),
    h: rect.h * (1 - 2 * fy),
  };
}

export function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Forgiving collision: both hitboxes are shrunk so near-misses don't count. */
export function collides(player: Player, obstacle: Obstacle): boolean {
  const p = inset(playerRect(player), 0.15, 0.08);
  const o = inset(obstacleRect(obstacle), 0.12, 0.12);
  return intersects(p, o);
}

/** Minimum and maximum spacing after an obstacle, growing with speed so it stays jumpable. */
export function gapRange(obstacle: Pick<Obstacle, "w" | "group">, speed: number): [number, number] {
  const min = Math.round(obstacle.w * obstacle.group * speed + BASE_GAP * GAP_COEFFICIENT);
  return [min, Math.round(min * MAX_GAP_FACTOR)];
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

function spawnObstacle(state: GameState): Obstacle {
  const score = getScore(state);
  const kinds = (Object.keys(OBSTACLES) as ObstacleKind[]).filter((kind) => {
    const def = OBSTACLES[kind];
    if (def.air && score < AIR_OBSTACLE_MIN_SCORE) return false;
    return state.speed >= def.minSpeed;
  });

  // Avoid three obstacles of the same kind in a row
  const last = state.obstacles.slice(-2);
  const options =
    last.length === 2 && last[0].kind === last[1].kind
      ? kinds.filter((kind) => kind !== last[0].kind)
      : kinds;
  const kind = pick(options.length > 0 ? options : kinds, state.random);
  const def = OBSTACLES[kind];

  const group =
    !def.air && state.speed >= GROUP_MIN_SPEED ? 1 + Math.floor(state.random() * def.maxGroup) : 1;
  const bottom = def.air ? GROUND_Y - pick(AIR_HEIGHTS, state.random) : GROUND_Y;
  const speedOffset = def.air ? (state.random() < 0.5 ? -AIR_SPEED_OFFSET : AIR_SPEED_OFFSET) : 0;

  const [minGap, maxGap] = gapRange({ w: def.w, group }, state.speed);
  const gap = minGap + Math.round(state.random() * (maxGap - minGap));

  return {
    kind,
    x: state.worldW + 10,
    y: bottom - def.h,
    w: def.w,
    h: def.h,
    group,
    speedOffset,
    gap,
  };
}

function updatePlayer(state: GameState, input: InputState, frames: number): void {
  const player = state.player;

  if (input.jumpQueued && !player.jumping && !input.duckHeld) {
    player.jumping = true;
    player.falling = false;
    player.vy = JUMP_VELOCITY - state.speed / 20;
    player.jumpStartY = player.y;
  }
  input.jumpQueued = false;

  player.ducking = input.duckHeld;

  if (!player.jumping) return;

  const risen = player.jumpStartY - player.y;
  // Releasing the jump key early gives a shorter hop
  if (!input.jumpHeld && !player.falling && risen >= MIN_JUMP_HEIGHT && player.vy < DROP_VELOCITY) {
    player.vy = DROP_VELOCITY;
    player.falling = true;
  }

  const gravity = player.ducking ? GRAVITY * FAST_FALL_MULTIPLIER : GRAVITY;
  player.y += player.vy * frames;
  player.vy += gravity * frames;

  if (player.y >= GROUND_Y) {
    player.y = GROUND_Y;
    player.vy = 0;
    player.jumping = false;
    player.falling = false;
  }
}

function updateObstacles(state: GameState, frames: number): void {
  for (const obstacle of state.obstacles) {
    obstacle.x -= (state.speed + obstacle.speedOffset) * frames;
  }
  state.obstacles = state.obstacles.filter((o) => o.x + o.w * o.group > -10);

  if (state.noObstacles || state.time < CLEAR_TIME_MS) return;

  const last = state.obstacles[state.obstacles.length - 1];
  if (!last || last.x + last.w * last.group + last.gap < state.worldW) {
    state.obstacles.push(spawnObstacle(state));
  }
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
