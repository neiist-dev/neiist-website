"use client";

import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import {
  FinishedVotingSession,
  GlobalVotingState,
  VotingSyncPayload,
  VOTING_SYNC_EVENT_TYPES,
} from "@/types/voting";
import { submitVoteAction } from "@/lib/votingSystem";
import VotingGrid from "@/components/voting/VotingGrid";
import WinnerCard from "@/components/voting/WinnerCard";
import ColorfulText from "@/components/ColorfulText";
import PaymentProcessingSpinner from "@/components/shop/PaymentProcessingSpinner";
import { Button, Alert } from "@neiist/ui";
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
  sessions = [],
  dict,
}: {
  sessions: FinishedVotingSession[];
  dict: Dictionary["voting"];
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const currentSession = sessions[selectedIdx] || sessions[0];

  if (!currentSession) return null;

  return (
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

      {sessions.length > 1 && (
        <nav className={styles.sessionSelector} aria-label={dict.previous_sessions_aria}>
          <button
            type="button"
            className={styles.arrowButton}
            onClick={() => setSelectedIdx((prev) => Math.max(0, prev - 1))}
            disabled={selectedIdx === 0}
            aria-label={dict.previous_session_aria}>
            <FiChevronLeft />
          </button>

          <div className={styles.sessionList}>
            {sessions.map((session, idx) => (
              <button
                key={session.id}
                type="button"
                className={`${styles.sessionTab} ${idx === selectedIdx ? styles.selectedTab : ""}`}
                onClick={() => setSelectedIdx(idx)}>
                {session.name || dict.session_default_name.replace("{number}", String(idx + 1))}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.arrowButton}
            onClick={() => setSelectedIdx((prev) => Math.min(sessions.length - 1, prev + 1))}
            disabled={selectedIdx >= sessions.length - 1}
            aria-label={dict.next_session_aria}>
            <FiChevronRight />
          </button>
        </nav>
      )}

      <div className={styles.resultContent}>
        <div className={styles.sessionInfo}>
          <h2 className={styles.sessionTitle}>{currentSession.name}</h2>
          {currentSession.description && (
            <p className={styles.sessionDescription}>{currentSession.description}</p>
          )}
        </div>
        <WinnerCard
          results={currentSession.results || []}
          sessionType={currentSession.type}
          dict={dict}
        />
      </div>
    </div>
  );
};

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

const VotesSubmittedView = ({
  dict,
  onReview,
}: {
  dict: Dictionary["voting"];
  onReview?: () => void;
}) => (
  <div className={styles.waitingPage}>
    <h1 className={styles.waitingTitle}>
      {dict.votes_submitted_prefix} <span>{dict.votes_submitted_highlight}</span>
    </h1>
    <p className={styles.waitingSubtitle}>{dict.votes_submitted_subtitle}</p>
    {onReview && (
      <div className={styles.reviewActionWrapper}>
        <Button variant="solid" color="primary" onClick={onReview}>
          {dict.change_vote}
        </Button>
      </div>
    )}
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
  const [reviewMode, setReviewMode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">(
    "connected"
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
        if (payload.type === VOTING_SYNC_EVENT_TYPES.STATE_UPDATE) setGlobalState(payload.state);
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
  const finishedSessions = globalState.finishedSessions || [];

  const displaySessions = reviewMode ? activeVotingSessions : unvotedSessions;
  const safeSessionIndex = Math.min(selectedSessionIndex, Math.max(0, displaySessions.length - 1));

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
        setReviewMode(false);
      }, 800);
    } catch (error) {
      console.error("Failed to submit vote:", error);
      setVoteFlowState(null);
      Alert.error(error instanceof Error ? error.message : dict.vote_error);
    }
  };

  if (connectionStatus === "error") return <ConnectingView status="error" dict={dict} />;

  if (activeVotingSessions.length === 0) {
    if (showLastResult && finishedSessions.length > 0)
      return <LastResultsView sessions={finishedSessions} dict={dict} />;
    return <WaitingForNextSessionView hasLastSession={finishedSessions.length > 0} dict={dict} />;
  }

  if (unvotedSessions.length === 0 && !reviewMode)
    return <VotesSubmittedView dict={dict} onReview={() => setReviewMode(true)} />;

  const currentSession = displaySessions[safeSessionIndex];

  return (
    <div className={styles.activeSessions}>
      {voteFlowState && (
        <div className={styles.voteOverlayBackdrop}>
          <PaymentProcessingSpinner
            flowState={voteFlowState.status}
            title={voteFlowState.status === "success" ? dict.vote_success : dict.submitting_vote}
            subtitle={voteFlowState.nomineeName}
            size={voteFlowState.status === "success" ? 56 : 48}
          />
        </div>
      )}

      {displaySessions.length > 1 && (
        <nav className={styles.sessionSelector} aria-label={dict.voting_sessions_aria}>
          <button
            type="button"
            className={styles.arrowButton}
            onClick={() => setSelectedSessionIndex((prev) => Math.max(0, prev - 1))}
            disabled={safeSessionIndex === 0}
            aria-label={dict.previous_session_aria}>
            <FiChevronLeft />
          </button>

          <div className={styles.sessionList}>
            {displaySessions.map((session, idx) => (
              <button
                key={session.sessionId}
                type="button"
                className={`${styles.sessionTab} ${idx === safeSessionIndex ? styles.selectedTab : ""}`}
                onClick={() => setSelectedSessionIndex(idx)}>
                {session.sessionName ||
                  dict.session_default_name.replace("{number}", String(idx + 1))}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.arrowButton}
            onClick={() =>
              setSelectedSessionIndex((prev) => Math.min(displaySessions.length - 1, prev + 1))
            }
            disabled={safeSessionIndex >= displaySessions.length - 1}
            aria-label={dict.next_session_aria}>
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
          sessionType={currentSession.sessionType}
          nominees={currentSession.nominees}
          selectedNomineeId={userVotes[currentSession.sessionId]}
          onVote={(nomineeId) => handleVote(currentSession.sessionId, nomineeId)}
          dict={dict}
        />
      )}
    </div>
  );
}
