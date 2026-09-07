"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../Modal/Modal";
import { Button } from "../Button/Button";
import { Field } from "../Field/Field";
import { DateInput } from "../Input/DateInput";
import { format, parse, isValid } from "date-fns";
import { pt } from "date-fns/locale";
import type { Locale } from "date-fns";
import styles from "./InputDateDialog.module.css";

export interface InputDateDialogProps {
  open: boolean;
  title: string;
  label?: string;
  hint?: string;
  initialValue?: string | Date | null;
  placeholder?: string;
  locale?: Locale;
  dateFormat?: string;
  mobileDrawerTitle?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (_value: string | null, _date?: Date) => void;
  onCancel: () => void;
}

const REFERENCE_DATE = new Date(0);

function parseDateValue(val?: string | Date | null, dateFormat = "dd/MM/yyyy"): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) {
    return isValid(val) ? val : undefined;
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return undefined;

    // Try standard yyyy-MM-dd
    const d1 = parse(trimmed, "yyyy-MM-dd", REFERENCE_DATE);
    if (isValid(d1)) return d1;

    // Try custom or locale dateFormat
    const d2 = parse(trimmed, dateFormat, REFERENCE_DATE);
    if (isValid(d2)) return d2;

    // Try native ISO Date constructor
    const d3 = new Date(trimmed);
    if (isValid(d3)) return d3;
  }
  return undefined;
}

export function InputDateDialog({
  open,
  title,
  label,
  hint,
  initialValue,
  placeholder = "DD/MM/AAAA",
  locale = pt,
  dateFormat = "dd/MM/yyyy",
  mobileDrawerTitle,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: InputDateDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() =>
    parseDateValue(initialValue, dateFormat)
  );

  useEffect(() => {
    if (open) {
      setSelectedDate(parseDateValue(initialValue, dateFormat));
    }
  }, [open, initialValue, dateFormat]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedDate && isValid(selectedDate)) {
      onConfirm(format(selectedDate, "yyyy-MM-dd"), selectedDate);
    } else {
      onConfirm(null, undefined);
    }
  };

  const dateControl = (
    <DateInput
      value={selectedDate}
      onChange={setSelectedDate}
      placeholder={placeholder}
      locale={locale}
      dateFormat={dateFormat}
      mobileDrawerTitle={mobileDrawerTitle ?? label ?? title}
    />
  );

  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          {label || hint ? (
            <Field label={label || ""} description={hint}>
              {dateControl}
            </Field>
          ) : (
            dateControl
          )}
        </div>
        <footer className={styles.actionGroup}>
          <Button variant="ghost" type="button" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="solid" color="primary" type="submit">
            {confirmLabel}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
