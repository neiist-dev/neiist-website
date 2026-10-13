import type { InputState } from "@/components/game/RunnerEngine";

const JUMP_KEYS = new Set([" ", "Spacebar", "ArrowUp", "w", "W"]);
const DUCK_KEYS = new Set(["ArrowDown", "s", "S"]);
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

  const triggerJump = () => {
    if (handlers.onJumpIntent?.()) return;
    input.jumpQueued = true;
    input.jumpHeld = true;
  };

  const endJump = () => {
    input.jumpHeld = false;
  };

  // Keyboard handlers
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handlers.onExit();
      return;
    }

    if (event.target instanceof HTMLButtonElement && (event.key === " " || event.key === "Enter"))
      return;

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
      if (!event.repeat) triggerJump();
    } else if (DUCK_KEYS.has(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      input.duckHeld = true;
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if (JUMP_KEYS.has(event.key)) {
      endJump();
    } else if (DUCK_KEYS.has(event.key)) {
      input.duckHeld = false;
    }
  };

  const onTouchStart = (event: TouchEvent) => {
    if (
      event.target instanceof Element &&
      (event.target.closest("button") || event.target.closest("a"))
    ) {
      return;
    }
    event.preventDefault();
    triggerJump();
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (
      event.target instanceof Element &&
      (event.target.closest("button") || event.target.closest("a"))
    ) {
      return;
    }
    event.preventDefault();
    endJump();
  };

  const onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0) return;
    if (
      event.target instanceof Element &&
      (event.target.closest("button") || event.target.closest("a"))
    ) {
      return;
    }
    triggerJump();
  };

  const onMouseUp = () => {
    endJump();
  };

  const onBlur = () => {
    input.jumpHeld = false;
    input.duckHeld = false;
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);

  surface.addEventListener("touchstart", onTouchStart, { passive: false });
  surface.addEventListener("touchend", onTouchEnd, { passive: false });
  surface.addEventListener("touchcancel", onTouchEnd, { passive: false });
  surface.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
    surface.removeEventListener("touchstart", onTouchStart);
    surface.removeEventListener("touchend", onTouchEnd);
    surface.removeEventListener("touchcancel", onTouchEnd);
    surface.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mouseup", onMouseUp);
  };
}
