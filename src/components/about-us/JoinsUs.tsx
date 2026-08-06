import styles from "@/styles/components/about-us/JoinUs.module.css";
import type { JoinsUsDict } from "@/types/i18n";


interface JoinUsProps {
  dict: JoinsUsDict;
}
export default function JoinUs(
  { dict }: JoinUsProps) {

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{dict.title}</h3>
      <p className={styles.descprition}>
        {dict.description}
      </p>
      <a href={dict.apply_link} target="_blank" rel="noopener noreferrer" className={styles.apply}>
        {dict.apply}
      </a>
    </div>
  );
}
