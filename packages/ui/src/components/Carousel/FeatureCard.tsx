import React from "react";
import styles from "./Carousel.module.css";
import { cn } from "../../utils/cn";
import { Heading } from "../Heading/Heading";
import { Stack } from "../Stack/Stack";
import { Text } from "../Text/Text";

export interface FeatureCardProps extends Omit<React.ComponentPropsWithRef<"article">, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  description?: React.ReactNode;
  image?: React.ReactNode | string;
  imageAlt?: string;
  renderImage?: (_src: string, _alt: string, _className: string) => React.ReactNode;
  actions?: React.ReactNode;
  imagePosition?: "left" | "right";
}

export function FeatureCard({
  title,
  subtitle,
  badge,
  description,
  image,
  imageAlt,
  renderImage,
  actions,
  imagePosition = "left",
  children,
  className,
  ref,
  ...props
}: FeatureCardProps) {
  const resolvedAlt = imageAlt ?? (typeof title === "string" ? title : "");
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
      <div className={styles.featureImageWrapper}>
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
