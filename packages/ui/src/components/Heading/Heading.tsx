import React from "react";
import styles from "./Heading.module.css";
import { cn } from "../../utils/cn";

export interface HeadingProps extends React.ComponentPropsWithRef<"h1"> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function Heading({ level = 2, children, className, ref, ...props }: HeadingProps) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  return React.createElement(
    Tag,
    {
      ref,
      className: cn(styles.heading, styles[`h${level}`], className),
      ...props,
    },
    children
  );
}
