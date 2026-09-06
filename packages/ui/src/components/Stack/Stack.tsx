import React from "react";
import styles from "./Stack.module.css";
import { cn } from "../../utils/cn";

export interface StackProps extends React.ComponentPropsWithRef<"div"> {
  direction?: "row" | "column";
  gap?: "sm" | "md" | "lg" | "none";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
  wrap?: boolean;
}

export function Stack({
  children,
  direction = "column",
  gap = "md",
  align,
  justify,
  wrap,
  className,
  ref,
  ...props
}: StackProps) {
  return (
    <div
      ref={ref}
      className={cn(
        styles.stack,
        styles[`dir-${direction}`],
        styles[`gap-${gap}`],
        align && styles[`align-${align}`],
        justify && styles[`justify-${justify}`],
        wrap && styles.wrap,
        className
      )}
      {...props}>
      {children}
    </div>
  );
}
