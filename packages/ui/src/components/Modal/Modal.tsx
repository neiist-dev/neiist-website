"use client";

import React, { useEffect, useRef } from "react";
import styles from "./Modal.module.css";
import { cn } from "../../utils/cn";
import { useMergedRef } from "../../utils/useMergedRef";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full" | "auto";

export interface ModalProps extends Omit<React.ComponentPropsWithRef<"dialog">, "open" | "title"> {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  size?: ModalSize;
  children: React.ReactNode;
  className?: string;
  closeOnBackdropClick?: boolean;
  closeLabel?: string;
}

export interface ModalHeaderProps extends Omit<React.ComponentPropsWithRef<"header">, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
  closeLabel?: string;
}

export function ModalHeader({
  children,
  title,
  subtitle,
  badge,
  onClose,
  showCloseButton = true,
  className,
  closeLabel = "Close",
  ref,
  ...props
}: ModalHeaderProps) {
  return (
    <header ref={ref} className={cn(styles.header, className)} {...props}>
      {title || subtitle || badge ? (
        <div className={styles.headerTitleGroup}>
          <div className={styles.titleRow}>
            {title &&
              (typeof title === "string" ? <h2 className={styles.title}>{title}</h2> : title)}
            {badge}
          </div>
          {subtitle &&
            (typeof subtitle === "string" ? (
              <p className={styles.subtitle}>{subtitle}</p>
            ) : (
              subtitle
            ))}
        </div>
      ) : (
        <>{children}</>
      )}

      {showCloseButton && onClose && (
        <button className={styles.closeBtn} onClick={onClose} aria-label={closeLabel}>
          &times;
        </button>
      )}
    </header>
  );
}

export type ModalBodyProps = React.ComponentPropsWithRef<"div">;

export function ModalBody({ children, className, ref, ...props }: ModalBodyProps) {
  return (
    <div ref={ref} className={cn(styles.body, className)} {...props}>
      {children}
    </div>
  );
}

export type ModalFooterProps = React.ComponentPropsWithRef<"footer">;

export function ModalFooter({ children, className, ref, ...props }: ModalFooterProps) {
  return (
    <footer ref={ref} className={cn(styles.footer, className)} {...props}>
      {children}
    </footer>
  );
}

export function ModalRoot({
  open,
  onClose,
  title,
  subtitle,
  badge,
  size = "md",
  children,
  className,
  closeOnBackdropClick = true,
  closeLabel = "Close",
  ref,
  ...props
}: ModalProps) {
  const internalDialogRef = useRef<HTMLDialogElement>(null);
  const dialogRef = useMergedRef(ref, internalDialogRef);

  useEffect(() => {
    const dialog = internalDialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [open]);

  useEffect(() => {
    const dialog = internalDialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
    };

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (closeOnBackdropClick && event.target === internalDialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClick={handleBackdropClick} {...props}>
      {open && (
        <div
          className={cn(styles.content, styles[`size-${size}`], className)}
          onClick={(event) => event.stopPropagation()}>
          {title || subtitle || badge ? (
            <>
              <ModalHeader
                title={title}
                subtitle={subtitle}
                badge={badge}
                onClose={onClose}
                closeLabel={closeLabel}
              />
              <ModalBody>{children}</ModalBody>
            </>
          ) : (
            children
          )}
        </div>
      )}
    </dialog>
  );
}

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});
