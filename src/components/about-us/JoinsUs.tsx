import styles from "@/styles/components/about-us/JoinUs.module.css";

interface JoinUsProps {
  dict: {
    title: string; 
    description: string;
    apply: string;
  };
}
export default function JoinUs(
  { dict }: JoinUsProps) {
  const joinUsLink = "https://google.com";

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{dict.title}</h3>
      <p className={styles.descprition}>
        {dict.description}
      </p>
      <a href={joinUsLink} target="_blank" rel="noopener noreferrer" className={styles.apply}>
        {dict.apply}
      </a>
    </div>
  );
}
