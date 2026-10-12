"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";
import styles from "./TimePicker.module.css";

const ITEM_ANGLE = 24;
const RADIUS = 86;
const ROW_PX = 38;
const OFFSETS = [-3, -2, -1, 0, 1, 2, 3];
const mod = (n: number, m: number) => ((n % m) + m) % m;

function rotationFor(idx: number, from: number, n: number, loop: boolean) {
  const slot = Math.round(from / ITEM_ANGLE);
  let diff = idx - mod(slot, n);
  if (loop) diff = mod(diff + n / 2, n) - n / 2;
  return (slot + diff) * ITEM_ANGLE;
}

interface DrumWheelProps {
  label: string;
  items: string[];
  value: string;
  onChange: (_item: string) => void;
  loop?: boolean;
}

export function DrumWheel({ label, items, value, onChange, loop = true }: DrumWheelProps) {
  const n = items.length;
  const index = Math.max(0, items.indexOf(value));
  const [rotation, setRotation] = useState(index * ITEM_ANGLE);
  const rot = useRef(rotation);
  const raf = useRef<number | null>(null);
  const reported = useRef(value);
  const drag = useRef({
    active: false,
    moved: false,
    y: 0,
    rot: 0,
    lastY: 0,
    lastT: 0,
    v: 0,
  });
  const wheelRef = useRef<HTMLDivElement>(null);

  const clamp = useCallback(
    (r: number) => (loop ? r : Math.max(0, Math.min((n - 1) * ITEM_ANGLE, r))),
    [loop, n]
  );
  const wrap = (i: number) => (loop ? mod(i, n) : Math.max(0, Math.min(n - 1, i)));

  const turn = useCallback((r: number) => {
    rot.current = r;
    setRotation(r);
  }, []);

  const cancel = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  const animateTo = useCallback(
    (target: number, ms = 200) => {
      cancel();
      const from = rot.current;
      const t0 = performance.now();
      const frame = (now: number) => {
        const p = Math.min(1, (now - t0) / ms);
        turn(p < 1 ? from + (target - from) * (1 - (1 - p) ** 3) : target);
        raf.current = p < 1 ? requestAnimationFrame(frame) : null;
      };
      raf.current = requestAnimationFrame(frame);
    },
    [cancel, turn]
  );

  const snapTo = useCallback(
    (target: number, ms: number) => {
      const item = items[mod(Math.round(target / ITEM_ANGLE), n)];
      reported.current = item;
      onChange(item);
      animateTo(target, ms);
    },
    [animateTo, items, n, onChange]
  );

  useEffect(() => {
    if (value === reported.current) return;
    reported.current = value;
    const i = items.indexOf(value);
    if (i !== -1) animateTo(rotationFor(i, rot.current, items.length, loop), 200);
  }, [value, items, loop, animateTo]);

  useEffect(() => cancel, [cancel]);

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      snapTo(clamp((Math.round(rot.current / ITEM_ANGLE) + Math.sign(e.deltaY)) * ITEM_ANGLE), 160);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [clamp, snapTo]);

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    cancel();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const t = performance.now();
    drag.current = {
      active: true,
      moved: false,
      y: e.clientY,
      rot: rot.current,
      lastY: e.clientY,
      lastT: t,
      v: 0,
    };
  };

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const dy = e.clientY - d.y;
    if (Math.abs(dy) > 3) d.moved = true;
    turn(clamp(d.rot - (dy / ROW_PX) * ITEM_ANGLE));
    const now = performance.now();
    if (now - d.lastT > 8) {
      d.v = -((e.clientY - d.lastY) / (now - d.lastT));
      d.lastY = e.clientY;
      d.lastT = now;
    }
  };

  const up = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    const v = performance.now() - d.lastT > 60 ? 0 : Math.max(-1.5, Math.min(1.5, d.v));
    const target = clamp(Math.round((rot.current + v * 90) / ITEM_ANGLE) * ITEM_ANGLE);
    snapTo(target, Math.min(380, Math.max(180, Math.abs(v) * 160)));
  };

  const keyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const page = Math.min(5, Math.floor(n / 2));
    const targets: Record<string, number> = {
      ArrowUp: index + 1,
      ArrowDown: index - 1,
      PageUp: index + page,
      PageDown: index - page,
      Home: 0,
      End: n - 1,
    };
    if (!(e.key in targets)) return;
    e.preventDefault();
    const next = wrap(targets[e.key]);
    if (next !== index) snapTo(rotationFor(next, rot.current, n, loop), 180);
  };

  const center = Math.round(rotation / ITEM_ANGLE);

  return (
    <div
      ref={wheelRef}
      className={styles.wheelColumn}
      tabIndex={0}
      role="spinbutton"
      aria-label={label}
      aria-valuenow={index}
      aria-valuemin={0}
      aria-valuemax={n - 1}
      aria-valuetext={value}
      onKeyDown={keyDown}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}>
      <div className={styles.drumStage}>
        {OFFSETS.map((off) => {
          const slot = center + off;
          const rotX = rotation - slot * ITEM_ANGLE;
          if ((!loop && (slot < 0 || slot >= n)) || Math.abs(rotX) > 85) return null;
          return (
            <div
              key={slot}
              className={cn(
                styles.drumItem,
                Math.abs(rotX) < ITEM_ANGLE / 2 && styles.drumItemActive
              )}
              style={{
                transform: `rotateX(${rotX}deg) translateZ(${RADIUS}px)`,
                opacity: Math.max(0.08, Math.cos((rotX * Math.PI) / 180) ** 2.2),
              }}
              onClick={() => {
                if (!drag.current.moved) snapTo(clamp(slot * ITEM_ANGLE), 200);
              }}>
              {items[mod(slot, n)]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
