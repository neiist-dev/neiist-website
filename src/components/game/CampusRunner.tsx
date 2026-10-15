"use client";

import { useEffect, useRef, useState } from "react";
import { FiPlay, FiRotateCcw, FiX } from "react-icons/fi";
import { Button, Heading } from "@neiist/ui";
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
import { computeView, draw } from "./RunnerRenderer";
import { getBestScoreAction, startGameAction, submitScoreAction } from "@/actions/gameScore";
import { useUser } from "@/context/UserContext";

const MAX_FRAME_MS = 50;
let sessionBest = 0;

type Phase = "running" | "paused" | "over";

interface CampusRunnerProps {
  dict: Dictionary["game"];
  onExit: () => void;
}

export default function CampusRunner({ dict, onExit }: CampusRunnerProps) {
  const { user } = useUser();
  const userRef = useRef(user);
  const bestRef = useRef(sessionBest);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const restartRef = useRef<() => void>(() => {});
  const resumeRef = useRef<() => void>(() => {});
  const onExitRef = useRef(onExit);
  const [phase, setPhase] = useState<Phase>("running");
  const [result, setResult] = useState({ score: 0, best: 0 });
  const [isTouch, setIsTouch] = useState(false);
  const [noObstacles, setNoObstacles] = useState(false);

  useEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!user) return;

    getBestScoreAction()
      .then((stored) => {
        if (stored) {
          bestRef.current = Math.max(bestRef.current, stored);
          sessionBest = Math.max(sessionBest, stored);
        }
      })
      .catch(() => {});
    startGameAction().catch(() => {});
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- intentional: depend on user istid
  }, [user?.istid]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    window.scrollTo({ top: 0, behavior: "instant" });

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvasArea = canvasAreaRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!container || !canvasArea || !canvas || !ctx) return;

    const coarseTouch = window.matchMedia("(pointer: coarse)").matches;
    setIsTouch(coarseTouch);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    container.focus({ preventScroll: true });

    let cancelled = false;
    let assets: Assets = {};

    let view = computeView(1, 1, 1, reducedMotion);
    const input = createInput();
    const state = createGame(view.width, Math.random, coarseTouch);
    let paused = false;
    let last = performance.now();
    let frame = 0;

    const resize = () => {
      const rect = canvasArea.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      view = computeView(rect.width, rect.height, dpr, reducedMotion);
      setWorldWidth(state, view.width);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvasArea);

    const restart = (withoutObstacles = false) => {
      resetGame(state, withoutObstacles);
      input.jumpQueued = false;
      paused = false;
      setNoObstacles(withoutObstacles);
      setPhase("running");
      if (userRef.current) startGameAction().catch(() => {});
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
      setPhase("running");
    };
    resumeRef.current = resume;

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

      if (!paused && dt > 0) {
        if (update(state, input, dt)) {
          const score = getScore(state);
          if (score > bestRef.current) {
            bestRef.current = score;
            sessionBest = score;
            if (userRef.current) submitScoreAction(score).catch(() => {});
          }
          setResult({ score, best: bestRef.current });
          setPhase("over");
        }
      }

      draw(ctx, state, assets, view, bestRef.current, dict.best);
      frame = requestAnimationFrame(loop);
    };

    loadAssets()
      .catch(() => ({}) as Assets)
      .then((loaded) => {
        if (cancelled) return;
        assets = loaded;
        last = performance.now();
        frame = requestAnimationFrame(loop);
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      detachInput();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", pause);
    };
  }, [dict.best]);

  const overlayBtnSize = isTouch ? "sm" : "md";

  return (
    <div ref={containerRef} className={styles.runner} tabIndex={-1}>
      <div className={styles.exitSlot}>
        <Button
          variant="outline"
          color="neutral"
          size="sm"
          shape="pill"
          onClick={onExit}
          aria-label={dict.exit}>
          <FiX aria-hidden="true" /> {dict.exit}
        </Button>
      </div>

      {phase === "running" && (
        <div className={styles.hintSlot}>
          <p className={styles.controlsHint}>
            {noObstacles ? dict.secret_mode : isTouch ? dict.controls_touch : dict.controls_desktop}
          </p>
        </div>
      )}

      <div ref={canvasAreaRef} className={styles.canvasArea}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          role="img"
          aria-label={dict.canvas_label}
        />

        {phase === "paused" && (
          <div className={styles.overlay}>
            <Button
              variant="solid"
              color="primary"
              size={overlayBtnSize}
              shape="pill"
              onClick={() => resumeRef.current()}>
              <FiPlay aria-hidden="true" /> {isTouch ? dict.start_hint_touch : dict.start_hint}
            </Button>
          </div>
        )}

        {phase === "over" && (
          <div className={styles.overlay}>
            <Heading level={2} className={styles.gameOver}>
              {dict.game_over}
            </Heading>
            <Button
              variant="solid"
              color="primary"
              size={overlayBtnSize}
              shape="pill"
              onClick={() => restartRef.current()}
              aria-label={dict.restart}>
              <FiRotateCcw aria-hidden="true" /> {dict.restart}
            </Button>
          </div>
        )}
      </div>

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
