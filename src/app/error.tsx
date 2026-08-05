"use client";

import { useEffect } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import styles from "@/styles/pages/Error.module.css";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string; userMessage?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <FaExclamationTriangle className={styles.icon} />
        <h1 className={styles.title}>Algo Correu Mal</h1>
        <p className={styles.message}>
          {error.userMessage || "Ocorreu um erro ao carregar esta página."}
        </p>
        <button className={styles.button} onClick={() => reset()}>
          Tentar novamente
        </button>
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
