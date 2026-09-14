import React, { ElementType } from "react";

export interface ColorfulTextProps extends React.ComponentPropsWithRef<"span"> {
  text: string;
  colors?: string[];
  chunk?: boolean;
  as?: ElementType;
}

interface TextSegment {
  id: string;
  text: string;
  color: string;
}

const getGraphemes = (str: string): string[] => {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(segmenter.segment(str), (s) => s.segment);
  }
  return [...str];
};

export function ColorfulText({
  text,
  colors = [
    "var(--ui-primary)",
    "var(--ui-secondary)",
    "var(--ui-tertiary)",
    "var(--ui-quaternary)",
  ],
  chunk = true,
  as: Component = "h1",
  className,
  style,
  ref,
  ...props
}: ColorfulTextProps) {
  const chars = getGraphemes(text);
  const segments: TextSegment[] = [];

  if (chunk) {
    const chunkSize = Math.ceil(chars.length / colors.length);
    let colorIdx = 0;
    for (let charIndex = 0; charIndex < chars.length; charIndex += chunkSize) {
      const segText = chars.slice(charIndex, charIndex + chunkSize).join("");
      segments.push({
        id: `chunk-${charIndex}-${segText}`,
        text: segText,
        color: colors[colorIdx % colors.length],
      });
      colorIdx++;
    }
  } else {
    chars.forEach((char, charIndex) => {
      segments.push({
        id: `char-${charIndex}-${char}`,
        text: char,
        color: colors[charIndex % colors.length],
      });
    });
  }

  return (
    <Component ref={ref} className={className} style={style} {...props}>
      {segments.map((segment) => (
        <span key={segment.id} style={{ color: segment.color }}>
          {segment.text}
        </span>
      ))}
    </Component>
  );
}
