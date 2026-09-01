"use client";

import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import { GlobalVotingState, VotingSyncPayload } from "@/types/voting";
import { submitVoteAction } from "@/lib/votingSystem";
import VotingGrid from "@/components/voting/VotingGrid";
import WinnerCard from "@/components/voting/WinnerCard";
import ColorfulText from "@/components/ColorfulText";
import PaymentProcessingSpinner from "@/components/shop/PaymentProcessingSpinner";
import styles from "@/styles/pages/VotingPage.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface VotingClientProps {
  initialGlobalState: GlobalVotingState;
  initialUserVotes: Record<number, string | null>;
  showLastResult: boolean;
  dict: Dictionary["voting"];
}

const ConnectingView = ({
  status,
  dict,
}: {
  status: "connecting" | "error";
  dict: Dictionary["voting"];
}) => (
  <div className={styles.waitingPage}>
    <h1 className={styles.waitingTitle}>
      <span>{status === "connecting" ? dict.connecting : dict.reconnecting}</span>
    </h1>
    <p className={styles.waitingSubtitle}>{dict.connecting_subtitle}</p>
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
  dict,
}: {
  session: { name: string; description?: string | null };
  results: GlobalVotingState["lastResults"];
  dict: Dictionary["voting"];
}) => (
  <div className={styles.resultPage}>
    <div className={styles.resultHeader}>
      <Link href="?" scroll={false} className={styles.backButton}>
        <FaArrowLeft /> {dict.back}
      </Link>
      <ColorfulText
        as="h1"
        className={styles.resultTitle}
        text={dict.last_results_title}
        chunk={true}
      />
    </div>
    <div className={styles.resultContent}>
      <div className={styles.sessionInfo}>
        <h2 className={styles.sessionTitle}>{session.name}</h2>
        {session.description && <p className={styles.sessionDescription}>{session.description}</p>}
      </div>
      <WinnerCard results={results.slice(0, 4)} dict={dict} />
    </div>
  </div>
);

const WaitingForNextSessionView = ({
  hasLastSession,
  dict,
}: {
  hasLastSession: boolean;
  dict: Dictionary["voting"];
}) => (
  <div className={styles.waitingPage}>
    <h1 className={styles.waitingTitle}>
      {dict.waiting_title_prefix}
      <br />
      <span>{dict.waiting_title_highlight}</span>
    </h1>
    <p className={styles.waitingSubtitle}>{dict.waiting_subtitle}</p>
    <div className={styles.waitingDots}>
      <span />
      <span />
      <span />
    </div>
    {hasLastSession && (
      <Link href="?view=lastresult" scroll={false} className={styles.lastResultButton}>
        {dict.view_previous_results}
      </Link>
    )}
  </div>
);

const VotesSubmittedView = ({ dict }: { dict: Dictionary["voting"] }) => (
  <div className={styles.waitingPage}>
    <h1 className={styles.waitingTitle}>
      {dict.votes_submitted_prefix} <span>{dict.votes_submitted_highlight}</span>
    </h1>
    <p className={styles.waitingSubtitle}>{dict.votes_submitted_subtitle}</p>
  </div>
);

export default function VotingClient({
  initialGlobalState,
  initialUserVotes,
  showLastResult,
  dict,
}: VotingClientProps) {
  const [globalState, setGlobalState] = useState<GlobalVotingState>(initialGlobalState);
  const [userVotes, setUserVotes] = useState<Record<number, string | null>>(initialUserVotes);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">(
    "connecting"
  );
  const [voteFlowState, setVoteFlowState] = useState<{
    status: "processing" | "success";
    nomineeName?: string;
  } | null>(null);

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

  const activeVotingSessions = globalState.activeSessions || [];
  const unvotedSessions = activeVotingSessions.filter((s) => !userVotes[s.sessionId]);
  const lastFinishedSession = globalState.lastFinishedSession;
  const lastResults = globalState.lastResults || [];

  const safeSessionIndex = Math.min(selectedSessionIndex, Math.max(0, unvotedSessions.length - 1));

  const handleVote = async (sessionId: number, nomineeId: string) => {
    const session = activeVotingSessions.find((s) => s.sessionId === sessionId);
    const nominee = session?.nominees.find((n) => n.id === nomineeId);

    setVoteFlowState({ status: "processing", nomineeName: nominee?.name });

    try {
      const formData = new FormData();
      formData.append("sessionId", sessionId.toString());
      formData.append("nomineeId", nomineeId);
      await submitVoteAction(formData);

      setVoteFlowState({ status: "success", nomineeName: nominee?.name });

      setTimeout(() => {
        setUserVotes((prev) => ({ ...prev, [sessionId]: nomineeId }));
        setVoteFlowState(null);
      }, 800);
    } catch (error) {
      console.error("Failed to submit vote:", error);
      setVoteFlowState(null);
    }
  };

  if (connectionStatus !== "connected")
    return <ConnectingView status={connectionStatus} dict={dict} />;

  if (activeVotingSessions.length === 0) {
    if (showLastResult && lastFinishedSession)
      return <LastResultsView session={lastFinishedSession} results={lastResults} dict={dict} />;
    return <WaitingForNextSessionView hasLastSession={!!lastFinishedSession} dict={dict} />;
  }

  if (unvotedSessions.length === 0) return <VotesSubmittedView dict={dict} />;

  const currentSession = unvotedSessions[safeSessionIndex];

  return (
    <div className={styles.activeSessions}>
      {voteFlowState && (
        <div className={styles.voteOverlayBackdrop}>
          <PaymentProcessingSpinner
            flowState={voteFlowState.status}
            title={
              voteFlowState.status === "success"
                ? (dict.vote_success ?? "Voto registado com sucesso!")
                : (dict.submitting_vote ?? "A submeter o teu voto...")
            }
            subtitle={voteFlowState.nomineeName}
            size={voteFlowState.status === "success" ? 56 : 48}
          />
        </div>
      )}

      {unvotedSessions.length > 1 && (
        <nav className={styles.sessionSelector} aria-label="Sessões de votação">
          <button
            type="button"
            className={styles.arrowButton}
            onClick={() => setSelectedSessionIndex((prev) => Math.max(0, prev - 1))}
            disabled={safeSessionIndex === 0}
            aria-label="Sessão anterior">
            <FiChevronLeft />
          </button>

          <div className={styles.sessionList}>
            {unvotedSessions.map((session, idx) => (
              <button
                key={session.sessionId}
                type="button"
                className={`${styles.sessionTab} ${idx === safeSessionIndex ? styles.selectedTab : ""}`}
                onClick={() => setSelectedSessionIndex(idx)}>
                {session.sessionName || `Sessão ${idx + 1}`}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.arrowButton}
            onClick={() =>
              setSelectedSessionIndex((prev) => Math.min(unvotedSessions.length - 1, prev + 1))
            }
            disabled={safeSessionIndex >= unvotedSessions.length - 1}
            aria-label="Próxima sessão">
            <FiChevronRight />
          </button>
        </nav>
      )}

      {currentSession && (
        <VotingGrid
          key={currentSession.sessionId}
          sessionId={currentSession.sessionId}
          sessionName={currentSession.sessionName}
          sessionDescription={currentSession.sessionDescription}
          nominees={currentSession.nominees}
          onVote={(nomineeId) => handleVote(currentSession.sessionId, nomineeId)}
          dict={dict}
        />
      )}
    </div>
  );
}
