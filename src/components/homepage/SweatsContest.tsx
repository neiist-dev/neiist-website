"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import styles from "@/styles/components/homepage/SweatsContest.module.css";
import CloudAnnouncement from "@/components/homepage/CloudAnnouncement";
import { Alert, Button, Checkbox, Modal } from "@neiist/ui";
import { Dictionary } from "@/i18n/dictionaries";
import pt from "@/i18n/locales/pt.json";

interface SweatsContestProps {
  dict?: Dictionary["sweats_contest"];
}

export default function SweatsContest({ dict = pt.sweats_contest }: SweatsContestProps) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [shareName, setShareName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (!user) {
      setIsOpen(false);
      Alert.warning(dict.login_warning);
      return;
    }
    if (!acceptedTerms) {
      Alert.warning(dict.accept_terms);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/zip" && file.type !== "application/x-zip-compressed") {
      Alert.error(dict.errors.zip_only);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      Alert.error(dict.errors.file_too_large);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    Alert.info(dict.uploading);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("shareName", String(shareName));

    try {
      const response = await fetch("/api/user/sweats-contest", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        Alert.success(dict.submitted);
        setIsOpen(false);
        setAcceptedTerms(false);
        setShareName(false);
      } else {
        const data = await response.json().catch(() => null);
        Alert.error(data?.error || dict.errors.upload);
      }
    } catch (error) {
      Alert.error(dict.errors.upload);
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isSubmitDisabled = uploading || !acceptedTerms;

  return (
    <>
      <CloudAnnouncement
        title={dict.title}
        actionText={dict.participate}
        onClick={() => setIsOpen(true)}
      />

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={dict.title}
        subtitle={
          <span>
            {dict.rules_prefix}{" "}
            <Link
              href="/regulamento_sweats_concurso.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.rulesLink}>
              {dict.rules_link_text}
            </Link>{" "}
            {dict.rules_suffix}
          </span>
        }
        size="md">
        <div className={styles.modalBody}>
          <Checkbox
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            label={dict.accept_terms}
            disabled={uploading}
          />
          <Checkbox
            checked={shareName}
            onChange={(event) => setShareName(event.target.checked)}
            label={dict.share_name}
            disabled={uploading}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <Button
            variant="solid"
            color="primary"
            onClick={handleButtonClick}
            disabled={isSubmitDisabled}
            loading={uploading}
            fullWidth>
            {uploading ? dict.uploading : dict.button}
          </Button>

          <p className={styles.fileHint}>{dict.file_helper}</p>
        </div>
      </Modal>
    </>
  );
}
