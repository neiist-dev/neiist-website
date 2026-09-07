"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Popover.module.css";
import { cn } from "../../utils/cn";
import { Modal } from "../Modal/Modal";

export interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  className?: string;
  width?: number | string; // Optional width for the popover
  offset?: number; // Distance from the anchor
  matchAnchorWidth?: boolean;
  mobileDrawerPosition?: "bottom" | "left" | "right";
  mobileDrawerTitle?: string;
  align?: "start" | "center" | "end";
}

export interface PopoverPosition {
  top: number;
  left: number;
  width?: string | number;
}

export function Popover({
  isOpen,
  onClose,
  anchorRef,
  children,
  className,
  width = 280,
  offset = 8,
  matchAnchorWidth = false,
  mobileDrawerPosition: _mobileDrawerPosition = "bottom",
  mobileDrawerTitle = "",
  align = "start",
}: PopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isOpen || isMobile) {
      if (!isOpen) setPosition(null);
      return;
    }

    const updatePosition = () => {
      if (anchorRef.current) {
        const rect = anchorRef.current.getBoundingClientRect();

        let targetWidth = width;
        if (matchAnchorWidth) {
          targetWidth = rect.width;
        }

        const actualWidth =
          containerRef.current?.offsetWidth ||
          (typeof targetWidth === "number" ? targetWidth : rect.width);

        let desiredLeft = rect.left;

        if (matchAnchorWidth) {
          desiredLeft = rect.left;
        } else if (align === "start") {
          desiredLeft = rect.left;
        } else if (align === "end") {
          desiredLeft = rect.right - actualWidth;
        } else if (align === "center") {
          desiredLeft = rect.left + rect.width / 2 - actualWidth / 2;
        }

        const clampedLeft = Math.max(
          16,
          Math.min(desiredLeft, window.innerWidth - actualWidth - 16)
        );

        setPosition({
          top: rect.bottom + offset,
          left: clampedLeft,
          width: targetWidth,
        });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, isMobile, anchorRef, width, offset, matchAnchorWidth, align]);

  useEffect(() => {
    if (!isOpen || isMobile) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutside =
        containerRef.current &&
        !containerRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target);

      if (isOutside) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isMobile, anchorRef, onClose]);

  if (typeof document === "undefined") return null;

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <Modal open={isOpen} onClose={onClose} title={mobileDrawerTitle} size="auto">
        {children}
      </Modal>
    );
  }

  const content = (
    <div
      ref={containerRef}
      className={cn(styles.popover, className)}
      onClick={(event) => event.stopPropagation()}
      style={
        position
          ? {
              position: "fixed",
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: position.width,
            }
          : { position: "fixed", visibility: "hidden", top: 0, left: 0, width: width }
      }>
      {children}
    </div>
  );

  const target =
    typeof document !== "undefined" ? anchorRef.current?.closest("dialog") || document.body : null;
  if (!target) return null;

  return createPortal(content, target);
}
