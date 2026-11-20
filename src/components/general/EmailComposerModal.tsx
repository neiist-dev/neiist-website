"use client";

import React, { useState } from "react";
import { Modal, Button, Alert } from "@neiist/ui";
import { FaPaperPlane } from "react-icons/fa";
import EmailComposer from "@/components/general/EmailComposer";
import type { EmailVariableDefinition } from "@/lib/email/baseEmail";
import styles from "@/styles/components/general/EmailComposer.module.css";
import modalStyles from "@/styles/components/general/EmailComposerModal.module.css";

export interface EmailComposerModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  recipientCount: number;
  initialSubject?: string;
  initialBody?: string;
  variables?: EmailVariableDefinition[];
  sampleData?: Record<string, string>;
  onSend: (_data: { subject: string; body: string }) => Promise<void>;
  submitLabel?: string;
}

export default function EmailComposerModal({
  open,
  onClose,
  title,
  recipientCount,
  initialSubject = "",
  initialBody = "",
  variables = [],
  sampleData = {},
  onSend,
  submitLabel = "Enviar Email",
}: EmailComposerModalProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      Alert.error("O assunto do email é obrigatório");
      return;
    }
    if (!body.trim()) {
      Alert.error("O corpo do email é obrigatório");
      return;
    }

    setIsSending(true);
    try {
      await onSend({ subject: subject.trim(), body: body.trim() });
      onClose();
    } catch (err) {
      console.error("Failed to send email:", err);
      Alert.error(err instanceof Error ? err.message : "Erro ao enviar email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={title}>
      <form onSubmit={handleSubmit} className={styles.container}>
        <div className={styles.variablesHint}>
          Destinatários: <strong>{recipientCount}</strong> selecionado(s)
        </div>

        <EmailComposer
          subject={subject}
          onSubjectChange={setSubject}
          body={body}
          onBodyChange={setBody}
          variables={variables}
          sampleData={sampleData}
          sectionTitle=""
        />

        <div className={modalStyles.actions}>
          <Button
            type="button"
            variant="ghost"
            color="neutral"
            size="md"
            onClick={onClose}
            disabled={isSending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="solid"
            color="primary"
            size="md"
            loading={isSending}
            disabled={isSending || !subject.trim() || !body.trim()}>
            <FaPaperPlane size={14} />
            <span>{isSending ? "A enviar..." : `${submitLabel} (${recipientCount})`}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
