import styles from "@/styles/components/voting/StatusCard.module.css";

interface StatusCardProps {
  title: string;
  subtitle: string;
  detail?: string;
}

export default function StatusCard({ title, subtitle, detail }: StatusCardProps) {
  return (
    <section className={styles.wrapper}>
      {detail ? <p className={styles.detail}>{detail}</p> : null}
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </section>
  );
}
