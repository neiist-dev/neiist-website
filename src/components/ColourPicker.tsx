"use client";
import React, { useCallback, useEffect, useState } from "react";
import styles from "@/styles/components/ColourPicker.module.css";

type hsl = { h: number; s: number; l: number };
type hexObj = { hex: string };
type Color = hsl & hexObj;

function sanitizeHex(val: string) {
  return val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}
function expandShortHex(hex: string) {
  if (hex.length === 3)
    return hex
      .split("")
      .map((c) => c + c)
      .join("");
  return hex;
}
function normalizeHexOut(raw?: string | null) {
  if (!raw) return null;
  let s = raw.replace(/^#/, "");
  s = sanitizeHex(s);
  if (!s) return null;
  if (s.length === 3) s = expandShortHex(s);
  if (s.length === 5) s = s.padEnd(6, "0");
  if (s.length < 6) return null;
  return `#${s.slice(0, 6)}`;
}

function hslToHex({ h, s, l }: hsl) {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1);
  const toHex = (x: number) => {
    const v = Math.round(255 * x);
    return v.toString(16).padStart(2, "0");
  };
  return `${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
}

function hexToHsl({ hex }: hexObj): hsl {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  while (hex.length < 6) hex += "0";
  let r = parseInt(hex.slice(0, 2), 16) / 255;
  let g = parseInt(hex.slice(2, 4), 16) / 255;
  let b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const HashtagIcon = (props: React.ComponentPropsWithoutRef<"svg">) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path
      fillRule="evenodd"
      d="M11.097 1.515a.75.75 0 0 1 .589.882L10.666 7.5h4.47l1.079-5.397a.75.75 0 1 1 1.47.294L16.665 7.5h3.585a.75.75 0 0 1 0 1.5h-3.885l-1.2 6h3.585a.75.75 0 0 1 0 1.5h-3.885l-1.08 5.397a.75.75 0 1 1-1.47-.294l1.02-5.103h-4.47l-1.08 5.397a.75.75 0 1 1-1.47-.294l1.02-5.103H3.75a.75.75 0 0 1 0-1.5h3.885l1.2-6H5.25a.75.75 0 0 1 0-1.5h3.885l1.08-5.397a.75.75 0 0 1 .882-.588ZM10.365 9l-1.2 6h4.47l1.2-6h-4.47Z"
      clipRule="evenodd"
    />
  </svg>
);

const DraggableColorCanvas = ({
  h,
  s,
  l,
  handleChange,
}: hsl & { handleChange: (_e: Partial<Color>) => void }) => {
  const [dragging, setDragging] = useState(false);
  const colorAreaRef = React.useRef<HTMLDivElement | null>(null);

  const calculate = useCallback(
    (x: number, y: number) => {
      if (!colorAreaRef.current) return;
      const rect = colorAreaRef.current.getBoundingClientRect();
      const sx = Math.max(0, Math.min(x - rect.left, rect.width));
      const sy = Math.max(0, Math.min(y - rect.top, rect.height));
      handleChange({
        s: Math.round((sx / rect.width) * 100),
        l: 100 - Math.round((sy / rect.height) * 100),
      });
    },
    [handleChange]
  );

  React.useEffect(() => {
    const move = (e: MouseEvent) => dragging && calculate(e.clientX, e.clientY);
    const up = () => setDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragging, calculate]);

  return (
    <div
      ref={colorAreaRef}
      className={styles.canvas}
      style={{
        background: `linear-gradient(to top, #000, transparent, #fff), linear-gradient(to left, hsl(${h},100%,50%), #bbb)`,
      }}
      onMouseDown={(e) => {
        setDragging(true);
        calculate(e.clientX, e.clientY);
      }}>
      <div
        className={styles.selector}
        style={{ left: `${s}%`, top: `${100 - l}%`, background: `hsl(${h}, ${s}%, ${l}%)` }}
      />
    </div>
  );
};

interface ColourPickerProps {
  value?: string;
  default_value?: string;
  onChange?: (_hexWithHash: string) => void;
}

const ColourPicker = ({ value, default_value = "#1C9488", onChange }: ColourPickerProps) => {
  const initialHex = normalizeHexOut(value ?? default_value) ?? "#1C9488";
  const hexNoHash = initialHex.replace(/^#/, "");
  const [color, setColor] = useState<Color>(() => {
    return { ...hexToHsl({ hex: hexNoHash }), hex: hexNoHash };
  });

  // sync from controlled prop only when different from internal
  useEffect(() => {
    const propNorm = normalizeHexOut(value);
    const internalNorm = normalizeHexOut(color.hex);
    if (!propNorm) return;
    if (propNorm === internalNorm) return; // avoid unneeded setState
    const hex = propNorm.replace(/^#/, "");
    setColor({ ...hexToHsl({ hex }), hex });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // notify parent only when there is a real change vs incoming prop
  useEffect(() => {
    if (!onChange) return;
    const out = normalizeHexOut(color.hex);
    const propNorm = normalizeHexOut(value);
    if (!out) return;
    if (propNorm === out) return; // don't emit if same as parent value
    onChange(out);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color.hex, onChange]);

  return (
    <div className={styles.wrapper}>
      <DraggableColorCanvas
        {...{ h: color.h, s: color.s, l: color.l }}
        handleChange={(partial) =>
          setColor((prev) => {
            const next = { ...prev, ...partial };
            const hex = hslToHex(next);
            return { ...next, hex };
          })
        }
      />
      <input
        type="range"
        min={0}
        max={360}
        value={color.h}
        className={styles.hueSlider}
        onChange={(e) =>
          setColor((prev) => {
            const base = { ...prev, h: e.target.valueAsNumber };
            return { ...base, hex: hslToHex(base) };
          })
        }
      />
      <div className={styles.hexRow}>
        <HashtagIcon className={styles.hashIcon} />
        <input
          value={color.hex}
          className={styles.hexInput}
          onChange={(e) => {
            const raw = sanitizeHex(e.target.value);
            const expanded = expandShortHex(raw);
            try {
              const newHsl = hexToHsl({ hex: expanded });
              setColor({ ...newHsl, hex: expanded });
            } catch {
              setColor((prev) => ({ ...prev, hex: expanded }));
            }
          }}
        />
        <div
          className={styles.colorPreview}
          style={{ background: `hsl(${color.h},${color.s}%,${color.l}%)` }}
        />
      </div>
    </div>
  );
};

export default ColourPicker;
