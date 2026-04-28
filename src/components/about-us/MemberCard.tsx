import Image from "next/image";
import styles from "@/styles/components/about-us/MemberCard.module.css";
import { FiGithub, FiLinkedin } from "react-icons/fi";

type MemberCardProps = {
  name: string;
  role: string;
  image: string;
  imageAlt?: string;
  githuburl?: string;
  linkdinurl?: string;
  username?: string;
  dict: {
    github_label: string;
    linkedin_label: string;
    photo_alt: string;
  };
};

const toGithubUrl = (v?: string) =>
  !v ? undefined : v.startsWith("http") ? v : `https://github.com/${v}`;

const toLinkedinUrl = (v?: string) =>
  !v ? undefined : v.startsWith("http") ? v : `https://www.linkedin.com/in/${v}`;

export default function MemberCard({
  name,
  role,
  image,
  imageAlt,
  githuburl,
  linkdinurl,
  username,
  dict
}: MemberCardProps) {
  const ghUrl = toGithubUrl(githuburl);
  const liUrl = toLinkedinUrl(linkdinurl);
  const alt = imageAlt || `${name} ${dict.photo_alt}`;

  return (
    <div className={styles.container}>
      <div className={styles.imageCard}>
        <Image alt={alt} className={styles.cardImage} src={image} fill />
        <div className={styles.overlay}>
          <div className={styles.actions}>
            {ghUrl && (
              <a
                href={ghUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={dict.github_label}
                className={styles.iconLink}>
                <FiGithub className={styles.icon} />
              </a>
            )}
            {liUrl && (
              <a
                href={liUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={dict.linkedin_label}
                className={styles.iconLink}>
                <FiLinkedin className={styles.icon} />
              </a>
            )}
          </div>
          {username && <p className={styles.username}>@{username}</p>}
        </div>
      </div>

      <div className={styles.name}>
        <p className={styles.nameText}>{name}</p>
      </div>
      <div className={styles.role}>
        <p className={styles.roleText}>{role}</p>
      </div>
    </div>
  );
}
