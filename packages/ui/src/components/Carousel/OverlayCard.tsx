import React from "react";
import styles from "./Carousel.module.css";
import { cn } from "../../utils/cn";
import { Heading } from "../Heading/Heading";
import { Stack } from "../Stack/Stack";
import { Text } from "../Text/Text";

export interface OverlayCardProps extends Omit<React.ComponentPropsWithRef<"article">, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  image?: React.ReactNode | string;
  imageAlt?: string;
  renderImage?: (_src: string, _alt: string, _className: string) => React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
}

export type CarouselOverlayCardProps = OverlayCardProps;

export function OverlayCard({
  title,
  description,
  image,
  imageAlt,
  renderImage,
  href,
  target,
  rel,
  className,
  ref,
  ...props
}: OverlayCardProps) {
  const resolvedAlt = imageAlt ?? (typeof title === "string" ? title : "");
  const resolvedRel = rel ?? (target === "_blank" ? "noopener noreferrer" : undefined);

  return (
    <article ref={ref} className={cn(styles.overlayCard, className)} {...props}>
      {React.isValidElement(image) ? (
        image
      ) : typeof image === "string" && renderImage ? (
        renderImage(image, resolvedAlt, styles.cardImage)
      ) : typeof image === "string" ? (
        <img src={image} alt={resolvedAlt} className={styles.cardImage} loading="lazy" />
      ) : (
        (image as React.ReactNode)
      )}

      <div className={styles.overlayPill}>{title}</div>

      <Stack align="center" justify="center" gap="sm" className={styles.overlayContent}>
        <Heading level={5} className={styles.overlayTitle}>
          {title}
        </Heading>
        {description && (
          <Text size="sm" className={styles.overlayDescription}>
            {description}
          </Text>
        )}
      </Stack>

      {href && (
        <a
          href={href}
          target={target}
          rel={resolvedRel}
          className={styles.stretchedLink}
          aria-label={typeof title === "string" ? title : resolvedAlt || "Open item"}
        />
      )}
    </article>
  );
}

export const CarouselOverlayCard = OverlayCard;
