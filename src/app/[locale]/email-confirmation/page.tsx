import Link from "next/link";
import styles from "@/styles/pages/EmailConfirmation.module.css";

export default function EmailConfirmationSuccess() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Email Alternativo Verificado!</h2>
        <div className={styles.icon}>✔️</div>
        <p className={styles.text}>
          O teu email alternativo foi verificado com sucesso.
          <br />
          Podes fechar esta página ou voltar ao{" "}
          <Link href="/profile" className={styles.link}>
            perfil
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
