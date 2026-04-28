"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import styles from "@/styles/components/homepage/SweatsContest.module.css";
import backgroundImage from "@/assets/background.png";

export default function SweatsContest({ dict }: { 
  dict: {
    title: string;
    description_start: string;
    description_consult: string;
    description_link: string;
    description_end: string;
    button: string;
    uploading: string;
    submitted: string;
    login_warning: string;
    errors: { 
      zip_only: string; 
      upload: string };
  }
}) {
  const { user } = useUser();
  const [uploading, setUploading] = useState(false);
  const [buttonText, setButtonText] = useState(dict.button);
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
      setButtonText(dict.errors.zip_only);
      setTimeout(() => setButtonText(dict.button), 3000);
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
        setButtonText(dict.submitted);
      } else {
        // TODO: (ERROR)
        setButtonText(dict.errors.upload);
      }
    } catch (error) {
      setButtonText(dict.errors.upload);
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
      <h3 className={styles.title}>{dict.title}</h3>
      <p className={styles.descprition}>
        {dict.description_start}
        <br />
        {dict.description_consult}{" "}
        <Link
          className={styles.link}
          href="/regulamento_sweats_concurso.pdf"
          target="_blank"
          rel="noopener noreferrer">
          {dict.description_link}
        </Link>{" "}
        {dict.description_end}
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
        {uploading ? dict.uploading : buttonText}
      </button>
      {!user && <p className={styles.loginWarning}>{dict.login_warning}</p>}
    </div>
  );
}
