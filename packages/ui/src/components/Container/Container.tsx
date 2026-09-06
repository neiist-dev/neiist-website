import React from "react";
import styles from "./Container.module.css";
import { cn } from "../../utils/cn";

export interface ContainerProps extends React.ComponentPropsWithRef<"div"> {
  size?: "sm" | "md" | "lg" | "xl";
}

export function Container({ size = "lg", children, className, ref, ...props }: ContainerProps) {
  return (
    <div ref={ref} className={cn(styles.container, styles[size], className)} {...props}>
      {children}
    </div>
  );
}
