"use client";

import { useEffect, useState } from "react";
import { GlobalVotingState, VotingSyncPayload } from "@/types/voting";
import { submitVoteAction } from "@/lib/votingSystem";
import VotingGrid from "@/components/voting/VotingGrid";
import WinnerCard from "@/components/voting/WinnerCard";
import ColorfulText from "@/components/ColorfulText";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import styles from "@/styles/pages/VotingPage.module.css";

interface VotingClientProps {
  initialGlobalState: GlobalVotingState;
  initialUserVotes: Record<number, string | null>;
  showLastResult: boolean;
}

const ConnectingView = ({ status }: { status: "connecting" | "error" }) => (
  <div className={styles.waitingPage}>
    <h1 className={styles.waitingTitle}>
      A <span>{status === "connecting" ? "conectar..." : "reconectar..."}</span>
    </h1>
    <p className={styles.waitingSubtitle}>A estabelecer ligação ao servidor de votação.</p>
    <div className={styles.waitingDots}>
      <span />
      <span />
      <span />
    </div>
  </div>
);

const LastResultsView = ({
  session,
  results = [],
}: {
  session: { name: string; description?: string | null };
  results: GlobalVotingState["lastResults"];
}) => (
  <div className={styles.resultPage}>
    <div className={styles.resultHeader}>
      <Link href="?" scroll={false} className={styles.backButton}>
        <FaArrowLeft /> Voltar
      </Link>
      <ColorfulText as="h1" className={styles.resultTitle} text="Últimos Resultados" chunk={true} />
    </div>
    <div className={styles.resultContent}>
      <div className={styles.sessionInfo}>
        <h2 className={styles.sessionTitle}>{session.name}</h2>
        {session.description && <p className={styles.sessionDescription}>{session.description}</p>}
      </div>
      <WinnerCard results={results.slice(0, 4)} />
    </div>
  </div>
);

const WaitingForNextSessionView = ({ hasLastSession }: { hasLastSession: boolean }) => (
  <div className={styles.waitingPage}>
    <h1 className={styles.waitingTitle}>
      Aguarda pelo inicío da
      <br />
      <span>próxima votação</span>
    </h1>
    <p className={styles.waitingSubtitle}>
      Quando a votação abrir a página vai atualizar automáticamente.
    </p>
    <div className={styles.waitingDots}>
      <span />
      <span />
      <span />
    </div>
    {hasLastSession && (
      <Link href="?view=lastresult" scroll={false} className={styles.lastResultButton}>
        Ver resultados anteriores
      </Link>
    )}
  </div>
);

const VotesSubmittedView = () => (
  <div className={styles.waitingPage}>
    <h1 className={styles.waitingTitle}>
      Votos <span>submetidos!</span>
    </h1>
    <p className={styles.waitingSubtitle}>Aguarda pela publicação dos resultados.</p>
  </div>
);

export default function VotingClient({
  initialGlobalState,
  initialUserVotes,
  showLastResult,
}: VotingClientProps) {
  const [globalState, setGlobalState] = useState<GlobalVotingState>(initialGlobalState);
  const [userVotes, setUserVotes] = useState<Record<number, string | null>>(initialUserVotes);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">(
    "connecting"
  );

  useEffect(() => {
    const source = new EventSource("/api/voting/sync");

    source.onopen = () => setConnectionStatus("connected");

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as VotingSyncPayload;
        if (payload.type === "STATE_UPDATE") setGlobalState(payload.state);
        setConnectionStatus("connected");
      } catch (err) {
        console.error("Failed to parse SSE payload", err);
      }
    };

    source.onerror = (err) => {
      console.error("VotingSync SSE Error:", err);
      setConnectionStatus("error");
    };

    return () => source.close();
  }, []);

  const handleVote = async (sessionId: number, nomineeId: string) => {
    const previousVotes = { ...userVotes };
    setUserVotes((prev) => ({ ...prev, [sessionId]: nomineeId }));

    try {
      const formData = new FormData();
      formData.append("sessionId", sessionId.toString());
      formData.append("nomineeId", nomineeId);

      await submitVoteAction(formData);
    } catch (error) {
      console.error("Failed to submit vote:", error);
      setUserVotes(previousVotes);
    }
  };

  const activeVotingSessions = globalState.activeSessions || [];
  const unvotedSessions = activeVotingSessions.filter((s) => !userVotes[s.sessionId]);
  const lastFinishedSession = globalState.lastFinishedSession;
  const lastResults = globalState.lastResults || [];

  if (connectionStatus !== "connected")
    return <ConnectingView status={connectionStatus as "connecting" | "error"} />;

  if (activeVotingSessions.length === 0) {
    if (showLastResult && lastFinishedSession)
      return <LastResultsView session={lastFinishedSession} results={lastResults} />;

    return <WaitingForNextSessionView hasLastSession={!!lastFinishedSession} />;
  }

  if (unvotedSessions.length === 0) return <VotesSubmittedView />;

  return (
    <div className={styles.activeSessions}>
      {unvotedSessions.map((session) => (
        <VotingGrid
          key={session.sessionId}
          sessionId={session.sessionId}
          sessionName={session.sessionName}
          sessionDescription={session.sessionDescription}
          nominees={session.nominees}
          onVote={(nomineeId) => handleVote(session.sessionId, nomineeId)}
        />
      ))}
    </div>
  );
}
