import React from "react";
import styles from "./SelectableCard.module.css";
import { cn } from "../../utils/cn";
import { FaCheck } from "react-icons/fa6";

export interface SelectableCardTextFrontProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}

export function SelectableCardTextFront({
  title,
  description,
  className,
}: SelectableCardTextFrontProps) {
  return (
    <div className={cn(styles.textFront, className)}>
      {title && <span className={styles.textFrontTitle}>{title}</span>}
      {description && <p className={styles.textFrontDescription}>{description}</p>}
    </div>
  );
}

export interface SelectableCardProps extends Omit<React.ComponentPropsWithRef<"button">, "title"> {
  selected?: boolean;
  mode?: "single" | "multiple";
  media?: React.ReactNode;
  overlayText?: React.ReactNode;
  title?: React.ReactNode;
}

export function SelectableCardRoot({
  selected = false,
  mode = "single",
  media,
  overlayText,
  title,
  className,
  children,
  ref,
  ...props
}: SelectableCardProps) {
  const isMultiple = mode === "multiple";

  return (
    <button
      ref={ref}
      type="button"
      role={isMultiple ? "checkbox" : "radio"}
      aria-checked={selected}
      className={cn(styles.card, selected && styles.selectedCard, className)}
      {...props}>
      <div className={styles.imageCard}>
        {selected && (
          <div className={styles.selectionBadge}>
            <FaCheck size={12} />
          </div>
        )}

        {media}

        {overlayText && (
          <div className={styles.overlay}>
            <span className={styles.cta}>{overlayText}</span>
          </div>
        )}
      </div>

      {title && <h4 className={styles.name}>{title}</h4>}
      {children}
    </button>
  );
}

export const SelectableCard = Object.assign(SelectableCardRoot, {
  TextFront: SelectableCardTextFront,
});
