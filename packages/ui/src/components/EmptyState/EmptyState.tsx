import React from "react";
import styles from "./EmptyState.module.css";
import { cn } from "../../utils/cn";

export interface EmptyStateProps extends React.ComponentPropsWithRef<"section"> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ref,
  ...props
}: EmptyStateProps) {
  return (
    <section ref={ref} className={cn(styles.wrapper, className)} {...props}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </section>
  );
}
