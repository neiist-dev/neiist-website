import type { ComponentPropsWithRef, ReactNode } from "react";
import styles from "./Carousel.module.css";
import { cn } from "../../utils/cn";
import { Heading } from "../Heading/Heading";
import { Stack } from "../Stack/Stack";
import { Text } from "../Text/Text";

export interface FeatureCardProps extends Omit<ComponentPropsWithRef<"article">, "title"> {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  description?: ReactNode;
  image?: ReactNode;
  actions?: ReactNode;
  imagePosition?: "left" | "right";
}

export function FeatureCard({
  title,
  subtitle,
  badge,
  description,
  image,
  actions,
  imagePosition = "left",
  children,
  className,
  ref,
  ...props
}: FeatureCardProps) {
  const bodyContent = description ?? children;
  const isTextBody = typeof bodyContent === "string" || typeof bodyContent === "number";

  return (
    <article
      ref={ref}
      className={cn(
        styles.featureCard,
        imagePosition === "right" && styles.featureCardReversed,
        className
      )}
      {...props}>
      <div className={styles.featureImageWrapper}>{image}</div>

      <Stack gap="sm">
        {(badge || subtitle) && (
          <Stack direction="row" gap="sm" align="center" wrap>
            {badge}
            {subtitle && (
              <Text size="sm" variant="muted" className={styles.featureSubtitle}>
                {subtitle}
              </Text>
            )}
          </Stack>
        )}

        <Heading level={3}>{title}</Heading>

        {isTextBody ? (
          <Text variant="muted">{bodyContent}</Text>
        ) : (
          bodyContent && <div className={styles.featureDescription}>{bodyContent}</div>
        )}

        {actions && (
          <Stack direction="row" gap="sm" align="center" wrap>
            {actions}
          </Stack>
        )}
      </Stack>
    </article>
  );
}
