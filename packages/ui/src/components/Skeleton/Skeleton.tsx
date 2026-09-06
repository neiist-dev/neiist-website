import React from "react";
import styles from "./Skeleton.module.css";
import { cn } from "../../utils/cn";

export interface SkeletonProps extends React.ComponentPropsWithRef<"div"> {
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export function Skeleton({
  variant = "rounded",
  width,
  height,
  animation = "pulse",
  className,
  style,
  ref,
  ...props
}: SkeletonProps) {
  const inlineStyle: React.CSSProperties = {
    ...style,
    width: width !== undefined ? width : style?.width,
    height: height !== undefined ? height : style?.height,
  };

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        styles.skeleton,
        styles[`variant-${variant}`],
        styles[`animation-${animation}`],
        className
      )}
      style={inlineStyle}
      {...props}
    />
  );
}
