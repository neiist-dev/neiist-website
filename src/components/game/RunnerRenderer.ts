import type { Assets, Sprite } from "@/components/game/RunnerAssets";
import {
  GROUND_Y,
  MIN_WORLD_W,
  WORLD_H,
  getScore,
  isDucking,
  playerRect,
  type GameState,
  type Rect,
} from "./RunnerEngine";

const INK = "#111111";
const GROUND_COLOURS = ["#2863fd", "#258be3", "#34d1f9", "#5ee8fa"];
const HERO_PIXEL = GROUND_Y / 344;
const BACKDROP_PIXEL = 1.5;

const CLOUD_SPAN = 640;
const CLOUDS = [
  { x: 20, y: -12, variant: 0 },
  { x: 110, y: 22, variant: 2 },
  { x: 190, y: -30, variant: 1 },
  { x: 250, y: 4, variant: 1 },
  { x: 340, y: 30, variant: 0 },
  { x: 410, y: -22, variant: 2 },
  { x: 470, y: -4, variant: 2 },
  { x: 560, y: 14, variant: 0 },
];

const SKYLINE_BUILDINGS = { left: { sx: 40, sw: 580 }, right: { sx: 770, sw: 400 } };
const SKYLINE_PARALLAX = 0.02;
const SKYLINE_MIN_SPAN = 420;

let bgCanvas: HTMLCanvasElement | null = null;

export interface View {
  scale: number;
  width: number;
  height: number;
  reducedMotion: boolean;
}

export function computeView(cssW: number, cssH: number, dpr: number, reducedMotion: boolean): View {
  const minVisibleW = Math.min(Math.max(cssW / 2, MIN_WORLD_W), 600);
  const cssScale = Math.min(cssH / WORLD_H, cssW / minVisibleW);
  return {
    scale: cssScale * dpr,
    width: cssW / cssScale,
    height: cssH / cssScale,
    reducedMotion,
  };
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite | undefined,
  frame: number,
  dest: Rect
): void {
  if (!sprite) {
    ctx.fillStyle = INK;
    ctx.fillRect(dest.x, dest.y, dest.w, dest.h);
    return;
  }
  const f = frame % sprite.frames;
  ctx.drawImage(
    sprite.image,
    f * sprite.frameW,
    0,
    sprite.frameW,
    sprite.h,
    dest.x,
    dest.y,
    dest.w,
    dest.h
  );
}

function drawRepeating(
  view: View,
  span: number,
  offset: number,
  drawAt: (_x: number) => void
): void {
  for (let x = -(offset % span) - span; x < view.width; x += span) {
    drawAt(x);
  }
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  assets: Assets,
  view: View
): void {
  const distance = view.reducedMotion ? 0 : state.distance;

  const clouds = assets.clouds;
  if (clouds) {
    const w = clouds.frameW * HERO_PIXEL;
    const h = clouds.h * HERO_PIXEL;
    drawRepeating(view, CLOUD_SPAN, distance * 0.5, (base) => {
      for (const c of CLOUDS) {
        drawSprite(ctx, clouds, c.variant, { x: base + c.x, y: c.y, w, h });
      }
    });
  }

  const scenery = assets.scenery;
  if (scenery) {
    const w = scenery.frameW * BACKDROP_PIXEL;
    const h = scenery.h * BACKDROP_PIXEL;
    ctx.globalAlpha = 0.55;
    drawRepeating(view, w, distance * 0.008, (x) => {
      drawSprite(ctx, scenery, 0, { x, y: GROUND_Y - h, w, h });
    });
    ctx.globalAlpha = 1;
  }

  const skyline = assets.skyline;
  if (skyline) {
    const h = skyline.h * HERO_PIXEL;
    const leftW = SKYLINE_BUILDINGS.left.sw * HERO_PIXEL;
    const rightW = SKYLINE_BUILDINGS.right.sw * HERO_PIXEL;
    const width = Math.max(view.width, SKYLINE_MIN_SPAN);
    const offset = distance * SKYLINE_PARALLAX;

    ctx.drawImage(
      skyline.image,
      SKYLINE_BUILDINGS.left.sx,
      0,
      SKYLINE_BUILDINGS.left.sw,
      skyline.h,
      -offset,
      GROUND_Y - h,
      leftW,
      h
    );
    ctx.drawImage(
      skyline.image,
      SKYLINE_BUILDINGS.right.sx,
      0,
      SKYLINE_BUILDINGS.right.sw,
      skyline.h,
      width - rightW - offset,
      GROUND_Y - h,
      rightW,
      h
    );
  }
}

function drawGround(ctx: CanvasRenderingContext2D, state: GameState, view: View): void {
  const bandH = WORLD_H - GROUND_Y;
  const blockW = view.width / GROUND_COLOURS.length;
  GROUND_COLOURS.forEach((colour, i) => {
    ctx.fillStyle = colour;
    ctx.fillRect(i * blockW, GROUND_Y, blockW + 1, bandH);
  });

  ctx.fillStyle = INK;
  ctx.fillRect(0, GROUND_Y, view.width, 1.5);

  const period = 47;
  const offset = state.distance % period;
  for (let x = -offset - period; x < view.width; x += period) {
    ctx.fillRect(x, GROUND_Y + 5, 8, 1.5);
    ctx.fillRect(x + 23, GROUND_Y + 11, 4, 1.5);
    ctx.fillRect(x + 35, GROUND_Y + 15, 6, 1.5);
  }
}

function drawObstacles(ctx: CanvasRenderingContext2D, state: GameState, assets: Assets): void {
  const frame = Math.floor(state.time / 150);
  for (const obstacle of state.obstacles) {
    const sprite = assets[obstacle.kind];
    for (let i = 0; i < obstacle.group; i++) {
      drawSprite(ctx, sprite, frame, {
        x: obstacle.x + i * obstacle.w,
        y: obstacle.y,
        w: obstacle.w,
        h: obstacle.h,
      });
    }
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState, assets: Assets): void {
  const { player } = state;
  const rect = playerRect(player);
  const step = Math.floor(state.distance / 20);

  let sprite = assets.studentRun;
  let frame = step;

  if (state.status === "over") {
    sprite = assets.studentCrash;
    frame = 0;
  } else if (player.jumping) {
    sprite = assets.studentJump;
    frame = 0;
  } else if (isDucking(player)) {
    sprite = assets.studentDuck;
  }

  drawSprite(ctx, sprite, frame, rect);
}

function drawScore(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  best: number,
  view: View,
  bestLabel: string
): void {
  const score = getScore(state);
  const pad = (n: number) => String(Math.min(n, 99999)).padStart(5, "0");

  ctx.fillStyle = INK;
  ctx.font = 'bold 11px "Secular One", sans-serif';
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  const right = view.width - 12;
  const top = WORLD_H - view.height + 14;

  const scoreText = pad(score);
  ctx.fillText(scoreText, right, top);
  if (best > 0) {
    const bestText = `${bestLabel} ${pad(best)}`;
    const scoreWidth = ctx.measureText(scoreText).width;
    ctx.globalAlpha = 0.6;
    ctx.fillText(bestText, right - scoreWidth - 10, top);
    ctx.globalAlpha = 1;
  }
}

export function draw(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  assets: Assets,
  view: View,
  best: number,
  bestLabel: string
): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.setTransform(view.scale, 0, 0, view.scale, 0, (view.height - WORLD_H) * view.scale);
  ctx.imageSmoothingEnabled = false;

  if (!bgCanvas) bgCanvas = document.createElement("canvas");
  if (bgCanvas.width !== ctx.canvas.width || bgCanvas.height !== ctx.canvas.height) {
    bgCanvas.width = ctx.canvas.width;
    bgCanvas.height = ctx.canvas.height;
  }
  const bgCtx = bgCanvas.getContext("2d");
  if (bgCtx) {
    bgCtx.setTransform(1, 0, 0, 1, 0, 0);
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgCtx.setTransform(ctx.getTransform());
    bgCtx.imageSmoothingEnabled = false;

    drawBackground(bgCtx, state, assets, view);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.35;
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.restore();
  }

  drawGround(ctx, state, view);
  drawObstacles(ctx, state, assets);
  drawPlayer(ctx, state, assets);
  drawScore(ctx, state, best, view, bestLabel);
}
