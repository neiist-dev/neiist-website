import React from "react"; 
import styles from "@/styles/pages/JantarDeCurso.module.css";

export default function JantarDeCursoPage() {
  return (
    <main className={styles.mainContainer}>
      <h1 className={styles.title}>Jantar de Curso</h1>
      <p className={styles.description}>
        Bem-vindo à página de inscrição para o Jantar de Curso!
      </p>
    </main>
  );
}