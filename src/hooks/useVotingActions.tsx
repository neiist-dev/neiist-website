"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { VotingSession } from "@/types/voting";
import {
  startVotingAction,
  finishVotingAction,
  deleteVotingSessionAction,
  togglePublishResultsAction,
} from "@/lib/votingSystem";
import { Alert, ConfirmDialog } from "@neiist/ui";
import type { Dictionary } from "@/i18n/dictionaries";

export type VotingActionType = "start" | "finish" | "delete";

export function useVotingActions(
  dict: Dictionary["voting_management"],
  options?: { onDeleted?: () => void }
) {
  const router = useRouter();
  const [target, setTarget] = useState<{ type: VotingActionType; session: VotingSession } | null>(
    null
  );

  const togglePublish = async (session: VotingSession) => {
    try {
      const nextState = !session.showResults;
      const formData = new FormData();
      formData.append("sessionId", String(session.id));
      formData.append("showResults", String(nextState));
      await togglePublishResultsAction(formData);
      Alert.success(nextState ? dict.details.publish_success : dict.details.hide_success);
      router.refresh();
    } catch (err) {
      Alert.error(err instanceof Error ? err.message : dict.details.toggle_publish_error);
    }
  };

  const handleConfirm = async () => {
    if (!target) return;
    const { type, session } = target;
    setTarget(null);

    const formData = new FormData();
    formData.append("sessionId", String(session.id));

    try {
      if (type === "start") {
        await startVotingAction(formData);
        Alert.success(dict.details.start_success);
      } else if (type === "finish") {
        await finishVotingAction(formData);
        Alert.success(dict.details.finish_success);
      } else {
        await deleteVotingSessionAction(formData);
        Alert.success(dict.details.delete_success);
        options?.onDeleted?.();
      }
      router.refresh();
    } catch (err) {
      Alert.error(
        err instanceof Error ? err.message : dict.details[`${type}_error`] || "Erro na operação"
      );
    }
  };

  const exportExcel = (sessionId: number) => {
    window.location.href = `/api/voting/${sessionId}/export`;
  };

  const dialog = target ? (
    <ConfirmDialog
      open
      title={dict.details[`${target.type}_action`]}
      message={dict.details[`confirm_${target.type}`]}
      confirmLabel={dict.details.confirm_yes}
      cancelLabel={dict.details.confirm_cancel}
      isDestructive={target.type === "delete"}
      onConfirm={handleConfirm}
      onCancel={() => setTarget(null)}
    />
  ) : null;

  return {
    confirm: (type: VotingActionType, session: VotingSession) => setTarget({ type, session }),
    togglePublish,
    exportExcel,
    dialog,
  };
}
