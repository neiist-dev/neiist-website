"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button } from "@neiist/ui";
import { useSumUpBridgeReturn } from "@/hooks/shop/pos/useSumUpBridgeReturn";
import type { Dictionary } from "@/i18n/dictionaries";
import type { SumUpBridgeRelayJob } from "@/types/shop/sumup";
import { formatMoney } from "@/utils/shop/moneyUtils";
import votingStyles from "@/styles/pages/VotingPage.module.css";
import styles from "@/styles/components/shop/pos/MobileTpaClient.module.css";

interface MobileTpaClientProps {
  dict: Dictionary["pos"]["mobile_tpa"];
}

export default function MobileTpaClient({ dict }: MobileTpaClientProps) {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [activeJob, setActiveJob] = useState<SumUpBridgeRelayJob | null>(null);

  useSumUpBridgeReturn({
    successMessage: dict.paid_toast,
    failedMessage: dict.failed_toast,
  });

  useEffect(() => {
    const es = new EventSource(
      `/api/shop/sumup/bridge/stream?sessionId=${encodeURIComponent(sessionId)}`
    );

    const onJob = (event: MessageEvent) => {
      try {
        const job = JSON.parse(event.data) as SumUpBridgeRelayJob;
        if (job.status === "pending") {
          setActiveJob(job);
        }
      } catch {
        // ignore malformed event
      }
    };

    const onJobUpdated = (event: MessageEvent) => {
      try {
        const job = JSON.parse(event.data) as SumUpBridgeRelayJob;
        if (job.status === "paid") {
          Alert.success(dict.paid_toast.replace("{number}", job.orderNumber));
          setActiveJob(null);
        } else if (job.status === "failed") {
          Alert.error(job.message || dict.failed_toast);
          setActiveJob(null);
        }
      } catch {
        // ignore
      }
    };

    const onJobCancelled = () => {
      setActiveJob(null);
    };

    es.addEventListener("job", onJob);
    es.addEventListener("job_updated", onJobUpdated);
    es.addEventListener("job_cancelled", onJobCancelled);

    return () => {
      es.removeEventListener("job", onJob);
      es.removeEventListener("job_updated", onJobUpdated);
      es.removeEventListener("job_cancelled", onJobCancelled);
      es.close();
    };
  }, [dict.failed_toast, dict.paid_toast, sessionId]);

  const handleCancelJob = useCallback(() => {
    if (!activeJob) return;
    setActiveJob(null);
    void fetch(`/api/shop/sumup/readers/${sessionId}/checkout`, {
      method: "DELETE",
    }).catch(() => undefined);
  }, [activeJob, sessionId]);

  if (activeJob) {
    return (
      <div className={votingStyles.waitingPage}>
        <h1 className={votingStyles.waitingTitle}>
          {dict.ready_title_prefix} <span>{dict.ready_title_highlight}</span>
        </h1>
        <div className={styles.actionCard}>
          <span className={styles.orderMeta}>{activeJob.description}</span>
          <span className={styles.amountDisplay}>{formatMoney(activeJob.amount)}</span>
          <Button
            type="button"
            variant="primary"
            className={styles.chargeButton}
            onClick={() => {
              window.location.href = activeJob.deepLinkUrl;
            }}>
            {dict.charge_button.replace("{amount}", formatMoney(activeJob.amount))}
          </Button>
          <Button type="button" variant="outline" onClick={handleCancelJob}>
            {dict.dismiss_button}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={votingStyles.waitingPage}>
      <h1 className={votingStyles.waitingTitle}>
        {dict.waiting_title_prefix}
        <br />
        <span>{dict.waiting_title_highlight}</span>
      </h1>
      <p className={votingStyles.waitingSubtitle}>{dict.waiting_subtitle}</p>
      <div className={votingStyles.waitingDots}>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
