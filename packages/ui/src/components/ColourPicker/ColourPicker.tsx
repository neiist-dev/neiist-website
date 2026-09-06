"use client";
import React, { useCallback, useEffect, useState } from "react";
import styles from "./ColourPicker.module.css";
import { FiHash } from "react-icons/fi";

export interface HSL {
  hue: number;
  saturation: number;
  lightness: number;
}
export interface HexObj {
  hex: string;
}
export type Color = HSL & HexObj;

export interface ColorChangeHandler {
  (_updates: Partial<Color>): void;
}

export interface CanvasProps extends HSL {
  handleChange: ColorChangeHandler;
}

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

function hslToHex({ hue, saturation, lightness }: HSL) {
  saturation /= 100;
  lightness /= 100;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = saturation * Math.min(lightness, 1 - lightness);
  const f = (n: number) => lightness - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1);
  const toHex = (x: number) => {
    const v = Math.round(255 * x);
    return v.toString(16).padStart(2, "0");
  };
  return `${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
}

function hexToHsl({ hex }: HexObj): HSL {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  while (hex.length < 6) hex += "0";
  const red = parseInt(hex.slice(0, 2), 16) / 255;
  const green = parseInt(hex.slice(2, 4), 16) / 255;
  const blue = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(red, green, blue),
    min = Math.min(red, green, blue);
  let hue = 0,
    saturation = 0;
  const lightness = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    saturation = lightness > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === red) hue = (green - blue) / d + (green < blue ? 6 : 0);
    else if (max === green) hue = (blue - red) / d + 2;
    else hue = (red - green) / d + 4;
    hue *= 60;
  }

  return {
    hue: Math.round(hue),
    saturation: Math.round(saturation * 100),
    lightness: Math.round(lightness * 100),
  };
}

const DraggableColorCanvas = ({ hue, saturation, lightness, handleChange }: CanvasProps) => {
  const [dragging, setDragging] = useState(false);
  const colorAreaRef = React.useRef<HTMLDivElement | null>(null);

  const calculate = useCallback(
    (x: number, y: number) => {
      if (!colorAreaRef.current) return;
      const rect = colorAreaRef.current.getBoundingClientRect();
      const sx = Math.max(0, Math.min(x - rect.left, rect.width));
      const sy = Math.max(0, Math.min(y - rect.top, rect.height));
      handleChange({
        saturation: Math.round((sx / rect.width) * 100),
        lightness: 100 - Math.round((sy / rect.height) * 100),
      });
    },
    [handleChange]
  );

  React.useEffect(() => {
    const move = (event: MouseEvent) => dragging && calculate(event.clientX, event.clientY);
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
        background: `linear-gradient(to top, #000, transparent, #fff), linear-gradient(to left, hsl(${hue},100%,50%), #bbb)`,
      }}
      onMouseDown={(event) => {
        setDragging(true);
        calculate(event.clientX, event.clientY);
      }}>
      <div
        className={styles.selector}
        style={{
          left: `${saturation}%`,
          top: `${100 - lightness}%`,
          background: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        }}
      />
    </div>
  );
};

export interface ColourPickerProps {
  value?: string;
  default_value?: string;
  onChange?: (_hexWithHash: string) => void;
}

export const ColourPicker = ({ value, default_value = "#1C9488", onChange }: ColourPickerProps) => {
  const initialHex = normalizeHexOut(value ?? default_value) ?? "#1C9488";
  const hexNoHash = initialHex.replace(/^#/, "");
  const [color, setColor] = useState<Color>(() => {
    return { ...hexToHsl({ hex: hexNoHash }), hex: hexNoHash };
  });

  useEffect(() => {
    const propNorm = normalizeHexOut(value);
    const internalNorm = normalizeHexOut(color.hex);
    if (!propNorm) return;
    if (propNorm === internalNorm) return;
    const hex = propNorm.replace(/^#/, "");
    setColor({ ...hexToHsl({ hex }), hex });
  }, [value, color.hex]);

  useEffect(() => {
    if (!onChange) return;
    const out = normalizeHexOut(color.hex);
    const propNorm = normalizeHexOut(value);
    if (!out) return;
    if (propNorm === out) return;
    onChange(out);
  }, [color.hex, onChange, value]);

  return (
    <div className={styles.wrapper}>
      <DraggableColorCanvas
        {...{ hue: color.hue, saturation: color.saturation, lightness: color.lightness }}
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
        value={color.hue}
        aria-label="Hue"
        className={styles.hueSlider}
        onChange={(event) =>
          setColor((prev) => {
            const base = { ...prev, hue: event.target.valueAsNumber };
            return { ...base, hex: hslToHex(base) };
          })
        }
      />
      <div className={styles.hexRow}>
        <FiHash className={styles.hashIcon} />
        <input
          value={color.hex}
          aria-label="Hex color"
          className={styles.hexInput}
          onChange={(event) => {
            const raw = sanitizeHex(event.target.value);
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
          style={{ background: `hsl(${color.hue},${color.saturation}%,${color.lightness}%)` }}
        />
      </div>
    </div>
  );
};
