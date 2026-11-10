"use client";

import React from "react";
import { Button, Select, Tooltip, ColorfulText, Stack, Text } from "@neiist/ui";
import { usePosSession } from "@/hooks/shop/pos/usePosSession";
import styles from "@/styles/components/shop/pos/PosDeskHeader.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface PosDeskHeaderProps {
  title: string;
  subtitle: string;
  session?: ReturnType<typeof usePosSession>;
  dict: Dictionary["pos"];
}

export default function PosDeskHeader({ title, subtitle, session, dict }: PosDeskHeaderProps) {
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

          <Button size="sm" variant="danger" onClick={() => session.setIsCloseModalOpen(true)}>
            {dict.desk.close_shift}
          </Button>
        </div>
      )}
    </header>
  );
}
