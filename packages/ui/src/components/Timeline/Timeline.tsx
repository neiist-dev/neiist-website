import React from "react";
import styles from "./Timeline.module.css";
import { cn } from "../../utils/cn";
import { FiCheck } from "react-icons/fi";

export interface TimelineProps extends React.ComponentPropsWithRef<"ol"> {
  progress?: number; // 0 to 100
}

export function Timeline({ children, progress = 0, className, ref, ...props }: TimelineProps) {
  return (
    <ol
      ref={ref}
      className={cn(styles.timeline, className)}
      style={{ "--progress-width": `${progress}%` } as React.CSSProperties}
      {...props}>
      {children}
    </ol>
  );
}

export interface TimelineItemProps extends React.ComponentPropsWithRef<"li"> {
  title: string;
  subtitle?: string;
  active?: boolean;
  completed?: boolean;
  isAlert?: boolean;
  isError?: boolean;
  icon?: React.ReactNode;
}

export function TimelineItem({
  title,
  subtitle,
  active,
  completed,
  isAlert,
  isError,
  icon,
  className,
  ref,
  ...props
}: TimelineItemProps) {
  const nodeIcon =
    icon !== undefined ? (
      icon
    ) : isAlert ? null : completed || active ? (
      <FiCheck size={16} strokeWidth={3} />
    ) : null;

  return (
    <li
      ref={ref}
      className={cn(
        styles.item,
        active && styles.active,
        completed && styles.completed,
        isAlert && styles.alert,
        isError && styles.error,
        className
      )}
      {...props}>
      <div className={styles.node}>{nodeIcon}</div>
      <div className={styles.content}>
        <span className={styles.title}>{title}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
    </li>
  );
}
