"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VotingSession, SessionResult } from "@/types/voting";
import {
  startVotingAction,
  finishVotingAction,
  deleteVotingSessionAction,
} from "@/lib/votingSystem";
import { FiX, FiTrash2 } from "react-icons/fi";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import styles from "@/styles/components/voting/admin/VotingSessionDetailOverlay.module.css";

interface VotingSessionDetailOverlayProps {
  session: VotingSession;
  results: SessionResult[];
}

function formatDate(date?: Date | string) {
  return date ? new Date(date).toLocaleString("pt-PT") : "—";
}

export default function VotingSessionDetailOverlay({
  session,
  results,
}: VotingSessionDetailOverlayProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendingAction, setPendingAction] = useState<"start" | "finish" | "delete" | null>(null);

  const handleClose = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("sessionId");
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [handleClose]);

  const handleDelete = async () => {
    const formData = new FormData();
    formData.append("sessionId", String(session.id));
    await deleteVotingSessionAction(formData);
    handleClose();
  };

  const handleStartVoting = async () => {
    const formData = new FormData();
    formData.append("sessionId", String(session.id));
    await startVotingAction(formData);
    handleClose();
  };

  const handleFinishVoting = async () => {
    const formData = new FormData();
    formData.append("sessionId", String(session.id));
    await finishVotingAction(formData);
    handleClose();
  };

  const totalVotes = results.reduce((acc, result) => acc + result.voteCount, 0);
  const topResults = results.slice(0, 3);

  return (
    <div
      className={styles.container}
      onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={handleClose} aria-label="Fechar">
          <FiX size={32} />
        </button>

        <header className={styles.header}>
          <h2>Detalhes da Sessão</h2>
        </header>

        <div className={styles.name}>{session.name}</div>

        {session.description && <p className={styles.description}>{session.description}</p>}

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <label>Estado</label>
            <p>
              {session.status === "idle"
                ? "Pronto"
                : session.status === "voting"
                  ? "Aberta"
                  : "Fechada"}
            </p>
          </div>
          <div className={styles.infoItem}>
            <label>Tipo</label>
            <p>
              {session.type === "activity"
                ? "Atividade"
                : session.type === "users"
                  ? "Utilizadores"
                  : "Customizada"}
            </p>
          </div>
          <div className={styles.infoItem}>
            <label>Início</label>
            <p>{formatDate(session.startAt)}</p>
          </div>
          <div className={styles.infoItem}>
            <label>Fim</label>
            <p>{formatDate(session.endAt)}</p>
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>
              Resultados{session.status === "voting" ? " — Ao Vivo" : ""}{" "}
              {results.length > 3 && "(Top 3)"}
            </h3>
          </div>

          {results.length === 0 ? (
            <p>Nenhum voto registado.</p>
          ) : (
            <div className={styles.candidateList}>
              {topResults.map((result) => {
                const percentage = totalVotes > 0 ? (result.voteCount / totalVotes) * 100 : 0;
                return (
                  <div key={result.nomineeId} className={styles.candidate}>
                    <div className={styles.candidateInfo}>
                      <span className={styles.candidateName}>{result.nomineeName}</span>
                      <span className={styles.voteCount}>{result.voteCount} votos</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
              {results.length > 3 && (
                <p className={styles.moreResults}>
                  + {results.length - 3} outros candidatos não mostrados.
                </p>
              )}
            </div>
          )}
        </section>

        <div className={styles.actionButtons}>
          {session.status === "idle" && (
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={() => setPendingAction("start")}>
              Abrir votação
            </button>
          )}

          {session.status === "voting" && (
            <button
              type="button"
              className={styles.buttonOutline}
              onClick={() => setPendingAction("finish")}>
              Fechar votação
            </button>
          )}

          <button
            type="button"
            className={styles.buttonDanger}
            onClick={() => setPendingAction("delete")}>
            <FiTrash2 size={16} className={styles.buttonIcon} />
            Eliminar
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={pendingAction === "start"}
        message="Tem a certeza que quer abrir esta votação?"
        onConfirm={async () => {
          setPendingAction(null);
          await handleStartVoting();
        }}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmDialog
        open={pendingAction === "finish"}
        message="Tem a certeza que quer fechar esta votação?"
        onConfirm={async () => {
          setPendingAction(null);
          await handleFinishVoting();
        }}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmDialog
        open={pendingAction === "delete"}
        message="Tem a certeza que deseja eliminar esta sessão? Esta ação é irreversível."
        onConfirm={async () => {
          setPendingAction(null);
          await handleDelete();
        }}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
