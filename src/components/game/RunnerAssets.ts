// Sprites are PNG strips (frames side by side). When changing art, keep the pixel size or update
// the matching OBSTACLES entry in RunnerEngine.ts. Missing images render as filled blocks.

import books from "@/assets/game/books.png";
import brokenPc from "@/assets/game/broken-pc.png";
import bug from "@/assets/game/bug.png";
import campusSkyline from "@/assets/game/campus-skyline.png";
import clouds from "@/assets/game/clouds.png";
import coffee from "@/assets/game/coffee.png";
import floppy from "@/assets/game/floppy.png";
import props from "@/assets/game/props.png";
import scenery from "@/assets/game/scenery.png";
import rubberDuck from "@/assets/game/rubber-duck.png";
import serverRack from "@/assets/game/server-rack.png";
import studentCrash from "@/assets/game/student-crash.png";
import studentDuck from "@/assets/game/student-duck.png";
import studentJump from "@/assets/game/student-jump.png";
import studentRun from "@/assets/game/student-run.png";
import type { ObstacleKind } from "./RunnerEngine";

interface SpriteDef {
  src: string;
  frames: number;
}

export type SpriteName =
  | "skyline"
  | "clouds"
  | "scenery"
  | "props"
  | "studentRun"
  | "studentJump"
  | "studentDuck"
  | "studentCrash"
  | ObstacleKind;

export interface Sprite {
  image: CanvasImageSource;
  frameW: number;
  h: number;
  frames: number;
}

export type Assets = Partial<Record<SpriteName, Sprite>>;

const MANIFEST: Record<SpriteName, SpriteDef> = {
  skyline: { src: campusSkyline.src, frames: 1 },
  clouds: { src: clouds.src, frames: 3 },
  scenery: { src: scenery.src, frames: 4 },
  props: { src: props.src, frames: 13 },
  studentRun: { src: studentRun.src, frames: 4 },
  studentJump: { src: studentJump.src, frames: 1 },
  studentDuck: { src: studentDuck.src, frames: 2 },
  studentCrash: { src: studentCrash.src, frames: 1 },
  brokenPc: { src: brokenPc.src, frames: 1 },
  serverRack: { src: serverRack.src, frames: 1 },
  coffee: { src: coffee.src, frames: 1 },
  rubberDuck: { src: rubberDuck.src, frames: 1 },
  books: { src: books.src, frames: 1 },
  bug: { src: bug.src, frames: 2 },
  floppy: { src: floppy.src, frames: 2 },
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

export async function loadAssets(): Promise<Assets> {
  const entries = await Promise.all(
    (Object.entries(MANIFEST) as [SpriteName, SpriteDef][]).map(async ([name, def]) => {
      const image = await loadImage(def.src);
      if (!image) return null;
      const sprite: Sprite = {
        image,
        frameW: image.naturalWidth / def.frames,
        h: image.naturalHeight,
        frames: def.frames,
      };
      return [name, sprite] as const;
    })
  );

  return Object.fromEntries(entries.filter((entry) => entry !== null));
}
