"use client";

import React, { type CSSProperties, useEffect, useRef, useState } from "react";
import { FiHash } from "react-icons/fi";
import styles from "./ColourPicker.module.css";

const DEFAULT_HEX = "#1C9488";

interface HSL {
  hue: number;
  saturation: number;
  lightness: number;
}

interface Color extends HSL {
  hex: string;
}

function sanitizeHex(val: string) {
  return val.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
}

function normalizeHex(raw?: string | null): string | null {
  if (!raw) return null;
  const s = sanitizeHex(raw);
  if (s.length === 3) return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  if (s.length === 6) return `#${s}`;
  return null;
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

function hexToHsl(hex: string): HSL {
  const red = parseInt(hex.slice(0, 2), 16) / 255;
  const green = parseInt(hex.slice(2, 4), 16) / 255;
  const blue = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let hue = 0;
  let saturation = 0;
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

export interface ColourPickerProps {
  value?: string;
  default_value?: string;
  onChange?: (_hexWithHash: string) => void;
}

export const ColourPicker = ({
  value,
  default_value = DEFAULT_HEX,
  onChange,
}: ColourPickerProps) => {
  const normalizedProp = normalizeHex(value);
  const initialHex = (normalizedProp ?? normalizeHex(default_value) ?? DEFAULT_HEX).slice(1);
  const [color, setColor] = useState<Color>(() => ({ ...hexToHsl(initialHex), hex: initialHex }));
  const [hexInput, setHexInput] = useState(initialHex);
  const lastHexRef = useRef(initialHex);

  useEffect(() => {
    if (!normalizedProp) return;
    const hex = normalizedProp.slice(1);
    if (hex === lastHexRef.current) return;
    lastHexRef.current = hex;
    setColor({ ...hexToHsl(hex), hex });
    setHexInput(hex);
  }, [normalizedProp]);

  const commitColor = (next: Color) => {
    const changed = next.hex !== lastHexRef.current;
    lastHexRef.current = next.hex;
    setColor(next);
    setHexInput(next.hex);
    if (changed) onChange?.(`#${next.hex}`);
  };

  const updateHsl = (partial: Partial<HSL>) => {
    const next: HSL = {
      hue: partial.hue ?? color.hue,
      saturation: partial.saturation ?? color.saturation,
      lightness: partial.lightness ?? color.lightness,
    };
    commitColor({ ...next, hex: hslToHex(next) });
  };

  const pickFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const sx = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const sy = Math.max(0, Math.min(event.clientY - rect.top, rect.height));
    updateHsl({
      saturation: Math.round((sx / rect.width) * 100),
      lightness: 100 - Math.round((sy / rect.height) * 100),
    });
  };

  const commitHexInput = () => {
    const normalized = normalizeHex(hexInput);
    if (!normalized) {
      setHexInput(color.hex);
      return;
    }
    const hex = normalized.slice(1);
    commitColor({ ...hexToHsl(hex), hex });
  };

  return (
    <div
      className={styles.wrapper}
      style={
        {
          "--cp-hue": color.hue,
          "--cp-s": `${color.saturation}%`,
          "--cp-l": `${color.lightness}%`,
        } as CSSProperties
      }>
      <div
        className={styles.canvas}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          pickFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) pickFromPointer(event);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}>
        <div className={styles.selector} />
      </div>
      <input
        type="range"
        min={0}
        max={360}
        value={color.hue}
        aria-label="Hue"
        className={styles.hueSlider}
        onChange={(event) => updateHsl({ hue: event.target.valueAsNumber })}
      />
      <div className={styles.hexRow}>
        <FiHash className={styles.hashIcon} />
        <input
          value={hexInput}
          aria-label="Hex color"
          className={styles.hexInput}
          onChange={(event) => {
            const raw = sanitizeHex(event.target.value).slice(0, 6);
            setHexInput(raw);
            if (raw.length === 6) {
              commitColor({ ...hexToHsl(raw), hex: raw });
            }
          }}
          onBlur={commitHexInput}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitHexInput();
            }
          }}
        />
        <div className={styles.colorPreview} />
      </div>
    </div>
  );
};
