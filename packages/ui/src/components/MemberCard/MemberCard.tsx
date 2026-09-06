import React from "react";
import { FiGithub, FiLinkedin } from "react-icons/fi";
import styles from "./MemberCard.module.css";
import { cn } from "../../utils/cn";

export interface MemberCardProps extends React.ComponentPropsWithRef<"article"> {
  name: string;
  role: string;
  image: string;
  imageAlt?: string;
  username?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  githubLabel?: string;
  linkedinLabel?: string;
  actions?: React.ReactNode;
  renderImage?: (_src: string, _alt: string, _className: string) => React.ReactNode;
}

const toGithubUrl = (url?: string) =>
  !url ? undefined : url.startsWith("http") ? url : `https://github.com/${url}`;

const toLinkedinUrl = (url?: string) =>
  !url ? undefined : url.startsWith("http") ? url : `https://www.linkedin.com/in/${url}`;

export function MemberCard({
  name,
  role,
  image,
  imageAlt,
  username,
  githubUrl,
  linkedinUrl,
  githubLabel = "GitHub profile",
  linkedinLabel = "LinkedIn profile",
  actions,
  renderImage,
  className,
  ref,
  ...props
}: MemberCardProps) {
  const ghUrl = toGithubUrl(githubUrl);
  const liUrl = toLinkedinUrl(linkedinUrl);

  return (
    <article ref={ref} className={cn(styles.container, className)} {...props}>
      <div className={styles.imageCard}>
        {renderImage ? (
          renderImage(image, imageAlt || "", styles.cardImage)
        ) : (
          <img src={image} alt={imageAlt} className={styles.cardImage} loading="lazy" />
        )}

        <div className={styles.overlay}>
          <div className={styles.actions}>
            {ghUrl && (
              <a
                href={ghUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={githubLabel}
                className={styles.iconLink}>
                <FiGithub className={styles.icon} />
              </a>
            )}
            {liUrl && (
              <a
                href={liUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={linkedinLabel}
                className={styles.iconLink}>
                <FiLinkedin className={styles.icon} />
              </a>
            )}
            {actions}
          </div>
          {username && <p className={styles.username}>@{username}</p>}
        </div>
      </div>

      <h4 className={styles.name}>{name}</h4>
      <p className={styles.role}>{role}</p>
    </article>
  );
}
