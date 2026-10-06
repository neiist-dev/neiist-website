import type { InputState } from "./RunnerEngine";

const JUMP_KEYS = new Set([" ", "Spacebar", "ArrowUp", "w", "W"]);
const DUCK_KEYS = new Set(["ArrowDown", "s", "S"]);
const SWIPE_THRESHOLD = 30;
const TAP_HOLD_MS = 200;
/** ← → ← → ↑ ↓ ↑ ↓ B A Start, typed on the game-over screen. */
const SECRET_CODE = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "ArrowUp",
  "ArrowDown",
  "b",
  "a",
  "Enter",
];

interface InputHandlers {
  onExit: () => void;
  onJumpIntent?: () => boolean;
  secretCode?: { enabled: () => boolean; onEnter: () => void };
}

export function attachInput(
  surface: HTMLElement,
  input: InputState,
  handlers: InputHandlers
): () => void {
  let tapHoldTimer: ReturnType<typeof setTimeout> | undefined;
  let pointerStartY: number | null = null;
  let codeProgress = 0;

  const trackSecretCode = (event: KeyboardEvent): boolean => {
    if (!handlers.secretCode?.enabled()) {
      codeProgress = 0;
      return false;
    }
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key !== SECRET_CODE[codeProgress]) {
      codeProgress = key === SECRET_CODE[0] ? 1 : 0;
      return codeProgress === 1;
    }
    codeProgress++;
    if (codeProgress === SECRET_CODE.length) {
      codeProgress = 0;
      handlers.secretCode.onEnter();
    }
    return true;
  };

  const queueJump = () => {
    if (handlers.onJumpIntent?.()) return;
    input.jumpQueued = true;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handlers.onExit();
      return;
    }
    if (event.target instanceof HTMLButtonElement && (event.key === " " || event.key === "Enter")) {
      return;
    }
    if (
      event.target instanceof HTMLElement &&
      (event.target.isContentEditable || event.target.matches("input, textarea, select"))
    ) {
      return;
    }
    if (trackSecretCode(event)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (JUMP_KEYS.has(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) queueJump();
      input.jumpHeld = true;
    } else if (DUCK_KEYS.has(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      input.duckHeld = true;
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if (JUMP_KEYS.has(event.key)) input.jumpHeld = false;
    else if (DUCK_KEYS.has(event.key)) input.duckHeld = false;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest("button")) return;
    pointerStartY = event.clientY;
    surface.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (pointerStartY === null) return;
    input.duckHeld = event.clientY - pointerStartY > SWIPE_THRESHOLD;
  };

  const onPointerUp = () => {
    if (pointerStartY === null) return;
    const wasDucking = input.duckHeld;
    pointerStartY = null;
    input.duckHeld = false;
    if (wasDucking) return;

    queueJump();
    input.jumpHeld = true;
    clearTimeout(tapHoldTimer);
    tapHoldTimer = setTimeout(() => {
      input.jumpHeld = false;
    }, TAP_HOLD_MS);
  };

  const onPointerCancel = () => {
    pointerStartY = null;
    input.duckHeld = false;
  };

  const onBlur = () => {
    input.jumpHeld = false;
    input.duckHeld = false;
  };

  window.addEventListener("keydown", onKeyDown, { capture: true });
  window.addEventListener("keyup", onKeyUp, { capture: true });
  window.addEventListener("blur", onBlur);
  surface.addEventListener("pointerdown", onPointerDown);
  surface.addEventListener("pointermove", onPointerMove);
  surface.addEventListener("pointerup", onPointerUp);
  surface.addEventListener("pointercancel", onPointerCancel);

  return () => {
    clearTimeout(tapHoldTimer);
    window.removeEventListener("keydown", onKeyDown, { capture: true });
    window.removeEventListener("keyup", onKeyUp, { capture: true });
    window.removeEventListener("blur", onBlur);
    surface.removeEventListener("pointerdown", onPointerDown);
    surface.removeEventListener("pointermove", onPointerMove);
    surface.removeEventListener("pointerup", onPointerUp);
    surface.removeEventListener("pointercancel", onPointerCancel);
  };
}
