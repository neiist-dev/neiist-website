"use client";

import { useState, useMemo } from "react";
import { VotingType } from "@/types/voting";
import { CalendarEvent } from "@/types/events";
import { User } from "@/types/user";
import { useRouter } from "next/navigation";
import { createVotingSessionAction } from "@/lib/votingSystem";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import ColorfulText from "@/components/ColorfulText";
import { FiEdit3, FiClock, FiUsers, FiX } from "react-icons/fi";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import tagStyles from "@/styles/components/shop/VariantOptionsEditor.module.css";
import styles from "@/styles/components/voting/admin/VotingSessionForm.module.css";

interface VotingSessionFormProps {
  activities: CalendarEvent[];
  users: User[];
}

function toDateTimeLocalValue(date: Date | string | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

export default function VotingSessionForm({ activities, users }: VotingSessionFormProps) {
  const router = useRouter();
  const [type, setType] = useState<VotingType>("activity");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [selectedNominees, setSelectedNominees] = useState<string[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");

  const activityOptions = useMemo(
    () => activities.map((a) => ({ label: `${a.summary} (${a.id.slice(0, 8)})`, value: a.id })),
    [activities]
  );
  const userOptions = useMemo(
    () => users.map((u) => ({ label: `${u.name} (${u.istid})`, value: u.istid })),
    [users]
  );

  const handleNomineeChange = (labels: string[]) => {
    if (type === "custom") {
      setSelectedNominees(labels);
    } else if (type === "users") {
      const ids = labels
        .map((l) => userOptions.find((o) => o.label === l)?.value)
        .filter(Boolean) as string[];
      setSelectedNominees(ids);
    }
  };

  const handleActivityChange = (labels: string[]) => {
    const id = activityOptions.find((o) => o.label === labels[0])?.value ?? "";
    setSelectedActivityId(id);
    const activity = activities.find((a) => a.id === id);
    if (activity) {
      const start = activity.start.dateTime ?? activity.start.date;
      const end = activity.end.dateTime ?? activity.end.date;
      if (start) setStartAt(toDateTimeLocalValue(start));
      if (end) setEndAt(toDateTimeLocalValue(end));
      setSelectedNominees(activity.subscribers ?? []);
    }
  };

  const handleTypeChange = (newType: VotingType) => {
    setType(newType);
    setSelectedNominees([]);
    setSelectedActivityId("");
    setStartAt("");
    setEndAt("");
  };

  const selectedActivityLabel = useMemo(
    () => activityOptions.find((o) => o.value === selectedActivityId)?.label ?? "",
    [selectedActivityId, activityOptions]
  );

  const selectedUserLabels = useMemo(
    () =>
      selectedNominees
        .map((id) => userOptions.find((o) => o.value === id)?.label)
        .filter(Boolean) as string[],
    [selectedNominees, userOptions]
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => router.push("/voting/manage")}>
          <FaArrowLeft /> Voltar
        </button>
        <ColorfulText as="h2" className={styles.title} text="Nova Sessão" chunk={true} />
        <button type="submit" form="voting-session-form" className={styles.btnPrimary}>
          <FaPlus /> Criar Sessão
        </button>
      </header>

      <form id="voting-session-form" action={createVotingSessionAction} className={styles.grid}>
        <input type="hidden" name="type" value={type} />

        <div className={styles.col}>
          <div className={styles.sectionTitle}>
            <FiEdit3 className={styles.sectionTitleIcon} />
            <span>Informação Básica</span>
          </div>
          <div className={styles.fieldWrap}>
            <label htmlFor="name" className={styles.label}>
              Título
            </label>
            <input
              id="name"
              name="name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Eleições NEIIST"
            />
          </div>
          <div className={styles.fieldWrap}>
            <label htmlFor="description" className={styles.label}>
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional..."
            />
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.sectionTitle}>
            <FiUsers className={styles.sectionTitleIcon} />
            <span>Tipo de Votação</span>
          </div>
          <div className={styles.typeButtonsGroup}>
            {(["activity", "users", "custom"] as const).map((t) => (
              <button
                type="button"
                key={t}
                className={`${styles.typeButton} ${type === t ? styles.typeButtonActive : ""}`}
                onClick={() => handleTypeChange(t)}>
                {t === "activity" ? "Atividade" : t === "users" ? "Utilizadores" : "Customizada"}
              </button>
            ))}
          </div>

          <div className={styles.sectionTitle}>
            <FiUsers className={styles.sectionTitleIcon} />
            <span>{type === "activity" ? "Selecionar Atividade" : "Candidatos / Opções"}</span>
          </div>
          {type === "activity" ? (
            <MultiSelectDropdown
              id="activity-picker"
              availableItems={activityOptions.map((o) => o.label)}
              selectedItems={selectedActivityId ? [selectedActivityLabel] : []}
              onChange={handleActivityChange}
              multiSelect={false}
              placeholder="Procurar atividade..."
            />
          ) : type === "users" ? (
            <MultiSelectDropdown
              id="user-picker"
              availableItems={userOptions.map((o) => o.label)}
              selectedItems={selectedUserLabels}
              onChange={handleNomineeChange}
              multiSelect={true}
              placeholder="Procurar utilizadores..."
            />
          ) : (
            <div className={tagStyles.container}>
              {selectedNominees.map((nominee) => (
                <span key={nominee} className={tagStyles.tag}>
                  {nominee}
                  <button
                    type="button"
                    className={tagStyles.removeButton}
                    onClick={() =>
                      handleNomineeChange(selectedNominees.filter((n) => n !== nominee))
                    }>
                    <FiX />
                  </button>
                </span>
              ))}
              <input
                type="text"
                className={tagStyles.input}
                placeholder="Adicionar opção (Enter)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = e.currentTarget.value.trim();
                    if (val && !selectedNominees.includes(val)) {
                      handleNomineeChange([...selectedNominees, val]);
                      e.currentTarget.value = "";
                    }
                  }
                }}
              />
            </div>
          )}
          <input
            type="hidden"
            name={
              type === "activity"
                ? "activityId"
                : type === "users"
                  ? "customUsers"
                  : "customNominees"
            }
            value={type === "activity" ? selectedActivityId : selectedNominees.join(",")}
          />
          {type === "activity" && (
            <input type="hidden" name="activityNominees" value={selectedNominees.join(",")} />
          )}

          <div className={styles.sectionTitle}>
            <FiClock className={styles.sectionTitleIcon} />
            <span>Período da Votação</span>
          </div>
          <div className={styles.dateGroup}>
            <div className={styles.fieldWrap}>
              <label htmlFor="startAt" className={styles.label}>
                Início
              </label>
              <input
                id="startAt"
                name="startAt"
                type="datetime-local"
                className={styles.input}
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div className={styles.fieldWrap}>
              <label htmlFor="endAt" className={styles.label}>
                Fim
              </label>
              <input
                id="endAt"
                name="endAt"
                type="datetime-local"
                className={styles.input}
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
