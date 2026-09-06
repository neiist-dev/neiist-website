import React from "react";
import styles from "./Avatar.module.css";
import { cn } from "../../utils/cn";

export interface AvatarProps extends React.ComponentPropsWithRef<"div"> {
  size?: "sm" | "md" | "lg";
  fallback: string;
  image?: React.ReactNode;
}

export function Avatar({ image, fallback, size = "md", className, ref, ...props }: AvatarProps) {
  return (
    <div ref={ref} className={cn(styles.avatar, styles[size], className)} {...props}>
      {image ? image : <span className={styles.fallback}>{fallback}</span>}
    </div>
  );
}
