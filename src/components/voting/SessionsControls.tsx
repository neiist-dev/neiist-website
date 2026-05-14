"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarEvent } from "@/types/events";
import { VotingSession } from "@/types/voting";
import {
  createVotingSessionAction,
  startVotingAction,
  finishVotingAction,
} from "@/lib/votingSystem";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import styles from "@/styles/components/voting/SessionControls.module.css";

interface SessionControlsProps {
  activities: CalendarEvent[];
  sessions: VotingSession[];
}

interface SelectOption {
  label: string;
  value: string;
}

function useSingleSelection(options: string[]) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    setSelectedItems((prev) => {
      const current = prev[0] ?? null;

      if (current && options.includes(current)) {
        return prev.length === 1 ? prev : [current];
      }

      const fallback = options[0] ?? null;
      if (!fallback) return prev.length === 0 ? prev : [];
      return current === fallback && prev.length === 1 ? prev : [fallback];
    });
  }, [options]);

  return [selectedItems, setSelectedItems] as const;
}

function toMap(options: SelectOption[]) {
  return new Map(options.map((option) => [option.label, option.value]));
}

export default function SessionControls({ activities, sessions }: SessionControlsProps) {
  const idleSessions = sessions.filter((session) => session.status === "idle");
  const votingSessions = sessions.filter((session) => session.status === "voting");
  const finishedSessions = sessions.filter((session) => session.status === "finished");

  const activityOptions = useMemo(
    () =>
      activities.map((activity) => ({
        label: `${activity.summary} (${activity.id.slice(0, 8)})`,
        value: activity.id,
      })),
    [activities]
  );
  const idleSessionOptions = useMemo(
    () =>
      idleSessions.map((session) => ({
        label: `${session.name} (#${session.id})`,
        value: String(session.id),
      })),
    [idleSessions]
  );
  const votingSessionOptions = useMemo(
    () =>
      votingSessions.map((session) => ({
        label: `${session.name} (#${session.id})`,
        value: String(session.id),
      })),
    [votingSessions]
  );

  const activityLabels = useMemo(
    () => activityOptions.map((option) => option.label),
    [activityOptions]
  );
  const idleSessionLabels = useMemo(
    () => idleSessionOptions.map((option) => option.label),
    [idleSessionOptions]
  );
  const votingSessionLabels = useMemo(
    () => votingSessionOptions.map((option) => option.label),
    [votingSessionOptions]
  );

  const [selectedActivity, setSelectedActivity] = useSingleSelection(activityLabels);
  const [selectedIdleSession, setSelectedIdleSession] = useSingleSelection(idleSessionLabels);
  const [selectedVotingSession, setSelectedVotingSession] = useSingleSelection(votingSessionLabels);

  const activityByLabel = useMemo(() => toMap(activityOptions), [activityOptions]);
  const idleSessionByLabel = useMemo(() => toMap(idleSessionOptions), [idleSessionOptions]);
  const votingSessionByLabel = useMemo(() => toMap(votingSessionOptions), [votingSessionOptions]);

  const selectedActivityId = selectedActivity[0]
    ? (activityByLabel.get(selectedActivity[0]) ?? "")
    : "";
  const selectedIdleSessionId = selectedIdleSession[0]
    ? (idleSessionByLabel.get(selectedIdleSession[0]) ?? "")
    : "";
  const selectedVotingSessionId = selectedVotingSession[0]
    ? (votingSessionByLabel.get(selectedVotingSession[0]) ?? "")
    : "";

  return (
    <div className={styles.wrapper}>
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Estado atual</h2>
        <ul className={styles.summaryList}>
          <li>
            <strong>{votingSessions.length}</strong> sess
            {votingSessions.length === 1 ? "ão ativa" : "ões ativas"}
          </li>
          <li>
            <strong>{idleSessions.length}</strong> por iniciar
          </li>
          <li>
            <strong>{finishedSessions.length}</strong> terminadas
          </li>
        </ul>

        {votingSessions.length > 0 && (
          <ul className={styles.activeList}>
            {votingSessions.map((session) => (
              <li key={session.id}>{session.name}</li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Nova sessão</h2>
        <form action={createVotingSessionAction} className={styles.form}>
          <label className={styles.label} htmlFor="name">
            Nome da votação
          </label>
          <input
            id="name"
            type="text"
            name="name"
            required
            placeholder="Ex: O Mais Provável de Ser CEO"
            className={styles.input}
          />

          <label className={styles.label} htmlFor="description">
            Descrição (opcional)
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="Descrição opcional"
            className={styles.textarea}
            rows={2}
          />

          <MultiSelectDropdown
            id="activity-picker"
            label="Atividade (nominees)"
            availableItems={activityLabels}
            selectedItems={selectedActivity}
            onChange={setSelectedActivity}
            multiSelect={false}
            placeholder="Selecionar atividade"
          />
          <input type="hidden" name="activityId" value={selectedActivityId} />

          <button type="submit" className={styles.primaryButton} disabled={!selectedActivityId}>
            Criar sessão
          </button>
        </form>
      </section>

      {idleSessions.length > 0 && (
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Iniciar sessão</h2>
          <form action={startVotingAction} className={styles.form}>
            <MultiSelectDropdown
              id="start-session-picker"
              label="Sessão"
              availableItems={idleSessionLabels}
              selectedItems={selectedIdleSession}
              onChange={setSelectedIdleSession}
              multiSelect={false}
              placeholder="Selecionar sessão"
            />
            <input type="hidden" name="sessionId" value={selectedIdleSessionId} />
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={!selectedIdleSessionId}>
              Iniciar votação
            </button>
          </form>
        </section>
      )}

      {votingSessions.length > 0 && (
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Encerrar sessão</h2>
          <p className={styles.hint}>Isto calcula o vencedor e bloqueia novos votos.</p>
          <form action={finishVotingAction} className={styles.form}>
            <MultiSelectDropdown
              id="finish-session-picker"
              label="Sessão ativa"
              availableItems={votingSessionLabels}
              selectedItems={selectedVotingSession}
              onChange={setSelectedVotingSession}
              multiSelect={false}
              placeholder="Selecionar sessão ativa"
            />
            <input type="hidden" name="sessionId" value={selectedVotingSessionId} />
            <button
              type="submit"
              className={styles.dangerButton}
              disabled={!selectedVotingSessionId}>
              Encerrar e revelar
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
