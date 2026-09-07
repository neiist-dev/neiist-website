"use client";

import React from "react";
import styles from "./ConfirmDialog.module.css";
import { Modal } from "../Modal/Modal";
import { Button } from "../Button/Button";
import { cn } from "../../utils/cn";

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isDestructive = false,
  onConfirm,
  onCancel,
  className,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      className={cn(styles.dialog, className)}>
      <div className={styles.message}>{message}</div>
      <footer className={styles.actions}>
        <Button variant="ghost" onClick={onCancel} type="button">
          {cancelLabel}
        </Button>
        <Button variant={isDestructive ? "danger" : "primary"} onClick={onConfirm} type="button">
          {confirmLabel}
        </Button>
      </footer>
    </Modal>
  );
}
