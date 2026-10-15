"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";
import { cn } from "../../utils/cn";
import { useMergedRef } from "../../utils/useMergedRef";
import { FiX } from "react-icons/fi";

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
  showCloseButton?: boolean;
  draggable?: boolean;
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
        <button className={styles.closeBtn} onClick={onClose} aria-label={closeLabel} type="button">
          <FiX size={24} />
        </button>
      )}
    </header>
  );
}

export type ModalBodyProps = React.ComponentPropsWithRef<"div">;

export function ModalBody({ children, className, ref, ...props }: ModalBodyProps) {
  return (
    <div ref={ref} className={cn(styles.body, "ui-scrollbar", className)} {...props}>
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
  showCloseButton = true,
  draggable = true,
  ref,
  ...props
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  const [isClosing, setIsClosing] = useState(false);

  const internalDialogRef = useRef<HTMLDialogElement>(null);
  const dialogRef = useMergedRef(ref, internalDialogRef);
  const contentRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open && internalDialogRef.current?.open) {
      setIsClosing(true);
    } else if (open) {
      setIsClosing(false);
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const dialog = internalDialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (isClosing && dialog.open) {
      const timer = setTimeout(() => {
        setIsClosing(false);
        if (dialog.open) dialog.close();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open, isClosing, mounted]);

  useEffect(() => {
    const dialog = internalDialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    event.stopPropagation();
    if (closeOnBackdropClick && event.target === internalDialogRef.current && !isClosing) onClose();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      !draggable ||
      isClosing ||
      e.button !== 0 ||
      !window.matchMedia("(max-width: 48rem)").matches
    )
      return;

    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, select, textarea, [role='button'], [data-no-drag]"))
      return;

    const content = contentRef.current;
    if (!content) return;

    const isTopArea = Boolean(
      target.closest(`.${styles.dragHandleBar}`) ||
      target.closest("header") ||
      e.clientY - content.getBoundingClientRect().top <= 80
    );

    if (!isTopArea) return;

    dragStartYRef.current = e.clientY;
    isDraggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !contentRef.current) return;

    const dy = e.clientY - dragStartYRef.current;
    if (dy > 0) {
      contentRef.current.style.transition = "none";
      contentRef.current.style.transform = `translateY(${dy}px)`;
    }
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !contentRef.current) return;
    isDraggingRef.current = false;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId))
        e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const content = contentRef.current;
    const dy = e.clientY - dragStartYRef.current;

    if (e.type !== "pointercancel" && dy > 70) {
      content.style.transition = "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)";
      content.style.transform = "translateY(100%)";

      if (internalDialogRef.current) {
        internalDialogRef.current.classList.add(styles.dialogClosing);
        internalDialogRef.current.setAttribute("data-closing", "");
      }

      setTimeout(() => {
        content.style.transition = "";
        content.style.transform = "";
        if (internalDialogRef.current) {
          internalDialogRef.current.classList.remove(styles.dialogClosing);
          internalDialogRef.current.removeAttribute("data-closing");
          if (internalDialogRef.current.open) internalDialogRef.current.close();
        }
        onClose();
      }, 200);
    } else {
      content.style.transition = "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)";
      content.style.transform = "translateY(0)";

      setTimeout(() => {
        content.style.transition = "";
        content.style.transform = "";
      }, 200);
    }
  };

  if (!mounted || typeof document === "undefined") return null;

  const isVisible = open || isClosing;

  return createPortal(
    <dialog
      ref={dialogRef}
      className={cn(styles.dialog, isClosing && styles.dialogClosing)}
      data-closing={isClosing ? "" : undefined}
      onClick={handleBackdropClick}
      {...props}>
      {isVisible && (
        <div
          ref={contentRef}
          className={cn(
            styles.content,
            styles[`size-${size}`],
            isClosing && styles.closing,
            className
          )}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}>
          {draggable && (
            <div className={styles.dragHandleBar} aria-hidden="true">
              <div className={styles.dragHandlePill} />
            </div>
          )}
          {title || subtitle || badge ? (
            <>
              <ModalHeader
                title={title}
                subtitle={subtitle}
                badge={badge}
                onClose={onClose}
                showCloseButton={showCloseButton}
                closeLabel={closeLabel}
              />
              <ModalBody>{children}</ModalBody>
            </>
          ) : (
            children
          )}
        </div>
      )}
    </dialog>,
    document.body
  );
}

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});
