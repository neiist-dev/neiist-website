"use client";

import React from "react";
import { FiLock } from "react-icons/fi";
import { Button, Field, Select, Stack, Spinner, EmptyState, InputDialog } from "@neiist/ui";
import { PosStation } from "@/types/shop/pos";
import { usePosSession } from "@/hooks/shop/pos/usePosSession";
import PosDeskHeader from "@/components/shop/pos/PosDeskHeader";
import styles from "@/styles/components/shop/pos/PosDesk.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface PosDeskGuardProps {
  canAccessPos: boolean;
  session: ReturnType<typeof usePosSession>;
  stations: PosStation[];
  title?: string;
  subtitle?: string;
  dict: Dictionary["pos"];
}

export default function PosDeskGuard({
  canAccessPos,
  session,
  stations,
  title,
  subtitle,
  dict,
}: PosDeskGuardProps): React.ReactElement | null {
  const displayTitle = title ?? dict.desk.identified_title;
  const displaySubtitle = subtitle ?? dict.desk.identified_subtitle;

  const renderBarrier = (node: React.ReactNode) => (
    <div className={styles.root}>
      <PosDeskHeader title={displayTitle} subtitle={displaySubtitle} dict={dict} />
      <div className={styles.guardWrapper}>{node}</div>
    </div>
  );

  if (!canAccessPos)
    return renderBarrier(
      <EmptyState
        icon={<FiLock />}
        title={dict.guard.blocked_heading}
        description={dict.guard.blocked_body}
      />
    );

  if (!session.hasCheckedAllStations)
    return renderBarrier(<EmptyState icon={<Spinner />} title={dict.guard.checking} />);

  if (!session.stationSelectionConfirmed) {
    return renderBarrier(
      <EmptyState
        title={dict.guard.select_heading}
        description={dict.guard.select_body}
        action={
          <Stack direction="column" gap="md" className={styles.stationFormCard}>
            <Field label={dict.guard.station_label}>
              <Select
                value={session.selectedStationId}
                onChange={(val) => session.handleSelectStation(String(val))}
                options={session.availableModalStations.map((s) => ({
                  label: `${s.name} (${s.location})`,
                  value: s.id,
                }))}
              />
            </Field>
            <Button variant="primary" fullWidth onClick={session.confirmStationSelection}>
              OK
            </Button>
          </Stack>
        }
      />
    );
  }

  if (!session.activeShift && !session.shiftLoading) {
    return (
      <>
        {renderBarrier(
          <EmptyState
            icon={<FiLock />}
            title={dict.guard.closed_heading}
            description={dict.guard.closed_body.replace(
              "{station}",
              session.selectedStation?.name || dict.guard.station_label
            )}
            action={
              <Stack direction="row" gap="sm" justify="center">
                {stations.length > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => session.setStationSelectionConfirmed(false)}>
                    {dict.guard.switch_station}
                  </Button>
                )}
                <Button variant="primary" onClick={() => session.setIsOpenModalOpen(true)}>
                  {dict.guard.open_shift}
                </Button>
              </Stack>
            }
          />
        )}

        <InputDialog
          open={session.isOpenModalOpen}
          title={dict.shift.open_title}
          label={dict.shift.initial_float_input_label}
          hint={dict.shift.open_body.replace(
            "{station}",
            session.selectedStation?.name || dict.shift.station_operator_label
          )}
          type="number"
          initialValue=""
          placeholder={dict.shift.initial_float_placeholder}
          confirmLabel={dict.shift.confirm_open}
          cancelLabel={dict.shift.cancel}
          onConfirm={(val) => void session.handleOpenShift(val)}
          onCancel={() => session.setIsOpenModalOpen(false)}
        />
      </>
    );
  }

  return null;
}
