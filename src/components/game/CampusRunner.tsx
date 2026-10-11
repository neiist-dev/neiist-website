"use client";

import { useEffect, useRef, useState } from "react";
import { FiRotateCcw, FiX } from "react-icons/fi";
import { Button } from "@neiist/ui";
import styles from "@/styles/components/game/CampusRunner.module.css";
import type { Dictionary } from "@/i18n/dictionaries";
import { loadAssets, type Assets } from "@/components/game/RunnerAssets";
import {
  canRestart,
  createGame,
  createInput,
  getScore,
  resetGame,
  setWorldWidth,
  update,
} from "./RunnerEngine";
import { attachInput } from "./RunnerInput";
import { computeView, draw, type RenderContext } from "./RunnerRenderer";

const BEST_SCORE_KEY = "neiist:runner:best";
const MAX_FRAME_MS = 50;
const FIXED_DT = 1000 / 60; // Exact physics step for deterministic simulation across refresh rates

type Phase = "running" | "paused" | "over";

interface CampusRunnerProps {
  dict: Dictionary["game"];
  onExit: () => void;
}

function readBest(): number {
  try {
    return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeBest(best: number): void {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(best));
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the best score just won't persist
  }
}

export default function CampusRunner({ dict, onExit }: CampusRunnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const restartRef = useRef<() => void>(() => {});
  const onExitRef = useRef(onExit);
  const [phase, setPhase] = useState<Phase>("running");
  const [result, setResult] = useState({ score: 0, best: 0 });
  const [isTouch, setIsTouch] = useState(false);
  const [noObstacles, setNoObstacles] = useState(false);

  useEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!container || !canvas || !ctx) return;

    const coarseTouch = window.matchMedia("(pointer: coarse)").matches;
    setIsTouch(coarseTouch);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    container.focus({ preventScroll: true });

    let cancelled = false;
    let assets: Assets = {};
    const renderCtx: RenderContext = {};

    let best = readBest();
    let view = computeView(1, 1, 1, reducedMotion);
    const input = createInput();
    const state = createGame(view.width);
    let paused = false;
    let last = performance.now();
    let frame = 0;
    let accumulator = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      view = computeView(rect.width, rect.height, dpr, reducedMotion);
      setWorldWidth(state, view.width);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const restart = (withoutObstacles = false) => {
      resetGame(state, withoutObstacles);
      input.jumpQueued = false;
      paused = false;
      setNoObstacles(withoutObstacles);
      setPhase("running");
      container.focus({ preventScroll: true });
    };
    restartRef.current = restart;

    const pause = () => {
      if (paused || state.status !== "running") return;
      paused = true;
      input.jumpHeld = false;
      input.duckHeld = false;
      setPhase("paused");
    };

    const resume = () => {
      paused = false;
      last = performance.now();
      accumulator = 0;
      setPhase("running");
    };

    const detachInput = attachInput(container, input, {
      onExit: () => onExitRef.current(),
      onJumpIntent: () => {
        if (paused) {
          resume();
          return true;
        }
        if (state.status === "over") {
          if (canRestart(state)) restart();
          return true;
        }
        return false;
      },
      secretCode: {
        enabled: () => state.status === "over",
        onEnter: () => restart(true),
      },
    });

    const onVisibilityChange = () => {
      if (document.hidden) pause();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", pause);

    const loop = (now: number) => {
      const dt = Math.min(now - last, MAX_FRAME_MS);
      last = now;

      if (!paused) {
        accumulator += dt;
        while (accumulator >= FIXED_DT) {
          if (update(state, input, FIXED_DT)) {
            const score = getScore(state);
            if (score > best) {
              best = score;
              writeBest(best);
            }
            setResult({ score, best });
            setPhase("over");
            break;
          }
          accumulator -= FIXED_DT;
        }
      }

      draw(ctx, state, assets, view, best, { best: dict.best }, coarseTouch, renderCtx);
      frame = requestAnimationFrame(loop);
    };

    loadAssets().then((loaded) => {
      if (cancelled) return;
      assets = loaded;
      last = performance.now();
      accumulator = 0;
      frame = requestAnimationFrame(loop);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      detachInput();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", pause);
      if (renderCtx.bgCanvas) {
        renderCtx.bgCanvas.width = 0;
        renderCtx.bgCanvas.height = 0;
        renderCtx.bgCanvas = undefined;
      }
    };
  }, [dict.best]);

  return (
    <div ref={containerRef} className={styles.runner} tabIndex={-1}>
      <canvas ref={canvasRef} className={styles.canvas} role="img" aria-label={dict.canvas_label} />

      <div className={styles.exitSlot}>
        <Button
          variant="outline"
          color="neutral"
          size="icon"
          shape="pill"
          onClick={onExit}
          aria-label={dict.exit}
          title={dict.exit}>
          <FiX aria-hidden="true" />
        </Button>
      </div>

      {phase === "running" && (
        <p key={String(noObstacles)} className={styles.controlsHint}>
          {noObstacles ? dict.secret_mode : isTouch ? dict.controls_touch : dict.controls_desktop}
        </p>
      )}

      {phase === "paused" && (
        <div className={styles.overlay}>
          <p className={styles.overlayHint}>{dict.start_hint}</p>
        </div>
      )}

      {phase === "over" && (
        <div className={styles.overlay}>
          <p className={styles.gameOver}>{dict.game_over}</p>
          <Button variant="solid" color="primary" onClick={() => restartRef.current()}>
            <FiRotateCcw aria-hidden="true" /> {dict.restart}
          </Button>
        </div>
      )}

      <p className={styles.srOnly} aria-live="polite">
        {phase === "over"
          ? dict.final_score
              .replace("{score}", String(result.score))
              .replace("{best}", String(result.best))
          : ""}
      </p>
    </div>
  );
}
