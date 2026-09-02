import styles from "@/styles/components/about-us/JoinUs.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface JoinUsProps {
  dict: Dictionary["about_us_page"]["join_us"];
}

export default function JoinUs({ dict }: JoinUsProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{dict.title}</h2>
      <p className={styles.description}>{dict.description}</p>
      {dict.apply_link && (
        <a
          href={dict.apply_link}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.apply}>
          {dict.apply}
        </a>
      )}
    </div>
  );
}
