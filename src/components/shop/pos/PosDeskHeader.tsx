"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { LuQrCode } from "react-icons/lu";
import { Button, Modal, Select, Tooltip, ColorfulText, Stack, Text } from "@neiist/ui";
import { usePosSession } from "@/hooks/shop/pos/usePosSession";
import { generateTicketDataUri } from "@/lib/ticketCode";
import { ENABLE_SUMUP_MOBILE_BRIDGE } from "@/types/shop/sumup";
import { isMobileDevice } from "@/utils/shop/posUtils";
import styles from "@/styles/components/shop/pos/PosDeskHeader.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface PosDeskHeaderProps {
  title: string;
  subtitle: string;
  session?: ReturnType<typeof usePosSession>;
  dict: Dictionary["pos"];
}

export default function PosDeskHeader({ title, subtitle, session, dict }: PosDeskHeaderProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (ENABLE_SUMUP_MOBILE_BRIDGE) {
      setIsDesktop(!isMobileDevice());
    }
  }, []);

  const mobileTpaUrl = useMemo(() => {
    if (!qrOpen || typeof window === "undefined") return "";
    const locale = window.location.pathname.split("/").filter(Boolean)[0] || "pt";
    return `${window.location.origin}/${locale}/shop/pos/mobile-tpa`;
  }, [qrOpen]);

  const qrDataUri = useMemo(() => {
    if (!mobileTpaUrl) return "";
    try {
      return generateTicketDataUri(mobileTpaUrl, 240);
    } catch {
      return "";
    }
  }, [mobileTpaUrl]);

  return (
    <header className={styles.header}>
      <Stack direction="column" gap="none">
        <ColorfulText as="h1" className={styles.title} text={title} />
        <Text variant="muted">{subtitle}</Text>
      </Stack>

      {session && session.activeShift && (
        <div className={styles.stationRow}>
          <Tooltip
            content={session.stationTooltipText}
            position="bottom"
            className={styles.stationTooltip}>
            <div className={styles.stationSelectWrap}>
              <Select
                value={session.selectedStationId}
                onChange={(val) => session.handleSelectStation(String(val))}
                options={session.availableModalStations.map((s) => ({
                  label: s.name,
                  value: s.id,
                }))}
              />
            </div>
          </Tooltip>

          {ENABLE_SUMUP_MOBILE_BRIDGE && isDesktop && (
            <Button size="sm" variant="outline" onClick={() => setQrOpen(true)}>
              <LuQrCode size={16} />
              {dict.desk.mobile_tpa_button}
            </Button>
          )}

          <Button size="sm" variant="danger" onClick={() => session.setIsCloseModalOpen(true)}>
            {dict.desk.close_shift}
          </Button>
        </div>
      )}

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} size="sm">
        <Modal.Header title={dict.desk.mobile_tpa_modal_title} onClose={() => setQrOpen(false)} />
        <Modal.Body>
          <Stack direction="column" gap="md" align="center">
            <Text size="sm" variant="muted" style={{ textAlign: "center" }}>
              {dict.desk.mobile_tpa_modal_subtitle}
            </Text>
            {qrDataUri && (
              <Image src={qrDataUri} alt={mobileTpaUrl} width={240} height={240} unoptimized />
            )}
            <Text size="sm" variant="muted" style={{ textAlign: "center" }}>
              {mobileTpaUrl}
            </Text>
          </Stack>
        </Modal.Body>
      </Modal>
    </header>
  );
}
