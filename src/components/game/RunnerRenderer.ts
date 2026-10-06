import type { Assets, Sprite } from "./RunnerAssets";
import {
  FRAME_MS,
  GROUND_Y,
  MAX_SPEED,
  MIN_WORLD_W,
  SCORE_COEFFICIENT,
  START_SPEED,
  WORLD_H,
  getScore,
  playerRect,
  type GameState,
  type Rect,
} from "./RunnerEngine";

const INK = "#111111";
// Same four blocks as the ground band in hero.png
const GROUND_COLOURS = ["#2863fd", "#258be3", "#34d1f9", "#5ee8fa"];
/** World units per pixel of the art cut from hero.png (344 px of it span the world above the ground). */
const HERO_PIXEL = GROUND_Y / 344;
const BACKGROUND_ALPHA = 0.35;
/** Pixel columns of Alameda and Taguspark in campus-skyline.png. */
const SKYLINE_BUILDINGS = { left: { sx: 40, sw: 580 }, right: { sx: 770, sw: 400 } };
const SKYLINE_PARALLAX = 0.02;
/** Keeps the buildings from overlapping on small screens. */
const SKYLINE_MIN_SPAN = 420;
/** World units per pixel of the generated backdrops (scenery.png, props.png). */
const BACKDROP_PIXEL = 1.5;
const SCENERY_PARALLAX = 0.008;
/** Far scenes are fainter than the buildings so they read as far away. */
const SCENERY_ALPHA = 0.55;
const PROP_PARALLAX = 0.35;
const PROP_SPAN = 1400;
/** The scene changes every BIOME_DISTANCE (about 300 points), crossfading over BIOME_FADE. */
const BIOME_DISTANCE = 12000;
const BIOME_FADE = 900;

/** Frames in props.png. */
const PROP = {
  cactusSmall: 0,
  cactusTall: 1,
  cactusWide: 2,
  rock: 3,
  agave: 4,
  lamp: 5,
  pine: 6,
  tree: 7,
  palm: 8,
  bench: 9,
  fence: 10,
  sign: 11,
  tram: 12,
} as const;

/** One per frame of scenery.png, in order, with the props scattered along each PROP_SPAN. */
const BIOMES: { x: number; prop: number }[][] = [
  // Mountains
  [
    { x: 60, prop: PROP.cactusTall },
    { x: 420, prop: PROP.rock },
    { x: 760, prop: PROP.cactusWide },
    { x: 1080, prop: PROP.agave },
  ],
  // Pine hills
  [
    { x: 60, prop: PROP.pine },
    { x: 400, prop: PROP.fence },
    { x: 740, prop: PROP.tree },
    { x: 1060, prop: PROP.pine },
  ],
  // Lisbon
  [
    { x: 60, prop: PROP.lamp },
    { x: 380, prop: PROP.bench },
    { x: 700, prop: PROP.tram },
    { x: 1060, prop: PROP.tree },
  ],
  // 25 de Abril bridge
  [
    { x: 60, prop: PROP.palm },
    { x: 420, prop: PROP.lamp },
    { x: 760, prop: PROP.bench },
    { x: 1080, prop: PROP.palm },
  ],
];
const CLOUD_SPAN = 640;
/** Repeats every CLOUD_SPAN; negative y is extra sky on narrow screens. Varied speeds give depth. */
const CLOUDS = [
  { x: 20, y: -12, variant: 0, parallax: 0.45 },
  { x: 110, y: 22, variant: 2, parallax: 0.7 },
  { x: 190, y: -30, variant: 1, parallax: 0.35 },
  { x: 250, y: 4, variant: 1, parallax: 0.6 },
  { x: 340, y: 30, variant: 0, parallax: 0.8 },
  { x: 410, y: -22, variant: 2, parallax: 0.4 },
  { x: 470, y: -4, variant: 2, parallax: 0.75 },
  { x: 560, y: 14, variant: 0, parallax: 0.55 },
];
const RUN_FRAME_DISTANCE = 30;
const MILESTONE = 100;
const MILESTONE_FLASH_MS = 800;
/** Trail length at full speed, in frames of travel. */
const BLUR_FRAMES = 0.9;
/** Several faint, close copies read as a smear instead of a strobe. */
const BLUR_SAMPLES = 5;
const BLUR_ALPHA = 0.35;

export interface View {
  /** Device pixels per world unit. */
  scale: number;
  /** Visible world size; height can exceed WORLD_H when the container is narrow. */
  width: number;
  height: number;
  reducedMotion: boolean;
}

/** Target horizontal look-ahead: Chrome-dino-like 600 units on desktop, never under 300 on phones. */
const MAX_VISIBLE_W = 600;
const CSS_PX_PER_UNIT_MIN = 2;

/**
 * Scale by height so the playfield never stretches, but guarantee enough horizontal look-ahead
 * on narrow screens by adding extra sky instead.
 */
export function computeView(cssW: number, cssH: number, dpr: number, reducedMotion: boolean): View {
  const minVisibleW = Math.min(Math.max(cssW / CSS_PX_PER_UNIT_MIN, MIN_WORLD_W), MAX_VISIBLE_W);
  const cssScale = Math.min(cssH / WORLD_H, cssW / minVisibleW);
  return {
    scale: cssScale * dpr,
    width: cssW / cssScale,
    height: cssH / cssScale,
    reducedMotion,
  };
}

/** Zero at the starting speed, so the blur builds up as the game accelerates. */
function blurLength(state: GameState, view: View, parallax = 1): number {
  if (view.reducedMotion || state.status !== "running") return 0;
  const intensity = Math.max(0, (state.speed - START_SPEED) / (MAX_SPEED - START_SPEED));
  return state.speed * BLUR_FRAMES * intensity * parallax;
}

/** Draws faint copies trailing to the right (everything scrolls left), then the sharp one on top. */
function withMotionBlur(
  ctx: CanvasRenderingContext2D,
  length: number,
  drawAt: (_dx: number) => void
): void {
  if (length >= 0.5) {
    const baseAlpha = ctx.globalAlpha;
    for (let i = BLUR_SAMPLES; i >= 1; i--) {
      ctx.globalAlpha = baseAlpha * BLUR_ALPHA * (1 - (i - 1) / BLUR_SAMPLES);
      drawAt((length * i) / BLUR_SAMPLES);
    }
    ctx.globalAlpha = baseAlpha;
  }
  drawAt(0);
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  frame: number,
  dest: Rect
): void {
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
  ctx: CanvasRenderingContext2D,
  view: View,
  span: number,
  offset: number,
  drawAt: (_x: number) => void
): void {
  for (let x = -(offset % span) - span; x < view.width; x += span) drawAt(x);
}

/** Everything behind the ground, drawn opaque so nearer layers hide farther ones. */
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
    for (const cloud of CLOUDS) {
      withMotionBlur(ctx, blurLength(state, view, cloud.parallax), (dx) => {
        drawRepeating(ctx, view, CLOUD_SPAN, distance * cloud.parallax, (base) =>
          drawSprite(ctx, clouds, cloud.variant, { x: base + cloud.x + dx, y: cloud.y, w, h })
        );
      });
    }
  }

  // The current scene fades in over the previous one
  const leg = state.distance / BIOME_DISTANCE;
  const current = Math.floor(leg) % BIOMES.length;
  const previous = (current + BIOMES.length - 1) % BIOMES.length;
  const fade = leg < 1 ? 1 : Math.min(1, (state.distance % BIOME_DISTANCE) / BIOME_FADE);
  const biomes =
    fade < 1
      ? [
          { index: previous, alpha: 1 - fade },
          { index: current, alpha: fade },
        ]
      : [{ index: current, alpha: 1 }];

  const scenery = assets.scenery;
  if (scenery) {
    const w = scenery.frameW * BACKDROP_PIXEL;
    const h = scenery.h * BACKDROP_PIXEL;
    for (const { index, alpha } of biomes) {
      ctx.globalAlpha = SCENERY_ALPHA * alpha;
      drawRepeating(ctx, view, w, distance * SCENERY_PARALLAX, (x) =>
        drawSprite(ctx, scenery, index, { x, y: GROUND_Y - h, w, h })
      );
    }
    ctx.globalAlpha = 1;
  }

  const skyline = assets.skyline;
  if (skyline) {
    // Like the hero, Alameda starts at the left edge and Taguspark at the right; they don't repeat
    const h = skyline.h * HERO_PIXEL;
    const { left, right } = SKYLINE_BUILDINGS;
    const leftW = left.sw * HERO_PIXEL;
    const rightW = right.sw * HERO_PIXEL;
    const width = Math.max(view.width, SKYLINE_MIN_SPAN);
    const offset = distance * SKYLINE_PARALLAX;
    const drawBuilding = (part: { sx: number; sw: number }, x: number, w: number) => {
      if (x + w > 0) {
        ctx.drawImage(skyline.image, part.sx, 0, part.sw, skyline.h, x, GROUND_Y - h, w, h);
      }
    };
    drawBuilding(left, -offset, leftW);
    drawBuilding(right, width - rightW - offset, rightW);
  }

  const props = assets.props;
  if (props) {
    const w = props.frameW * BACKDROP_PIXEL;
    const h = props.h * BACKDROP_PIXEL;
    for (const { index, alpha } of biomes) {
      ctx.globalAlpha = alpha;
      withMotionBlur(ctx, blurLength(state, view, PROP_PARALLAX), (dx) => {
        drawRepeating(ctx, view, PROP_SPAN, distance * PROP_PARALLAX, (base) => {
          for (const { x, prop } of BIOMES[index]) {
            drawSprite(ctx, props, prop, { x: base + x + dx, y: GROUND_Y - h, w, h });
          }
        });
      });
    }
    ctx.globalAlpha = 1;
  }
}

let backgroundLayer: HTMLCanvasElement | null = null;

/** Renders the background off-screen, then fades it in one go so overlapping layers don't show through. */
function drawFadedBackground(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  assets: Assets,
  view: View
): void {
  backgroundLayer ??= document.createElement("canvas");
  const layer = backgroundLayer;
  if (layer.width !== ctx.canvas.width || layer.height !== ctx.canvas.height) {
    layer.width = ctx.canvas.width;
    layer.height = ctx.canvas.height;
  }
  const layerCtx = layer.getContext("2d");
  if (!layerCtx) return;

  layerCtx.setTransform(1, 0, 0, 1, 0, 0);
  layerCtx.clearRect(0, 0, layer.width, layer.height);
  layerCtx.setTransform(ctx.getTransform());
  layerCtx.imageSmoothingEnabled = false;
  drawBackground(layerCtx, state, assets, view);

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = BACKGROUND_ALPHA;
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
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

  // Scrolling dashes at full game speed so obstacles feel planted on the ground
  const period = 47;
  const offset = state.distance % period;
  withMotionBlur(ctx, blurLength(state, view), (dx) => {
    for (let x = -offset - period + dx; x < view.width; x += period) {
      ctx.fillRect(x, GROUND_Y + 5, 8, 1.5);
      ctx.fillRect(x + 23, GROUND_Y + 11, 4, 1.5);
      ctx.fillRect(x + 35, GROUND_Y + 15, 6, 1.5);
    }
  });
}

function drawObstacles(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  assets: Assets,
  view: View
): void {
  const blur = blurLength(state, view);
  for (const obstacle of state.obstacles) {
    const sprite = assets[obstacle.kind];
    const frame = Math.floor(state.time / 150);
    const trail = blur * ((state.speed + obstacle.speedOffset) / state.speed);
    withMotionBlur(ctx, trail, (dx) => {
      for (let i = 0; i < obstacle.group; i++) {
        const dest = {
          x: obstacle.x + i * obstacle.w + dx,
          y: obstacle.y,
          w: obstacle.w,
          h: obstacle.h,
        };
        if (sprite) {
          drawSprite(ctx, sprite, frame, dest);
        } else {
          ctx.fillStyle = INK;
          ctx.fillRect(dest.x, dest.y, dest.w, dest.h);
        }
      }
    });
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState, assets: Assets): void {
  const { player } = state;
  const rect = playerRect(player);
  const ducking = player.ducking && !player.jumping;
  // Animation speed follows the run speed, like the original
  const step = Math.floor(state.distance / RUN_FRAME_DISTANCE);

  let sprite = assets.studentRun;
  let frame = step;
  if (state.status === "over") {
    sprite = assets.studentCrash;
    frame = 0;
  } else if (player.jumping) {
    sprite = assets.studentJump;
    frame = 0;
  } else if (ducking) {
    sprite = assets.studentDuck;
  }

  if (sprite) {
    drawSprite(ctx, sprite, frame, rect);
  } else {
    ctx.fillStyle = INK;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
}

function drawScore(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  best: number,
  view: View,
  labels: { best: string }
): void {
  const score = getScore(state);
  const pad = (n: number) => String(Math.min(n, 99999)).padStart(5, "0");

  // Blink the score briefly after every milestone, like the original
  const milestoneDistance = (score - (score % MILESTONE)) / SCORE_COEFFICIENT;
  const msSinceMilestone = ((state.distance - milestoneDistance) / state.speed) * FRAME_MS;
  const flashing =
    score >= MILESTONE && state.status === "running" && msSinceMilestone < MILESTONE_FLASH_MS;
  const hidden = flashing && Math.floor(state.time / 120) % 2 === 0;

  ctx.fillStyle = INK;
  ctx.font = "bold 8px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  const right = view.width - 8;
  // Top of the visible area (world y can be negative when there is extra sky)
  const top = WORLD_H - view.height + 8;
  if (!hidden) ctx.fillText(pad(score), right, top);
  if (best > 0) {
    ctx.globalAlpha = 0.6;
    ctx.fillText(`${labels.best} ${pad(best)}`, right - 34, top);
    ctx.globalAlpha = 1;
  }
}

export function draw(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  assets: Assets,
  view: View,
  best: number,
  labels: { best: string }
): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // World coordinates: shift down so the ground sits at the bottom when there is extra sky
  ctx.setTransform(view.scale, 0, 0, view.scale, 0, (view.height - WORLD_H) * view.scale);
  ctx.imageSmoothingEnabled = false;

  drawFadedBackground(ctx, state, assets, view);
  drawGround(ctx, state, view);
  drawObstacles(ctx, state, assets, view);
  drawPlayer(ctx, state, assets);
  drawScore(ctx, state, best, view, labels);
}
