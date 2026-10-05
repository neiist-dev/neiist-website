"use client";

import React, { useState } from "react";
import type { User } from "@/types/user";
import { Modal, Field, Input, Button, ConfirmDialog } from "@neiist/ui";
import { toast } from "sonner";
import styles from "@/styles/components/shop/CreateNewUserModal.module.css";

export interface CreateNewUserModalDict {
  title?: string;
  istid_label?: string;
  name_label?: string;
  email_label?: string;
  fill_all_fields?: string;
  user_created_success?: string;
  user_create_error?: string;
  cancel?: string;
  submit?: string;
  submitting?: string;
  confirm_title?: string;
  confirm_message?: string;
}

export interface CreateNewUserModalProps {
  onClose: () => void;
  onSubmit?: (_user: User) => void;
  initialIstId?: string;
  dict?: CreateNewUserModalDict;
}

export default function CreateNewUserModal({
  onClose,
  onSubmit,
  initialIstId = "",
  dict,
}: CreateNewUserModalProps) {
  const [istId, setIstId] = useState(initialIstId);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const tTitle = dict?.title || "Novo Utilizador";
  const tIstid = dict?.istid_label || "IST ID";
  const tName = dict?.name_label || "Nome";
  const tEmail = dict?.email_label || "Email";
  const tCancel = dict?.cancel || "Cancelar";
  const tSubmit = dict?.submit || "Guardar";
  const tSubmitting = dict?.submitting || "A criar...";
  const tConfirmTitle = dict?.confirm_title || "Criar Utilizador";
  const tConfirmMsg =
    dict?.confirm_message?.replace("{name}", name) ||
    `Tem a certeza que deseja criar o utilizador ${name}?`;
  const tFillFields = dict?.fill_all_fields || "Por favor, preencha todos os campos.";
  const tCreated = dict?.user_created_success || `Utilizador ${name.trim()} criado com sucesso.`;
  const tError = dict?.user_create_error || "Erro ao criar utilizador";

  const handleSubmit = async () => {
    if (!istId.trim() || !name.trim() || !email.trim()) {
      toast.error(tFillFields);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          istid: istId.trim(),
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || tError);
      }

      toast.success(tCreated);
      onSubmit?.(data);
      onClose();
    } catch (err: unknown) {
      console.error("Error creating user:", err);
      toast.error(err instanceof Error ? err.message : tError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!istId.trim() || !name.trim() || !email.trim()) {
      toast.error(tFillFields);
      return;
    }
    setShowConfirm(true);
  };

  return (
    <>
      <Modal open onClose={onClose} title={tTitle} size="sm">
        <form onSubmit={handleConfirm} className={styles.form}>
          <Field label={tIstid}>
            <Input
              type="text"
              placeholder="ist1119999"
              value={istId}
              onChange={(e) => setIstId(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </Field>

          <Field label={tName}>
            <Input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </Field>

          <Field label={tEmail}>
            <Input
              type="email"
              placeholder="john.doe@tecnico.ulisboa.pt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </Field>

          <div className={styles.actions}>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} type="button">
              {tCancel}
            </Button>
            <Button variant="solid" color="primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? tSubmitting : tSubmit}
            </Button>
          </div>
        </form>
      </Modal>

      {showConfirm && (
        <ConfirmDialog
          open={showConfirm}
          title={tConfirmTitle}
          message={tConfirmMsg}
          confirmLabel={tSubmit}
          cancelLabel={tCancel}
          onConfirm={async () => {
            setShowConfirm(false);
            await handleSubmit();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
