"use client";

import React from "react";
import { Button, Card, Field, Input, Modal, Stack, Text } from "@neiist/ui";
import type { PosShift } from "@/types/shop/pos";
import { formatMoney } from "@/utils/shop/moneyUtils";
import { formatShiftOpenedAt } from "@/utils/shop/posUtils";
import type { Dictionary } from "@/i18n/dictionaries";

interface PosShiftCloseModalProps {
  open: boolean;
  activeShift: PosShift | null;
  selectedStationName?: string;
  countedCashInput: string;
  onCountedChange: (_v: string) => void;
  closing: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dict: Dictionary["pos"]["shift"];
}

export default function PosShiftCloseModal({
  open,
  activeShift,
  selectedStationName,
  countedCashInput,
  onCountedChange,
  closing,
  onClose,
  onConfirm,
  dict,
}: PosShiftCloseModalProps) {
  if (!open || !activeShift) return null;

  const stationName = selectedStationName || activeShift.station_name;

  return (
    <Modal open={open} onClose={onClose} size="md">
      <Modal.Header title={dict.close_title} onClose={onClose} />
      <Modal.Body>
        <Stack direction="column" gap="md">
          <Card variant="flat">
            <Card.Body>
              <Stack direction="column" gap="sm">
                <Stack direction="row" justify="between" align="center">
                  <Text size="sm" variant="muted">
                    {dict.opening_label}
                  </Text>
                  <strong>{formatShiftOpenedAt(activeShift.opened_at, dict)}</strong>
                </Stack>
                <Stack direction="row" justify="between" align="center">
                  <Text size="sm" variant="muted">
                    {dict.initial_float_label}
                  </Text>
                  <strong>{formatMoney(activeShift.initial_float || 0)}</strong>
                </Stack>
                <Stack direction="row" justify="between" align="center">
                  <Text size="sm" variant="muted">
                    {dict.station_operator_label}
                  </Text>
                  <strong>
                    {stationName} ({activeShift.opened_by_name})
                  </strong>
                </Stack>
              </Stack>
            </Card.Body>
          </Card>

          <Field label={dict.counted_cash_label}>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder={dict.counted_cash_placeholder}
              value={countedCashInput}
              onChange={(e) => onCountedChange(e.target.value)}
              autoFocus
              required
            />
          </Field>
        </Stack>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline" onClick={onClose} disabled={closing}>
          {dict.cancel}
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={closing || !countedCashInput.trim()}>
          {closing ? dict.closing : dict.confirm_close}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
