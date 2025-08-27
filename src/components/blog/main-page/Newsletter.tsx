import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import styles from '@/styles/components/blog/mainpage/Newsletter.module.css';

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/blog/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: "Obrigado por subscreveres a newsletter do NEIIST!",
          html: `<h1>Obrigado por subscreveres!</h1><p>A partir de agora, vais começar a receber as mais recentes novidades e atualizações do NEIIST.</p><p>Se tiveres alguma dúvida ou sugestão, não hesites em entrar em contacto connosco.</p><p>Até breve!</p><p>A equipa do NEIIST.</p>`,
        })
      });
      setSubmitted(true);
    } catch {
      alert("Erro ao subscrever. Tenta novamente mais tarde.");
    }
  };

  return (
    <div className={styles.newsletter}>
      <h2 className={styles.newsletterTitle}>Subscreve a nossa Newsletter!</h2>
      {submitted ? (
        <p className={styles.successMessage}>Obrigado por subscreveres!</p>
      ) : (
        <form onSubmit={handleSubmit} className={styles.newsletterForm}>
          <input
            type="email"
            required
            placeholder="O teu email..."
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={styles.emailInput}
          />
          <Button
            variant="outline"
            className={styles.subscribeButton}
          >
            Subscrever
          </Button>
        </form>
      )}
    </div>
  );
}
