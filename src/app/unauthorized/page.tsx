import { FaLock } from "react-icons/fa";
import styles from "@/styles/pages/Unauthorized.module.css";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <FaLock className={styles.icon} />
        <h1 className={styles.title}>Acesso Restrito</h1>
        <p className={styles.message}>Não tem permissão para aceder a esta página.</p>
        <Link href="/" className={styles.button}>
          Ir para a página inicial
        </Link>
        <p className={styles.helpText}>
          Precisa de ajuda? Contacte a equipa NEIIST em
          <br />
          <a href="mailto:neiist@tecnico.ulisboa.pt" className={styles.link}>
            neiist@tecnico.ulisboa.pt
          </a>
        </p>
      </div>
    </div>
  );
}
