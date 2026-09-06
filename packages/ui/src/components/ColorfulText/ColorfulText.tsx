import React, { ElementType } from "react";

export interface ColorfulTextProps extends React.ComponentPropsWithRef<"span"> {
  text: string;
  colors?: string[];
  chunk?: boolean;
  as?: ElementType;
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
  let parts: string[];

  if (chunk) {
    const chars = getGraphemes(text);
    const chunkSize = Math.ceil(chars.length / colors.length);
    parts = [];
    for (let charIndex = 0; charIndex < chars.length; charIndex += chunkSize) {
      parts.push(chars.slice(charIndex, charIndex + chunkSize).join(""));
    }
  } else {
    parts = getGraphemes(text);
  }

  return (
    <Component ref={ref} className={className} style={style} {...props}>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`} style={{ color: colors[index % colors.length] }}>
          {part}
        </span>
      ))}
    </Component>
  );
}
