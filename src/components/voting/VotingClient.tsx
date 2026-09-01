"use client";

import { useEffect, useState, useOptimistic } from "react";
import { GlobalVotingState, VotingSyncPayload } from "@/types/voting";
import { submitVoteAction } from "@/lib/votingSystem";
import VotingGrid from "@/components/voting/VotingGrid";
import WinnerCard from "@/components/voting/WinnerCard";
import ColorfulText from "@/components/ColorfulText";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
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
  const [optimisticUserVotes, addOptimisticVote] = useOptimistic(
    userVotes,
    (state, newVote: { sessionId: number; nomineeId: string }) => ({
      ...state,
      [newVote.sessionId]: newVote.nomineeId,
    })
  );

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
    addOptimisticVote({ sessionId, nomineeId });

    try {
      const formData = new FormData();
      formData.append("sessionId", sessionId.toString());
      formData.append("nomineeId", nomineeId);

      await submitVoteAction(formData);
      setUserVotes((prev) => ({ ...prev, [sessionId]: nomineeId }));
    } catch (error) {
      console.error("Failed to submit vote:", error);
    }
  };

  const activeVotingSessions = globalState.activeSessions || [];
  const unvotedSessions = activeVotingSessions.filter(
    (votingSession) => !optimisticUserVotes[votingSession.sessionId]
  );
  const lastFinishedSession = globalState.lastFinishedSession;
  const lastResults = globalState.lastResults || [];

  if (connectionStatus !== "connected")
    return <ConnectingView status={connectionStatus as "connecting" | "error"} dict={dict} />;

  if (activeVotingSessions.length === 0) {
    if (showLastResult && lastFinishedSession)
      return <LastResultsView session={lastFinishedSession} results={lastResults} dict={dict} />;

    return <WaitingForNextSessionView hasLastSession={!!lastFinishedSession} dict={dict} />;
  }

  if (unvotedSessions.length === 0) return <VotesSubmittedView dict={dict} />;

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
          dict={dict}
        />
      ))}
    </div>
  );
}
