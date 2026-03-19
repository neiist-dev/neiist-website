import { CSSProperties, ElementType } from "react";

interface ColorfulTextProps {
  text: string;
  colors?: string[];
  chunk?: boolean;
  style?: CSSProperties;
  className?: string;
  as?: ElementType;
}

export default function ColorfulText({
  text,
  colors = [
    "var(--primary-colour)",
    "var(--secondary-colour)",
    "var(--tertiary-colour)",
    "var(--quaternary-colour)",
  ],
  chunk = true,
  style,
  className,
  as: Component = "h1",
}: ColorfulTextProps) {
  let parts: string[];

  if (chunk) {
    const chunkSize = Math.ceil(text.length / colors.length);
    parts = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      parts.push(text.slice(i, i + chunkSize));
    }
  } else {
    parts = text.split("");
  }

  return (
    <Component style={style} className={className}>
      {parts.map((part, i) => (
        <span key={i} className="colorful-span" style={{ color: colors[i % colors.length] }}>
          {part}
        </span>
      ))}
    </Component>
  );
}
