import type { ReactNode } from "react";
import { Card, Heading, Stack, Text } from "@neiist/ui";
import styles from "@/styles/components/news/News.module.css";

export interface NewsCardProps {
  badge?: ReactNode;
  subtitle?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  image: ReactNode;
  actions?: ReactNode;
}

export default function NewsCard({
  badge,
  subtitle,
  title,
  description,
  image,
  actions,
}: NewsCardProps) {
  const meta =
    badge || subtitle ? (
      <Stack direction="row" gap="sm" align="center" wrap>
        {badge}
        {subtitle && (
          <Text size="sm" variant="muted" className={styles.cardReset}>
            {subtitle}
          </Text>
        )}
      </Stack>
    ) : null;

  const frontFace = (
    <Card variant="elevated" className={styles.front}>
      <div className={styles.imageWrapper}>{image}</div>

      <Stack gap="sm" className={styles.cardBody}>
        {meta}
        <Heading level={5} className={styles.cardReset}>
          {title}
        </Heading>
      </Stack>
    </Card>
  );

  if (!description && !actions) return frontFace;

  return (
    <div tabIndex={0} className={styles.flipScene}>
      <div className={styles.flipInner}>
        {frontFace}

        <Card variant="elevated" className={styles.back}>
          {meta}
          <Heading level={5} className={styles.cardReset}>
            {title}
          </Heading>

          {typeof description === "string" || typeof description === "number" ? (
            <Text size="sm" variant="muted" className={styles.backDescription}>
              {description}
            </Text>
          ) : (
            description && <div className={styles.backDescription}>{description}</div>
          )}

          {actions && (
            <Stack direction="row" gap="sm" wrap className={styles.cardActions}>
              {actions}
            </Stack>
          )}
        </Card>
      </div>
    </div>
  );
}
