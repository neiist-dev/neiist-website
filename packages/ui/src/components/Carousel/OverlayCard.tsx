import type { ComponentPropsWithRef, ReactNode } from "react";
import styles from "./Carousel.module.css";
import { cn } from "../../utils/cn";
import { Heading } from "../Heading/Heading";
import { Stack } from "../Stack/Stack";
import { Text } from "../Text/Text";

export interface OverlayCardProps extends Omit<ComponentPropsWithRef<"article">, "title"> {
  title: ReactNode;
  description?: ReactNode;
  image?: ReactNode;
  href?: string;
  target?: string;
  rel?: string;
}

export function OverlayCard({
  title,
  description,
  image,
  href,
  target,
  rel,
  className,
  ref,
  ...props
}: OverlayCardProps) {
  const resolvedRel = rel ?? (target === "_blank" ? "noopener noreferrer" : undefined);

  return (
    <article ref={ref} className={cn(styles.overlayCard, className)} {...props}>
      {image}

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
          aria-label={typeof title === "string" ? title : "Open item"}
        />
      )}
    </article>
  );
}
