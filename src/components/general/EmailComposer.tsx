"use client";

import React, { useMemo } from "react";
import { Field, Input, Textarea } from "@neiist/ui";
import { FaEnvelope, FaEye } from "react-icons/fa";
import { EmailVariableDefinition, renderEmailMarkdownToHtml } from "@/lib/email/baseEmail";
import styles from "@/styles/components/general/EmailComposer.module.css";

export interface EmailComposerProps {
  subject: string;
  onSubjectChange: (_value: string) => void;
  body: string;
  onBodyChange: (_value: string) => void;
  variables?: EmailVariableDefinition[];
  subjectLabel?: string;
  subjectPlaceholder?: string;
  bodyLabel?: string;
  bodyPlaceholder?: string;
  sectionTitle?: string;
  previewTitle?: string;
  variablesHintLabel?: string;
  sampleData?: Record<string, string>;
  className?: string;
}

export default function EmailComposer({
  subject,
  onSubjectChange,
  body,
  onBodyChange,
  variables = [],
  subjectLabel = "Assunto do email",
  subjectPlaceholder = "Escreve o assunto do email...",
  bodyLabel = "Corpo do Email",
  bodyPlaceholder = "Escreve o corpo do email em Markdown...",
  sectionTitle = "Email a Enviar",
  previewTitle = "Pré-visualização",
  variablesHintLabel = "Variáveis:",
  sampleData = {},
  className = "",
}: EmailComposerProps) {
  const previewVariables = useMemo(() => {
    const base: Record<string, string> = {};
    for (const v of variables) {
      base[v.key] = sampleData[v.key] ?? v.sampleValue;
    }
    return { ...base, ...sampleData };
  }, [variables, sampleData]);

  const previewHtml = useMemo(() => {
    return renderEmailMarkdownToHtml(body, previewVariables);
  }, [body, previewVariables]);

  return (
    <div className={`${styles.container} ${className}`}>
      {sectionTitle && (
        <div className={styles.sectionHeader}>
          <FaEnvelope className={styles.sectionIcon} />
          <span>{sectionTitle}</span>
        </div>
      )}

      <Field label={subjectLabel}>
        <Input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder={subjectPlaceholder}
          required
        />
      </Field>

      <Field label={bodyLabel}>
        <Textarea
          rows={8}
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder={bodyPlaceholder}
          required
        />
      </Field>

      {variables.length > 0 && (
        <span className={styles.variablesHint}>
          {variablesHintLabel} {variables.map((variable) => `{{${variable.key}}}`).join(", ")}.
        </span>
      )}

      {previewTitle && (
        <div className={styles.previewContainer}>
          <div className={styles.sectionHeader}>
            <FaEye className={styles.sectionIcon} />
            <span>{previewTitle}</span>
          </div>

          <article
            className={styles.previewEmail}
            // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml -- safe: generated with strict HTML escaping
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      )}
    </div>
  );
}
