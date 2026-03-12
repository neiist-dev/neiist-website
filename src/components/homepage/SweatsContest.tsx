"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import styles from "@/styles/components/homepage/SweatsContest.module.css";
import backgroundImage from "@/assets/background.png";

export default function SweatsContest() {
  const { user } = useUser();
  const [uploading, setUploading] = useState(false);
  const [buttonText, setButtonText] = useState("Submete um design!");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (!user) {
      // TODO: (WARNING) show toast prompting the user to log in before submitting.
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/zip" && file.type !== "application/x-zip-compressed") {
      // TODO: (ERROR)
      setButtonText("Erro: Apenas ficheiros ZIP");
      setTimeout(() => setButtonText("Submete um design!"), 3000);
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // TODO: (LOADING) show loading toast while the design submission is uploading.
      const response = await fetch("/api/user/sweats-contest", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // TODO: (SUCCESS)
        setButtonText("Design submetido");
      } else {
        // TODO: (ERROR)
        setButtonText("Erro ao submeter");
      }
    } catch (error) {
      setButtonText("Erro ao submeter");
      // TODO: (ERROR)
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
