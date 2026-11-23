import type { ComponentPropsWithRef, ReactNode } from "react";
import { FiGithub, FiLinkedin } from "react-icons/fi";
import styles from "./MemberCard.module.css";
import { cn } from "../../utils/cn";

export interface MemberCardProps extends ComponentPropsWithRef<"article"> {
  name: string;
  role: string;
  image?: ReactNode;
  username?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  githubLabel?: string;
  linkedinLabel?: string;
  actions?: ReactNode;
}

export const toGithubUrl = (url?: string) =>
  !url ? undefined : url.startsWith("http") ? url : `https://github.com/${url}`;

export const toLinkedinUrl = (url?: string) =>
  !url ? undefined : url.startsWith("http") ? url : `https://www.linkedin.com/in/${url}`;

export function MemberCard({
  name,
  role,
  image,
  username,
  githubUrl,
  linkedinUrl,
  githubLabel = "GitHub profile",
  linkedinLabel = "LinkedIn profile",
  actions,
  className,
  ref,
  ...props
}: MemberCardProps) {
  const ghUrl = toGithubUrl(githubUrl);
  const liUrl = toLinkedinUrl(linkedinUrl);

  return (
    <article ref={ref} className={cn(styles.container, className)} {...props}>
      <div className={styles.imageCard}>
        {image}

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
