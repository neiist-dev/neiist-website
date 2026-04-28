"use client";

import React, { useState, useEffect } from "react";
import styles from "@/styles/components/shop/CreateNewUserModal.module.css";
import { MdClose } from "react-icons/md";
import type { User } from "@/types/user";
import ConfirmDialog from "@/components/layout/ConfirmDialog";

interface CreateNewUserModalProps {
  onClose: () => void;
  onSubmit?: (_user: User) => void;
  initialIstId?: string;
  dict: {
    title: string;
    ist_id_label: string;
    ist_id_placeholder: string;
    name_label: string;
    name_placeholder: string;
    email_label: string;
    email_placeholder: string;
    cancel: string;
    submitting: string;
    submit: string;
    confirm_message_1: string;
    confirm_message_2: string;
    error_required: string;
    error_create: string;
  };
  confirm_dialog: {
    title: string;
    confirm: string;
    cancel: string;
  };
}

const CreateNewUserModal: React.FC<CreateNewUserModalProps> = ({
  onClose,
  onSubmit,
  initialIstId = "",
  dict,
  confirm_dialog
}) => {
  const [istId, setIstId] = useState(initialIstId);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!istId || !name || !email) {
      // TODO: (ERROR)
      setError(dict.error_required);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          istid: istId,
          name,
          email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || dict.error_create);
      }

      const newUser = await response.json();
      onSubmit?.(newUser);
      // TODO: (SUCCESS) show success toast after the new user is created.
      onClose();
    } catch (error) {
      console.error("Error creating user:", error);
      // TODO: (ERROR)
      setError(error instanceof Error ? error.message : dict.error_create);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          <MdClose size={20} />
        </button>

        <h2>{dict.title}</h2>

        {/* TODO: replace this inline error with a toast and remove this fallback once Sonner is implemented here. */}
        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleConfirm}>
          <div className={styles.formGroup}>
            <label>{dict.ist_id_label}</label>
            <input
              type="text"
              placeholder={dict.ist_id_placeholder}
              value={istId}
              onChange={(e) => setIstId(e.target.value)}
              className={styles.input}
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label>{dict.name_label}</label>
            <input
              type="text"
              placeholder={dict.name_placeholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label>{dict.email_label}</label>
            <input
              type="email"
              placeholder={dict.email_placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.buttonRow}>
            <button
              className={styles.buttonCancel}
              onClick={onClose}
              disabled={isSubmitting}
              type="button">
              {dict.cancel}
            </button>
            <button className={styles.buttonSubmit} disabled={isSubmitting} type="submit">
              {isSubmitting ? dict.submitting : dict.submit}
            </button>
          </div>
        </form>
        {showConfirm && (
          <ConfirmDialog
            open={showConfirm}
            message={`${dict.confirm_message_1} ${name} ${dict.confirm_message_2}`}
            onConfirm={async () => {
              setShowConfirm(false);
              await handleSubmit();
            }}
            onCancel={() => setShowConfirm(false)}
            dict={confirm_dialog}
          />
        )}
      </div>
    </div>
  );
};

export default CreateNewUserModal;
