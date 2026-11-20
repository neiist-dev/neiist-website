"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { VotingSyncPayload, VOTING_SYNC_EVENT_TYPES } from "@/types/voting";

export default function AdminVotingSync() {
  const router = useRouter();
  const lastUpdatedAtRef = useRef<string | null>(null);

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const source = new EventSource("/api/voting/sync");

    source.onmessage = (event) => {
      let parsed: VotingSyncPayload;
      try {
        parsed = JSON.parse(event.data) as VotingSyncPayload;
      } catch {
        return;
      }

      const updatedAt = parsed.updatedAt ?? null;

      if (lastUpdatedAtRef.current === null) {
        lastUpdatedAtRef.current = updatedAt;
        return;
      }

      if (updatedAt === lastUpdatedAtRef.current) return;
      lastUpdatedAtRef.current = updatedAt;

      if (parsed.type === VOTING_SYNC_EVENT_TYPES.STATE_UPDATE) {
        if (refreshTimer) {
          clearTimeout(refreshTimer);
          refreshTimer = null;
        }
        router.refresh();
      } else if (!refreshTimer) {
        refreshTimer = setTimeout(() => {
          refreshTimer = null;
          router.refresh();
        }, 400);
      }
    };

    source.onerror = (error) => {
      console.error("VotingSync SSE Error:", error);
    };

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      source.close();
    };
  }, [router]);

  return null;
}
