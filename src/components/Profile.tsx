"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import styles from "@/styles/components/Profile.module.css";
import { FaLock } from "react-icons/fa";
import { User } from "@/types/user";

export default function ProfileClient({ initialUser }: { initialUser: User }) {
  const [user, setUser] = useState<User>(initialUser);
  const [formData, setFormData] = useState<{
    alternativeEmail: string | null;
    phone: string | null;
    preferredContactMethod: string;
  }>({
    alternativeEmail: user?.alternativeEmail ?? "",
    phone: user?.phone ?? "",
    preferredContactMethod: user?.preferredContactMethod ?? "email",
  });
  const [pendingChange, setPendingChange] = useState<{ field: string; value: string } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [altEmailDraft, setAltEmailDraft] = useState(formData.alternativeEmail);
  const [phoneDraft, setPhoneDraft] = useState(formData.phone);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setFormData({
      alternativeEmail: user?.alternativeEmail ?? "",
      phone: user?.phone ?? "",
      preferredContactMethod: user?.preferredContactMethod ?? "email",
    });
  }, [user]);

  useEffect(() => {
    setAltEmailDraft(formData.alternativeEmail ?? "");
    setPhoneDraft(formData.phone ?? "");
  }, [formData.alternativeEmail, formData.phone]);

  const handleBlur = (field: "alternativeEmail" | "phone", value: string) => {
    if (formData[field] !== value) {
      setPendingChange({ field, value });
      setShowConfirmDialog(true);
    }
  };

  const handlePreferredContactChange = (value: string) => {
    if (formData.preferredContactMethod !== value) {
      setPendingChange({ field: "preferredContactMethod", value });
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmChange = async () => {
    if (!pendingChange || !user) return;
    setShowConfirmDialog(false);
    setError("");
    try {
      let value = pendingChange.value.trim();
      if (pendingChange.field === "alternativeEmail" || pendingChange.field === "phone") {
        value = value === "" ? "" : value;
      }
      const updateData: Record<string, string | null> = {
        [pendingChange.field]: value,
      };

      if (pendingChange.field === "alternativeEmail") {
        const res = await fetch("/api/user/verify-email/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            istid: user.istid,
            alternativeEmail: value,
          }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Falha ao enviar email de verificação");
        }
        setError("Verifique o seu email alternativo para concluir a alteração.");
      } else {
        const res = await fetch(`/api/user/update/${user.istid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
          credentials: "include",
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to update");
        }
      }

      const userRes = await fetch("/api/auth/userdata");
      if (userRes.ok) {
        const updatedUser = await userRes.json();
        setUser(updatedUser);
        setFormData({
          alternativeEmail: updatedUser.alternativeEmail ?? "",
          phone: updatedUser.phone ?? "",
          preferredContactMethod: updatedUser.preferredContactMethod ?? "email",
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar perfil.");
    } finally {
      setPendingChange(null);
    }
  };

  const getFieldDisplayName = (field: string) => {
    const fieldNames: Record<string, string> = {
      alternativeEmail: "Email Alternativo",
      phone: "Telefone",
      preferredContactMethod: "Contacto Preferido",
    };
    return fieldNames[field] || field;
  };

  const getValueDisplayName = (field: string, value: string) => {
    if (field === "preferredContactMethod") {
      const contactMethods: Record<string, string> = {
        email: "Email Principal",
        alternativeEmail: "Email Alternativo",
        phone: "Telefone",
      };
      return contactMethods[value] || value;
    }
    return value;
  };

  return (
    <>
      <div className={styles.header}>
        <Image
          src={user?.photo || "/default-profile.png"}
          alt="Profile"
          width={160}
          height={160}
          className={styles.userPhoto}
        />
        <div className={styles.userInfo}>
          <h2 className={styles.name}>{user?.name}</h2>
          <span className={styles.course}>
            {user?.courses && user.courses.length > 0
              ? user.courses.join(", ")
              : "Curso não especificado"}
          </span>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>{user?.istid}</span>
            <span className={styles.badge}>{user?.email || "Não especificado"}</span>
          </div>
          <div className={styles.lockSection}>
            <FaLock />
            <span>Se quiseres alterar alguns destes dados tens de o fazer no fénix.</span>
          </div>
        </div>
      </div>
      <div className={styles.personalData}>
        <h3 className={styles.title}>Dados Pessoais</h3>
        <div className={styles.grid}>
          <div className={styles.field}>
            <div className={styles.label}>Email Alternativo</div>
            <input
              type="email"
              value={altEmailDraft ?? ""}
              onChange={(e) => setAltEmailDraft(e.target.value)}
              onBlur={() => handleBlur("alternativeEmail", altEmailDraft ?? "")}
              className={styles.input}
              placeholder="email@exemplo.com"
            />
            {user?.alternativeEmail && !user?.alternativeEmailVerified && (
              <span style={{ color: "orange", marginLeft: "0.5rem" }}>(por verificar)</span>
            )}
          </div>
          <div className={styles.field}>
            <div className={styles.label}>Telefone</div>
            <input
              type="tel"
              value={phoneDraft ?? ""}
              onChange={(e) => setPhoneDraft(e.target.value)}
              onBlur={() => handleBlur("phone", phoneDraft ?? "")}
              className={styles.input}
              placeholder="+351 xxx xxx xxx"
            />
          </div>
          <div className={styles.field}>
            <div className={styles.label}>Contacto Preferido</div>
            <select
              value={formData.preferredContactMethod}
              onChange={(e) => handlePreferredContactChange(e.target.value)}
              className={styles.input}>
              <option value="email">Email Principal</option>
              {(formData.alternativeEmail || user?.alternativeEmail) && (
                <option value="alternativeEmail">Email Alternativo</option>
              )}
              {(formData.phone || user?.phone) && <option value="phone">Telefone</option>}
            </select>
          </div>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <ConfirmDialog
        open={showConfirmDialog}
        message={
          pendingChange
            ? pendingChange.value === ""
              ? `Deseja remover o método de contacto ${getFieldDisplayName(pendingChange.field)}?`
              : `Deseja guardar a alteração de ${getFieldDisplayName(pendingChange.field)} para "${getValueDisplayName(pendingChange.field, pendingChange.value)}"?`
            : ""
        }
        onConfirm={handleConfirmChange}
        onCancel={() => {
          setShowConfirmDialog(false);
          setPendingChange(null);
        }}
      />
    </>
  );
}
