import type { ComponentPropsWithRef, ReactNode } from "react";
import styles from "./DetailCard.module.css";
import { cn } from "../../utils/cn";

export interface DetailCardMetaItem {
  id?: string;
  label: ReactNode;
  value: ReactNode;
}

export interface DetailCardProps extends Omit<ComponentPropsWithRef<"article">, "title"> {
  avatar?: ReactNode;
  image?: ReactNode;
  title: ReactNode;
  identifier?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  metadata?: DetailCardMetaItem[];
  tags?: ReactNode;
}

export function DetailCard({
  avatar,
  image,
  title,
  identifier,
  badge,
  actions,
  metadata,
  tags,
  children,
  className,
  onClick,
  ref,
  ...props
}: DetailCardProps) {
  const isClickable = Boolean(onClick);

  return (
    <article
      ref={ref}
      className={cn(styles.card, isClickable && styles.clickable, className)}
      onClick={onClick}
      {...props}>
      {(avatar || image) && <div className={styles.avatarContainer}>{avatar ?? image}</div>}

      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h3 className={styles.title}>{title}</h3>
            {identifier && <span className={styles.identifier}>({identifier})</span>}
            {badge}
          </div>

          {actions && (
            <div className={styles.actions} onClick={(event) => event.stopPropagation()}>
              {actions}
            </div>
          )}
        </header>

        {metadata && metadata.length > 0 && (
          <dl className={styles.metadataList}>
            {metadata.map((item) => {
              const itemKey =
                item.id ??
                (typeof item.label === "string"
                  ? item.label
                  : typeof item.value === "string"
                    ? item.value
                    : undefined);
              return (
                <div key={itemKey} className={styles.metaItem}>
                  <dt className={styles.metaLabel}>{item.label}:</dt>
                  <dd className={styles.metaValue}>{item.value}</dd>
                </div>
              );
            })}
          </dl>
        )}

        {children}

        {tags && <footer className={styles.tagsRow}>{tags}</footer>}
      </div>
    </article>
  );
}
