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
}

const CreateNewUserModal: React.FC<CreateNewUserModalProps> = ({
  onClose,
  onSubmit,
  initialIstId = "",
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
      setError("Por favor, preencha todos os campos.");
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
        throw new Error(errorData.error || "Failed to create user");
      }

      const newUser = await response.json();
      onSubmit?.(newUser);
      onClose();
    } catch (error) {
      console.error("Error creating user:", error);
      setError(error instanceof Error ? error.message : "Failed to create user");
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

        <h2>Novo Utilizador</h2>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleConfirm}>
          <div className={styles.formGroup}>
            <label>IST ID</label>
            <input
              type="text"
              placeholder="ist1119999"
              value={istId}
              onChange={(e) => setIstId(e.target.value)}
              className={styles.input}
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Nome</label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              placeholder="john.doe@tecnico.ulisboa.pt"
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
              Cancelar
            </button>
            <button className={styles.buttonSubmit} disabled={isSubmitting} type="submit">
              {isSubmitting ? "A criar..." : "Guardar"}
            </button>
          </div>
        </form>
        {showConfirm && (
          <ConfirmDialog
            open={showConfirm}
            message={`Tem a certeza que deseja criar o utilizador ${name}?`}
            onConfirm={async () => {
              setShowConfirm(false);
              await handleSubmit();
            }}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default CreateNewUserModal;
