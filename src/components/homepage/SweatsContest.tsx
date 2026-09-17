"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import styles from "@/styles/components/homepage/SweatsContest.module.css";
import backgroundImage from "@/assets/background.png";
import type { Dictionary } from "@/i18n/dictionaries";
import { toast } from "sonner"

interface SweatsContestProps {
  dict: Dictionary["sweats_contest"];
}

export default function SweatsContest({ dict }: SweatsContestProps) {
  const { user } = useUser();
  const [uploading, setUploading] = useState(false);
  const [buttonText, setButtonText] = useState("Submete um design!");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (!user) {
      toast.warning(dict.login_warning, 
        { closeButton: true });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/zip" && file.type !== "application/x-zip-compressed") {
      toast.error(dict.errors.zip_only, 
        { closeButton: true });
      setButtonText("Erro: Apenas ficheiros ZIP");
      setTimeout(() => setButtonText("Submete um design!"), 3000);
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    let toastId: string | number = "";
    try {
      toastId = toast.loading(dict.uploading);
      const response = await fetch("/api/user/sweats-contest", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success(dict.submitted, 
          { closeButton: true });
        setButtonText("Design submetido");
      } else {
        toast.error(dict.errors.upload, 
          { closeButton: true });
        setButtonText("Erro ao submeter");
      }
    } catch (error) {
      setButtonText("Erro ao submeter");
      toast.error(dict.errors.upload, 
        { closeButton: true });
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={styles.container} style={{ backgroundImage: `url(${backgroundImage.src})` }}>
      <h3 className={styles.title}>Concurso de Design de Sweats</h3>
      <p className={styles.descprition}>
        Queres criar a próxima sweat especial de EIC?
        <br />
        Consulta{" "}
        <Link
          className={styles.link}
          href="/regulamento_sweats_concurso.pdf"
          target="_blank"
          rel="noopener noreferrer">
          aqui
        </Link>{" "}
        o regulamento, submete o teu design e habilita-te a ganhar uma sweat!
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <button
        onClick={handleButtonClick}
        disabled={uploading || !user}
        className={`${styles.apply} ${!user || uploading ? styles.disabled : ""}`}>
        {uploading ? "A submeter..." : buttonText}
      </button>
      {!user && <p className={styles.loginWarning}>Por favor faça login para submeter um design</p>}
    </div>
  );
}
