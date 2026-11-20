import type { ComponentProps, ReactNode } from "react";
import styles from "./SelectableCard.module.css";
import { cn } from "../../utils/cn";
import { FaCheck } from "react-icons/fa6";
import { Button, type ButtonProps } from "../Button/Button";

export interface SelectableCardTextFrontProps {
  title?: ReactNode;
  description?: ReactNode;
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

export interface SelectableCardActionProps extends Omit<ButtonProps, "children"> {
  selected: boolean;
  selectedLabel: ReactNode;
  unselectedLabel: ReactNode;
}

export function SelectableCardAction({
  selected,
  selectedLabel,
  unselectedLabel,
  variant = "solid",
  color = "primary",
  ...props
}: SelectableCardActionProps) {
  return (
    <Button variant={variant} color={color} {...props}>
      {selected ? selectedLabel : unselectedLabel}
    </Button>
  );
}

export interface SelectableCardProps extends Omit<ComponentProps<"button">, "title"> {
  selected?: boolean;
  multiple?: boolean;
  hasDetails?: boolean;
  detailsLabel?: ReactNode;
  selectedLabel?: ReactNode;
  unselectedLabel?: ReactNode;
  overlayText?: ReactNode;
  media?: ReactNode;
  title?: ReactNode;
}

export function SelectableCardRoot({
  selected = false,
  multiple = false,
  hasDetails = false,
  detailsLabel,
  selectedLabel,
  unselectedLabel,
  overlayText,
  media,
  title,
  className,
  children,
  ref,
  ...props
}: SelectableCardProps) {
  const overlay =
    overlayText ?? (hasDetails ? detailsLabel : selected ? selectedLabel : unselectedLabel);

  return (
    <button
      ref={ref}
      type="button"
      role={multiple ? "checkbox" : "radio"}
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

        {overlay && (
          <div className={styles.overlay}>
            <span className={styles.cta}>{overlay}</span>
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
  Action: SelectableCardAction,
});
