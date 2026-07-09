"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AdminVotingSync() {
  const router = useRouter();
  const lastUpdatedAtRef = useRef<string | null>(null);

  useEffect(() => {
    const source = new EventSource("/api/voting/sync");

    source.onmessage = (event) => {
      let updatedAt: string | null = null;

      try {
        const parsed = JSON.parse(event.data) as { updatedAt?: string };
        updatedAt = parsed.updatedAt ?? null;
      } catch {
        return;
      }

      // First payload is the current snapshot
      if (lastUpdatedAtRef.current === null) {
        lastUpdatedAtRef.current = updatedAt;
        return;
      }

      if (updatedAt === lastUpdatedAtRef.current) return;

      lastUpdatedAtRef.current = updatedAt;
      router.refresh();
    };

    source.onerror = (error) => {
      console.error("VotingSync SSE Error:", error);
    };

    return () => {
      source.close();
    };
  }, [router]);

  return null;
}
