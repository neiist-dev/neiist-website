"use client";

import { useEffect, useRef } from "react";

export interface KeyboardShortcutOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  target?: EventTarget | null;
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform);

/**
 * Hook to listen for keyboard shortcuts in an SSR-safe way.
 */
export function useKeyboardShortcut(
  shortcut: string,
  callback: (_event: KeyboardEvent) => void,
  { enabled = true, preventDefault = true, target }: KeyboardShortcutOptions = {}
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !shortcut) return;

    const parts = shortcut
      .toLowerCase()
      .split("+")
      .map((s) => s.trim());
    const targetKey = parts.pop() ?? "";
    const needMod = parts.some(
      (part) => part === "mod" || part === "cmd" || part === "ctrl" || part === "⌘"
    );
    const needAlt = parts.some((part) => part === "alt" || part === "option" || part === "⌥");
    const needShift = parts.some((part) => part === "shift" || part === "⇧");

    const controller = new AbortController();
    const eventTarget = target ?? window;

    eventTarget.addEventListener(
      "keydown",
      (event: Event) => {
        const e = event as KeyboardEvent;
        const targetEl = e.target as HTMLElement | null;

        const isTyping = Boolean(
          targetEl?.isContentEditable || targetEl?.closest("input, textarea, select")
        );
        if (isTyping && !needMod && !needAlt) return;

        const modPressed = isMac ? e.metaKey : e.ctrlKey;
        if (needMod !== modPressed || needAlt !== e.altKey || needShift !== e.shiftKey) return;

        const key = e.key.toLowerCase();
        const matches =
          key === targetKey ||
          (targetKey === "esc" && key === "escape") ||
          ((targetKey === "⌫" || targetKey === "backspace") && key === "backspace");

        if (matches) {
          if (preventDefault) e.preventDefault();
          callbackRef.current(e);
        }
      },
      { signal: controller.signal }
    );

    return () => controller.abort();
  }, [shortcut, enabled, preventDefault, target]);
}
