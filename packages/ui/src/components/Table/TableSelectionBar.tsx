import React from "react";
import styles from "./TableSelectionBar.module.css";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { cn } from "../../utils/cn";
import { FiX } from "react-icons/fi";

export interface TableSelectionBarProps {
  count: number;
  label?: React.ReactNode;
  onClear?: () => void;
  clearLabel?: string;
  children?: React.ReactNode;
  className?: string;
}

export function TableSelectionBar({
  count,
  label = "selecionado(s)",
  onClear,
  clearLabel = "Limpar",
  children,
  className,
}: TableSelectionBarProps) {
  if (count <= 0) return null;

  return (
    <div role="region" aria-label="Ações de seleção" className={cn(styles.selectionBar, className)}>
      <div className={styles.countGroup}>
        <Badge variant="primary">{count}</Badge>
        <span className={styles.countText}>{label}</span>
        {onClear && (
          <Button
            type="button"
            variant="ghost"
            color="neutral"
            size="sm"
            onClick={onClear}
            className={styles.clearBtn}>
            <FiX size={14} /> {clearLabel}
          </Button>
        )}
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
}
