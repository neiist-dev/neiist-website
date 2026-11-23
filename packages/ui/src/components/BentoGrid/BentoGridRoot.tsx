"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./BentoGrid.module.css";
import { cn } from "../../utils/cn";
import { Button } from "../Button/Button";
import { Stack } from "../Stack/Stack";

function flattenBentoItems(node: React.ReactNode): React.ReactNode[] {
  if (node === null || node === undefined || typeof node === "boolean") return [];
  if (Array.isArray(node)) return node.flatMap(flattenBentoItems);
  if (React.isValidElement<{ children?: React.ReactNode }>(node) && node.type === React.Fragment)
    return flattenBentoItems(node.props.children);

  return [node];
}

export interface BentoGridProps extends React.ComponentPropsWithRef<"div"> {
  gap?: "sm" | "md" | "lg";
  mode?: "reveal" | "swap";
  initialCount?: number;
  moreLabel?: React.ReactNode;
  lessLabel?: React.ReactNode;
}

export function BentoGridRoot({
  children,
  gap = "md",
  mode = "reveal",
  initialCount,
  moreLabel = "More",
  lessLabel = "Show less",
  className,
  ref,
  ...props
}: BentoGridProps) {
  const items = useMemo(() => flattenBentoItems(children), [children]);

  const canExpand = initialCount !== undefined && items.length > initialCount;

  const [expanded, setExpanded] = useState(() => {
    if (initialCount === undefined || typeof window === "undefined") return false;
    const targetId = decodeURIComponent(window.location.hash.slice(1));
    if (!targetId) return false;
    return items.some(
      (item, index) =>
        index >= initialCount &&
        React.isValidElement<{ id?: string }>(item) &&
        item.props.id === targetId
    );
  });

  useEffect(() => {
    if (!canExpand || initialCount === undefined) return;

    let rafId = 0;
    const scrollToTarget = (targetId: string) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    };

    const initialHash = decodeURIComponent(window.location.hash.slice(1));
    if (initialHash) scrollToTarget(initialHash);

    const onHashChange = () => {
      const targetId = decodeURIComponent(window.location.hash.slice(1));
      if (!targetId) return;
      const idx = items.findIndex(
        (item) => React.isValidElement<{ id?: string }>(item) && item.props.id === targetId
      );
      if (idx === -1) return;
      if (idx >= initialCount) setExpanded(true);
      scrollToTarget(targetId);
    };

    window.addEventListener("hashchange", onHashChange);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [canExpand, initialCount, items]);

  const rows = useMemo(() => {
    const visible =
      canExpand && !expanded && initialCount !== undefined ? items.slice(0, initialCount) : items;
    const paired: { key: string; items: React.ReactNode[] }[] = [];
    for (let i = 0; i < visible.length; i += 2) {
      const pair = visible.slice(i, i + 2);
      const first = pair[0];
      const key =
        React.isValidElement<{ id?: string }>(first) && first.key !== null
          ? String(first.key)
          : React.isValidElement<{ id?: string }>(first) && typeof first.props.id === "string"
            ? first.props.id
            : `bento-row-${i}`;
      paired.push({ key, items: pair });
    }
    return paired;
  }, [canExpand, expanded, initialCount, items]);

  return (
    <Stack ref={ref} gap="md" align="stretch" className={className} {...props}>
      <div className={cn(styles.grid, styles[`gap-${gap}`], mode === "swap" && styles.swap)}>
        {rows.map((row) => (
          <div key={row.key} className={styles.row}>
            {row.items}
          </div>
        ))}
      </div>

      {canExpand && (
        <Stack direction="row" justify="start">
          <Button
            type="button"
            variant="outline"
            color="neutral"
            size="sm"
            onClick={() => setExpanded((prev) => !prev)}>
            {expanded ? lessLabel : moreLabel}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
