import React from "react";
import styles from "./DetailCard.module.css";
import { cn } from "../../utils/cn";

export interface DetailCardMetaItem {
  label: React.ReactNode;
  value: React.ReactNode;
}

export interface DetailCardProps extends Omit<React.ComponentPropsWithRef<"article">, "title"> {
  avatar?: React.ReactNode;
  image?: string;
  imageAlt?: string;
  title: React.ReactNode;
  identifier?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  metadata?: DetailCardMetaItem[];
  tags?: React.ReactNode;
  renderImage?: (_src: string, _alt: string, _className: string) => React.ReactNode;
}

export function DetailCard({
  avatar,
  image,
  imageAlt,
  title,
  identifier,
  badge,
  actions,
  metadata,
  tags,
  children,
  renderImage,
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
      {(avatar || image) && (
        <div className={styles.avatarContainer}>
          {avatar ? (
            avatar
          ) : renderImage ? (
            renderImage(image!, imageAlt ?? "", styles.avatarImage)
          ) : (
            <img src={image} alt={imageAlt} className={styles.avatarImage} loading="lazy" />
          )}
        </div>
      )}

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
            {metadata.map((item, index) => (
              <div key={index} className={styles.metaItem}>
                <dt className={styles.metaLabel}>{item.label}:</dt>
                <dd className={styles.metaValue}>{item.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {children}

        {tags && <footer className={styles.tagsRow}>{tags}</footer>}
      </div>
    </article>
  );
}
