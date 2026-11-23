"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import styles from "./Carousel.module.css";
import { cn } from "../../utils/cn";
import { PageIndicator } from "../PageIndicator/PageIndicator";
import { OverlayCard } from "./OverlayCard";
import { FeatureCard } from "./FeatureCard";

const GAP_PX = 20;
const mod = (value: number, total: number) => ((value % total) + total) % total;

function nearestSlot(targetIndex: number, currentPosition: number, totalSlides: number) {
  const base = Math.round(currentPosition);
  let diff = mod(targetIndex - mod(base, totalSlides), totalSlides);
  if (diff > totalSlides / 2) diff -= totalSlides;
  return base + diff;
}

function flattenSlides(node: React.ReactNode): React.ReactNode[] {
  if (node === null || node === undefined || typeof node === "boolean") return [];
  if (Array.isArray(node)) return node.flatMap(flattenSlides);
  if (React.isValidElement<{ children?: React.ReactNode }>(node) && node.type === React.Fragment)
    return flattenSlides(node.props.children);

  return [node];
}

function getVisibleSlidesCount(slidesPerView: 1 | 2 | 3 | 4, width: number) {
  if (slidesPerView === 1 || width < 768) return 1;
  if (slidesPerView === 2 || width < 1024) return 2;
  return slidesPerView;
}

export type CarouselItemProps = React.ComponentPropsWithRef<"div">;

export function CarouselItem({ children, className, ref, ...props }: CarouselItemProps) {
  return (
    <div ref={ref} className={cn(styles.slideItem, className)} {...props}>
      {children}
    </div>
  );
}

export interface CarouselProps extends Omit<React.ComponentPropsWithRef<"div">, "onChange"> {
  slidesPerView?: 1 | 2 | 3 | 4;
  loop?: boolean;
  autoplay?: boolean | number;
  pauseOnHover?: boolean;
  showArrows?: boolean | "auto";
  arrowPlacement?: "inside" | "outside";
  showDots?: boolean;
  activeIndex?: number;
  defaultActiveIndex?: number;
  onSlideChange?: (_index: number) => void;
  prevLabel?: string;
  nextLabel?: string;
  emptyState?: React.ReactNode;
}

export function CarouselRoot({
  children,
  slidesPerView = 3,
  loop = true,
  autoplay = false,
  pauseOnHover = true,
  showArrows = "auto",
  arrowPlacement,
  showDots,
  activeIndex,
  defaultActiveIndex = 0,
  onSlideChange,
  prevLabel = "Previous slide",
  nextLabel = "Next slide",
  emptyState,
  className,
  onPointerEnter,
  onPointerLeave,
  onKeyDown,
  ref,
  ...props
}: CarouselProps) {
  const items = useMemo(() => flattenSlides(children), [children]);
  const totalSlides = items.length;

  const viewportRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const clickTimerRef = useRef<number | null>(null);
  const targetRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  const [visibleSlides, setVisibleSlides] = useState<number>(slidesPerView);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);

  const shouldLoop = loop && totalSlides > visibleSlides;
  const maxIndex = shouldLoop
    ? Math.max(0, totalSlides - 1)
    : Math.max(0, totalSlides - visibleSlides);
  const canSlide = shouldLoop ? totalSlides > visibleSlides : maxIndex > 0;
  const initialPosition = activeIndex ?? defaultActiveIndex;

  const [position, setPosition] = useState(() =>
    shouldLoop ? initialPosition : Math.max(0, Math.min(maxIndex, initialPosition))
  );
  const positionRef = useRef(position);
  const reportedIndexRef = useRef(
    shouldLoop
      ? mod(initialPosition, Math.max(1, totalSlides))
      : Math.max(0, Math.min(maxIndex, initialPosition))
  );

  const dragRef = useRef({
    active: false,
    decided: false,
    moved: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startPosition: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
  });

  const stepPx = viewportWidth > 0 ? (viewportWidth + GAP_PX) / visibleSlides : 0;

  const clampPosition = useCallback(
    (nextPosition: number, rubberBand = false) => {
      if (shouldLoop) return nextPosition;
      if (!rubberBand) return Math.max(0, Math.min(maxIndex, nextPosition));
      if (nextPosition < 0) return nextPosition * 0.28;
      if (nextPosition > maxIndex) return maxIndex + (nextPosition - maxIndex) * 0.28;
      return nextPosition;
    },
    [maxIndex, shouldLoop]
  );

  const applyPosition = useCallback((nextPosition: number) => {
    positionRef.current = nextPosition;
    setPosition(nextPosition);
  }, []);

  const cancelAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const reportIndex = useCallback(
    (targetPosition: number) => {
      if (totalSlides === 0) return;
      const nextIndex = shouldLoop
        ? mod(Math.round(targetPosition), totalSlides)
        : Math.max(0, Math.min(maxIndex, Math.round(targetPosition)));
      if (nextIndex !== reportedIndexRef.current) {
        reportedIndexRef.current = nextIndex;
        onSlideChange?.(nextIndex);
      }
    },
    [maxIndex, totalSlides, onSlideChange, shouldLoop]
  );

  const animateTo = useCallback(
    (target: number, durationMs = 320) => {
      cancelAnimation();
      const startPosition = positionRef.current;
      if (Math.abs(target - startPosition) < 0.001) {
        targetRef.current = null;
        applyPosition(target);
        return;
      }
      targetRef.current = target;
      const startTime = performance.now();
      const frame = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        applyPosition(
          progress < 1
            ? startPosition + (target - startPosition) * (1 - (1 - progress) ** 3)
            : target
        );
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(frame);
        } else {
          rafRef.current = null;
          targetRef.current = null;
        }
      };
      rafRef.current = requestAnimationFrame(frame);
    },
    [applyPosition, cancelAnimation]
  );

  const snapTo = useCallback(
    (rawTarget: number, durationMs?: number) => {
      const target = shouldLoop ? rawTarget : Math.max(0, Math.min(maxIndex, rawTarget));
      reportIndex(target);
      const distance = Math.abs(target - positionRef.current);
      const duration = durationMs ?? Math.min(450, Math.max(240, distance * 320));
      animateTo(target, duration);
    },
    [animateTo, maxIndex, reportIndex, shouldLoop]
  );

  const stepBy = useCallback(
    (delta: number) => {
      if (!canSlide) return;
      const base = targetRef.current ?? Math.round(positionRef.current);
      snapTo(base + delta);
    },
    [canSlide, snapTo]
  );

  useEffect(() => {
    const viewportEl = viewportRef.current;
    if (!viewportEl) return;
    const sync = () => {
      setViewportWidth(viewportEl.clientWidth);
      setVisibleSlides(getVisibleSlidesCount(slidesPerView, window.innerWidth));
      setIsTouchDevice(
        "ontouchstart" in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768
      );
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(viewportEl);
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [slidesPerView]);

  useEffect(() => {
    if (activeIndex === undefined || totalSlides === 0) return;
    const normalized = shouldLoop
      ? mod(activeIndex, totalSlides)
      : Math.max(0, Math.min(maxIndex, activeIndex));
    if (normalized === reportedIndexRef.current) return;
    reportedIndexRef.current = normalized;
    const target = shouldLoop
      ? nearestSlot(normalized, positionRef.current, totalSlides)
      : normalized;
    animateTo(target, 320);
  }, [activeIndex, animateTo, maxIndex, totalSlides, shouldLoop]);

  useEffect(() => {
    return () => {
      cancelAnimation();
      if (clickTimerRef.current !== null) {
        window.clearTimeout(clickTimerRef.current);
      }
    };
  }, [cancelAnimation]);

  const autoplayDelay =
    autoplay === true ? 3000 : typeof autoplay === "number" && autoplay > 0 ? autoplay : 0;

  useEffect(() => {
    if (autoplayDelay <= 0 || !canSlide || dragging) return;
    if (pauseOnHover && hovered) return;
    const currentLogical = shouldLoop
      ? mod(Math.round(positionRef.current), totalSlides)
      : Math.round(positionRef.current);
    if (!shouldLoop && currentLogical >= maxIndex) return;

    const intervalId = window.setInterval(() => {
      if (!dragRef.current.active) stepBy(1);
    }, autoplayDelay);
    return () => window.clearInterval(intervalId);
  }, [
    autoplayDelay,
    canSlide,
    dragging,
    hovered,
    maxIndex,
    totalSlides,
    pauseOnHover,
    shouldLoop,
    stepBy,
  ]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canSlide || event.button > 0) return;
    if (event.pointerType === "mouse") {
      const target = event.target as HTMLElement | null;
      if (target?.closest("a, button, input, select, textarea")) return;
    }
    cancelAnimation();
    targetRef.current = null;
    dragRef.current = {
      active: true,
      decided: event.pointerType === "mouse",
      moved: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPosition: positionRef.current,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId || stepPx <= 0) return;
    if (event.pointerType === "mouse" && (event.buttons & 1) === 0) {
      handlePointerUp(event);
      return;
    }
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (!drag.decided) {
      if (Math.abs(deltaX) < 4 && Math.abs(deltaY) < 4) return;
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        drag.active = false;
        return;
      }
      drag.decided = true;
    }

    if (!drag.moved && Math.abs(deltaX) > 4) {
      drag.moved = true;
      setDragging(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    if (!drag.moved) return;
    applyPosition(clampPosition(drag.startPosition - deltaX / stepPx, true));

    const now = performance.now();
    if (now - drag.lastTime > 8) {
      drag.velocity = -((event.clientX - drag.lastX) / stepPx / (now - drag.lastTime));
      drag.lastX = event.clientX;
      drag.lastTime = now;
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    drag.active = false;
    setDragging(false);

    if (event.currentTarget.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);

    if (!drag.moved) return;

    suppressClickRef.current = true;
    if (clickTimerRef.current !== null) window.clearTimeout(clickTimerRef.current);

    clickTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
      clickTimerRef.current = null;
    }, 60);

    const velocity =
      performance.now() - drag.lastTime > 60 ? 0 : Math.max(-0.025, Math.min(0.025, drag.velocity));
    const velocityBoost =
      stepPx > 0 && Math.abs(velocity * stepPx) > 0.25 ? Math.sign(velocity) * 0.5 : 0;
    const target = Math.round(positionRef.current + velocity * 140 + velocityBoost);
    snapTo(target, Math.min(420, Math.max(220, Math.abs(velocity * stepPx) * 160)));
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !canSlide) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, select")) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepBy(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      stepBy(1);
    }
  };

  if (totalSlides === 0) {
    return emptyState ? (
      <div ref={ref} className={cn(styles.carousel, className)} {...props}>
        {emptyState}
      </div>
    ) : null;
  }

  const resolvedPlacement = arrowPlacement ?? (slidesPerView === 1 ? "outside" : "inside");
  const arrowsAllowed = showArrows === "auto" ? !isTouchDevice : showArrows;
  const showArrowButtons = arrowsAllowed && canSlide;
  const showDotControls = (showDots ?? slidesPerView === 1) && canSlide;

  const currentLogicalIndex = shouldLoop
    ? mod(Math.round(position), totalSlides)
    : Math.max(0, Math.min(maxIndex, Math.round(position)));
  const dotCount = shouldLoop ? totalSlides : maxIndex + 1;

  const startSlot = shouldLoop && canSlide && viewportWidth > 0 ? Math.floor(position) - 1 : 0;
  const endSlot =
    shouldLoop && canSlide && viewportWidth > 0
      ? Math.ceil(position) + visibleSlides
      : totalSlides - 1;
  const slots = Array.from({ length: endSlot - startSlot + 1 }, (_, index) => startSlot + index);
  const translateX = stepPx > 0 ? (startSlot - position) * stepPx : 0;

  return (
    <div
      ref={ref}
      role="region"
      aria-roledescription="carousel"
      tabIndex={0}
      className={cn(
        styles.carousel,
        resolvedPlacement === "outside" && styles.placementOutside,
        className
      )}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
        onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setHovered(false);
        onPointerLeave?.(event);
      }}
      onKeyDown={handleKeyDown}
      {...props}>
      <div className={styles.viewportRow}>
        {showArrowButtons && (
          <button
            type="button"
            className={cn(
              styles.arrow,
              resolvedPlacement === "inside" && cn(styles.arrowInside, styles.arrowPrev)
            )}
            onClick={() => stepBy(-1)}
            disabled={!shouldLoop && currentLogicalIndex <= 0}
            aria-label={prevLabel}>
            <IoIosArrowBack size={resolvedPlacement === "inside" ? 30 : 24} aria-hidden="true" />
          </button>
        )}

        <div
          ref={viewportRef}
          className={cn(
            styles.viewport,
            slidesPerView > 1 && styles[`cols-${slidesPerView}`],
            canSlide && styles.draggable,
            dragging && styles.dragging
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onLostPointerCapture={(event) => {
            if (event.target === event.currentTarget) handlePointerUp(event);
          }}
          onDragStart={(event) => event.preventDefault()}
          onClickCapture={handleClickCapture}>
          <div className={styles.track} style={{ transform: `translate3d(${translateX}px, 0, 0)` }}>
            {slots.map((slot) => (
              <div key={slot} className={styles.slot}>
                {items[mod(slot, totalSlides)]}
              </div>
            ))}
          </div>
        </div>

        {showArrowButtons && (
          <button
            type="button"
            className={cn(
              styles.arrow,
              resolvedPlacement === "inside" && cn(styles.arrowInside, styles.arrowNext)
            )}
            onClick={() => stepBy(1)}
            disabled={!shouldLoop && currentLogicalIndex >= maxIndex}
            aria-label={nextLabel}>
            <IoIosArrowForward size={resolvedPlacement === "inside" ? 30 : 24} aria-hidden="true" />
          </button>
        )}
      </div>

      {showDotControls && (
        <PageIndicator
          count={dotCount}
          activeIndex={currentLogicalIndex}
          labelPrefix="Slide"
          aria-label="Slide pagination"
          onSelect={(dot) => {
            const target = shouldLoop ? nearestSlot(dot, positionRef.current, totalSlides) : dot;
            snapTo(target);
          }}
        />
      )}
    </div>
  );
}

export const Carousel = Object.assign(CarouselRoot, {
  Item: CarouselItem,
  OverlayCard,
  FeatureCard,
});
