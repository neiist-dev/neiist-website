"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Drawer.module.css";
import { cn } from "../../utils/cn";
import { FiX } from "react-icons/fi";

export type DrawerPosition = "left" | "right";
export type DrawerSize = "sm" | "md" | "lg" | "xl" | "full" | "auto";

export interface DrawerHeaderProps extends Omit<React.ComponentPropsWithRef<"header">, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
  closeLabel?: string;
}

export function DrawerHeader({
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
}: DrawerHeaderProps) {
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
        children
      )}

      {showCloseButton && onClose && (
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label={closeLabel}
          type="button">
          <FiX size={20} />
        </button>
      )}
    </header>
  );
}

export type DrawerBodyProps = React.ComponentPropsWithRef<"div">;

export function DrawerBody({ children, className, ref, ...props }: DrawerBodyProps) {
  return (
    <div ref={ref} className={cn(styles.body, className)} {...props}>
      {children}
    </div>
  );
}

export type DrawerFooterProps = React.ComponentPropsWithRef<"footer">;

export function DrawerFooter({ children, className, ref, ...props }: DrawerFooterProps) {
  return (
    <footer ref={ref} className={cn(styles.footer, className)} {...props}>
      {children}
    </footer>
  );
}

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  position?: DrawerPosition;
  size?: DrawerSize;
  className?: string;
  closeLabel?: string;
  closeOnBackdropClick?: boolean;
}

export function DrawerRoot({
  open,
  onClose,
  title,
  subtitle,
  badge,
  children,
  position = "right",
  size = "md",
  className,
  closeLabel,
  closeOnBackdropClick = true,
}: DrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const [target, setTarget] = useState<Element | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setTarget(document.querySelector("dialog[open]") || document.body);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Close on backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (closeOnBackdropClick && event.target === overlayRef.current) {
      event.stopPropagation();
      onClose();
    }
  };

  if (!open || !target) return null;

  const childArray = React.Children.toArray(children);
  const hasExplicitHeader = childArray.some(
    (c) => React.isValidElement(c) && c.type === DrawerHeader
  );
  const hasExplicitBody = childArray.some((c) => React.isValidElement(c) && c.type === DrawerBody);
  const hasExplicitFooter = childArray.some(
    (c) => React.isValidElement(c) && c.type === DrawerFooter
  );

  const shouldRenderDefaultHeader = !hasExplicitHeader && Boolean(title || subtitle || badge);

  let renderedContent: React.ReactNode;

  if (hasExplicitBody) {
    renderedContent = (
      <>
        {shouldRenderDefaultHeader && (
          <DrawerHeader
            title={title}
            subtitle={subtitle}
            badge={badge}
            onClose={onClose}
            closeLabel={closeLabel}
          />
        )}
        {children}
      </>
    );
  } else if (hasExplicitFooter) {
    const bodyChildren: React.ReactNode[] = [];
    const footerChildren: React.ReactNode[] = [];

    childArray.forEach((child) => {
      if (React.isValidElement(child) && child.type === DrawerFooter) {
        footerChildren.push(child);
      } else {
        bodyChildren.push(child);
      }
    });

    renderedContent = (
      <>
        {shouldRenderDefaultHeader && (
          <DrawerHeader
            title={title}
            subtitle={subtitle}
            badge={badge}
            onClose={onClose}
            closeLabel={closeLabel}
          />
        )}
        <DrawerBody>{bodyChildren}</DrawerBody>
        {footerChildren}
      </>
    );
  } else if (shouldRenderDefaultHeader) {
    renderedContent = (
      <>
        <DrawerHeader
          title={title}
          subtitle={subtitle}
          badge={badge}
          onClose={onClose}
          closeLabel={closeLabel}
        />
        <DrawerBody>{children}</DrawerBody>
      </>
    );
  } else {
    renderedContent = children;
  }

  return createPortal(
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog">
      <aside
        className={cn(styles.drawer, styles[position], styles[size], className)}
        ref={drawerRef}
        aria-label={typeof title === "string" ? title : undefined}
        onClick={(event) => event.stopPropagation()}>
        {renderedContent}
      </aside>
    </div>,
    target
  );
}

export const Drawer = Object.assign(DrawerRoot, {
  Header: DrawerHeader,
  Body: DrawerBody,
  Footer: DrawerFooter,
});
