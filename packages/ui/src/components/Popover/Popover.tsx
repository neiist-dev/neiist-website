"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Popover.module.css";
import { cn } from "../../utils/cn";
import { Modal } from "../Modal/Modal";

export interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
  anchorPoint?: { x: number; y: number } | null;
  children: React.ReactNode;
  className?: string;
  width?: number | string;
  offset?: number;
  matchAnchorWidth?: boolean;
  mobileDrawerPosition?: "bottom" | "left" | "right";
  mobileDrawerTitle?: string;
  align?: "start" | "center" | "end";
}

export interface PopoverPosition {
  top: number;
  left: number;
  width?: string | number;
  maxHeight?: number;
}

export function Popover({
  isOpen,
  onClose,
  anchorRef,
  anchorPoint,
  children,
  className,
  width = 280,
  offset = 8,
  matchAnchorWidth = false,
  mobileDrawerTitle = "",
  align = "start",
}: PopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 48rem)");
    const checkMobile = () => {
      setIsMobile(mql.matches);
    };
    checkMobile();
    mql.addEventListener("change", checkMobile);
    return () => mql.removeEventListener("change", checkMobile);
  }, []);

  useEffect(() => {
    if (!isOpen || isMobile) {
      if (!isOpen) setPosition(null);
      return;
    }

    const updatePosition = () => {
      let rect: {
        top: number;
        bottom: number;
        left: number;
        right: number;
        width: number;
        height: number;
      };
      if (anchorRef?.current) {
        rect = anchorRef.current.getBoundingClientRect();
      } else if (anchorPoint) {
        rect = {
          top: anchorPoint.y,
          bottom: anchorPoint.y,
          left: anchorPoint.x,
          right: anchorPoint.x,
          width: 0,
          height: 0,
        };
      } else {
        return;
      }

      const shouldMatchWidth = matchAnchorWidth && Boolean(anchorRef?.current);
      const targetWidth = shouldMatchWidth ? rect.width : width;
      const actualWidth = shouldMatchWidth
        ? rect.width
        : containerRef.current?.offsetWidth ||
          (typeof targetWidth === "number" ? targetWidth : rect.width);

      const desiredLeft =
        align === "end"
          ? rect.right - actualWidth
          : align === "center"
            ? rect.left + (rect.width - actualWidth) / 2
            : rect.left;

      const clampedLeft = Math.max(16, Math.min(desiredLeft, window.innerWidth - actualWidth - 16));

      const height = containerRef.current?.offsetHeight || 0;
      const spaceBelow = window.innerHeight - rect.bottom - offset - 16;
      const spaceAbove = rect.top - offset - 16;
      const shouldFlip = spaceBelow < height && spaceAbove > spaceBelow;

      const top = shouldFlip
        ? Math.max(16, rect.top - height - offset)
        : Math.min(rect.bottom + offset, window.innerHeight - height - 16);

      setPosition({
        top,
        left: clampedLeft,
        width: targetWidth,
        maxHeight: Math.max(80, shouldFlip ? spaceAbove : spaceBelow),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, isMobile, anchorRef, anchorPoint, width, offset, matchAnchorWidth, align]);

  useEffect(() => {
    if (!isOpen || isMobile) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideContainer = containerRef.current
        ? !containerRef.current.contains(target)
        : true;
      const isOutsideAnchor = anchorRef?.current ? !anchorRef.current.contains(target) : true;

      if (isOutsideContainer && isOutsideAnchor) onClose();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
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

  if (isMobile) {
    return (
      <Modal open={isOpen} onClose={onClose} title={mobileDrawerTitle} size="auto">
        {children}
      </Modal>
    );
  }

  if (!isOpen) return null;

  const content = (
    <div
      ref={containerRef}
      className={cn(styles.popover, "ui-scrollbar", !position && styles.hidden, className)}
      onClick={(event) => event.stopPropagation()}
      style={
        position
          ? {
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: position.width,
              maxHeight: position.maxHeight ? `${position.maxHeight}px` : undefined,
            }
          : { top: 0, left: 0, width: width }
      }>
      {children}
    </div>
  );

  const target = anchorRef?.current?.closest("dialog") || document.body;
  return createPortal(content, target);
}
