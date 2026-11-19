import React from "react";
import styles from "./PageIndicator.module.css";
import { cn } from "../../utils/cn";

export interface PageIndicatorProps extends Omit<React.ComponentPropsWithRef<"div">, "onSelect"> {
  count: number;
  activeIndex: number;
  onSelect?: (_index: number) => void;
  labelPrefix?: string;
}

export function PageIndicator({
  count,
  activeIndex,
  onSelect,
  labelPrefix = "Page",
  className,
  ref,
  ...props
}: PageIndicatorProps) {
  if (count <= 0) return null;

  const pages = Array.from({ length: count }, (_, i) => i);

  return (
    <div
      ref={ref}
      role="tablist"
      aria-label="Pagination"
      className={cn(styles.dots, className)}
      {...props}>
      {pages.map((page) => {
        const isActive = page === activeIndex;
        return (
          <button
            key={`page-dot-${page}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`${labelPrefix} ${page + 1}`}
            className={cn(styles.dot, isActive && styles.dotActive, !onSelect && styles.readonly)}
            onClick={() => onSelect?.(page)}
          />
        );
      })}
    </div>
  );
}
