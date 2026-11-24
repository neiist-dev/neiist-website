import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react";
import styles from "./BentoGrid.module.css";
import { cn } from "../../utils/cn";
import { Card } from "../Card/Card";
import { Heading } from "../Heading/Heading";
import { Stack } from "../Stack/Stack";
import { Text } from "../Text/Text";
import { BentoGridRoot, type BentoGridProps } from "./BentoGridRoot";

export type { BentoGridProps };

export interface BentoGridItemProps extends Omit<ComponentPropsWithRef<"article">, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  image?: ReactNode;
  imageFit?: "cover" | "contain";
  imageBackground?: string;
  actions?: ReactNode;
}

function BentoGridItem({
  title,
  description,
  image,
  imageFit = "cover",
  imageBackground,
  actions,
  children,
  className,
  ref,
  ...props
}: BentoGridItemProps) {
  const bodyContent = description ?? children;
  const isTextBody = typeof bodyContent === "string" || typeof bodyContent === "number";
  const hasReveal = Boolean(bodyContent || actions);

  return (
    <Card
      ref={ref}
      tabIndex={0}
      variant="elevated"
      className={cn(styles.item, className)}
      {...props}>
      <div
        className={cn(styles.imageWrapper, imageFit === "contain" && styles.imageContain)}
        style={
          imageBackground ? ({ "--bento-image-bg": imageBackground } as CSSProperties) : undefined
        }>
        {image}
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

function BentoGridBase(props: BentoGridProps) {
  return <BentoGridRoot {...props} />;
}

export const BentoGrid = Object.assign(BentoGridBase, {
  Item: BentoGridItem,
});
