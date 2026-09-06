import React from "react";
import styles from "./Tooltip.module.css";
import { cn } from "../../utils/cn";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ content, children, position = "top", className }: TooltipProps) {
  return (
    <div className={cn(styles.container, className)}>
      {children}
      <div className={cn(styles.tooltip, styles[position])} role="tooltip">
        {content}
      </div>
    </div>
  );
}
