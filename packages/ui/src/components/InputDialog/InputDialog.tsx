import React, { useState, useEffect } from "react";
import { Modal } from "../Modal/Modal";
import { Button } from "../Button/Button";
import { Input } from "../Input/Input";
import { Field } from "../Field/Field";
import { DateInput } from "../Input/DateInput";
import { format, parse } from "date-fns";
import type { Locale } from "date-fns";
import styles from "./InputDialog.module.css";

export interface InputDialogProps {
  open: boolean;
  title: string;
  label?: string;
  hint?: string;
  initialValue?: string;
  placeholder?: string;
  locale?: Locale;
  mobileDrawerTitle?: string;
  type?: React.HTMLInputTypeAttribute;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: (_value: string) => void;
  onCancel: () => void;
}

const REFERENCE_DATE = new Date(0);

export function InputDialog({
  open,
  title,
  label,
  hint,
  initialValue = "",
  placeholder,
  locale,
  mobileDrawerTitle,
  type = "text",
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: InputDialogProps) {
  const [value, setValue] = useState(initialValue);

  // Reset value when dialog opens
  useEffect(() => {
    if (open) {
      setValue(initialValue);
    }
  }, [open, initialValue]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onConfirm(value);
  };

  const inputControl =
    type === "date" ? (
      <DateInput
        value={value ? parse(value, "yyyy-MM-dd", REFERENCE_DATE) : undefined}
        onChange={(date) => setValue(date ? format(date, "yyyy-MM-dd") : "")}
        placeholder={placeholder}
        mobileDrawerTitle={mobileDrawerTitle ?? label ?? title}
        locale={locale!}
      />
    ) : (
      <Input
        type={type}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        autoFocus
      />
    );

  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          {label || hint ? (
            <Field label={label || ""} description={hint}>
              {inputControl}
            </Field>
          ) : (
            inputControl
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
