"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./BentoGrid.module.css";
import { cn } from "../../utils/cn";
import { Button } from "../Button/Button";
import { Card } from "../Card/Card";
import { Heading } from "../Heading/Heading";
import { Stack } from "../Stack/Stack";
import { Text } from "../Text/Text";

export type BentoImageRenderFn = (
  _src: string,
  _alt: string,
  _className: string
) => React.ReactNode;

function flattenBentoItems(node: React.ReactNode): React.ReactNode[] {
  if (node === null || node === undefined || typeof node === "boolean") return [];
  if (Array.isArray(node)) return node.flatMap(flattenBentoItems);
  if (React.isValidElement<{ children?: React.ReactNode }>(node) && node.type === React.Fragment)
    return flattenBentoItems(node.props.children);

  return [node];
}

export interface BentoGridItemProps extends Omit<React.ComponentPropsWithRef<"article">, "title"> {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  image?: React.ReactNode | string;
  imageAlt?: string;
  renderImage?: BentoImageRenderFn;
  actions?: React.ReactNode;
}

export function BentoGridItem({
  id,
  title,
  description,
  image,
  imageAlt,
  renderImage,
  actions,
  children,
  className,
  ref,
  ...props
}: BentoGridItemProps) {
  const resolvedAlt = imageAlt ?? (typeof title === "string" ? title : "");
  const bodyContent = description ?? children;
  const isTextBody = typeof bodyContent === "string" || typeof bodyContent === "number";
  const hasReveal = Boolean(bodyContent || actions);

  return (
    <Card
      ref={ref}
      id={id}
      tabIndex={0}
      variant="elevated"
      className={cn(styles.item, className)}
      {...props}>
      <div className={styles.imageWrapper}>
        {React.isValidElement(image) ? (
          image
        ) : typeof image === "string" && renderImage ? (
          renderImage(image, resolvedAlt, styles.cardImage)
        ) : typeof image === "string" ? (
          <img src={image} alt={resolvedAlt} className={styles.cardImage} loading="lazy" />
        ) : (
          (image as React.ReactNode)
        )}
      </div>

      {(title || hasReveal) && (
        <div className={styles.content}>
          {title && (
            <Heading level={5} className={styles.title}>
              {title}
            </Heading>
          )}

          {hasReveal && (
            <div className={styles.reveal}>
              <div className={styles.revealInner}>
                {isTextBody ? (
                  <Text size="sm" variant="muted">
                    {bodyContent}
                  </Text>
                ) : (
                  bodyContent && <div className={styles.description}>{bodyContent}</div>
                )}

                {actions && (
                  <Stack direction="row" gap="sm" wrap>
                    {actions}
                  </Stack>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
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

export const BentoGrid = Object.assign(BentoGridRoot, {
  Item: BentoGridItem,
});
