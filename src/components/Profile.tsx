"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import styles from "@/styles/components/Profile.module.css";
import { User, UserRole } from "@/types/user";
import { checkRoles } from "@/types/user";
import {
  FiCalendar,
  FiInfo,
  FiMail,
  FiPhone,
  FiUpload,
  FiTrash2,
  FiDownload,
  FiGithub,
  FiLinkedin,
} from "react-icons/fi";
import { RiContactsBook3Line } from "react-icons/ri";
import { IoOpenOutline } from "react-icons/io5";
import { LuCalendarDays } from "react-icons/lu";
import { getFirstAndLastName } from "@/utils/userUtils";

type FieldName = "alternativeEmail" | "phone" | "preferredContactMethod" | "github" | "linkedin";

export default function ProfileClient({
  initialUser,
  initialHasCV,
  dict,
}: {
  initialUser: User;
  initialHasCV: boolean;
  dict?: any;
}) {
  const [user, setUser] = useState<User>(initialUser);
  const [hasCV, setHasCV] = useState<boolean>(initialHasCV);
  const [cvLoading, setCvLoading] = useState<boolean>(false);
  const [calendarLoading, setCalendarLoading] = useState<boolean>(false);

  const [altEmailDraft, setAltEmailDraft] = useState<string>(initialUser?.alternativeEmail ?? "");
  const [phoneDraft, setPhoneDraft] = useState<string>(initialUser?.phone ?? "");
  const [preferredDraft, setPreferredDraft] = useState<string>(
    initialUser?.preferredContactMethod ?? "email"
  );
  const [githubDraft, setGithubDraft] = useState<string>(initialUser?.github ?? "");
  const [linkedinDraft, setLinkedinDraft] = useState<string>(initialUser?.linkedin ?? "");

  const [pendingChange, setPendingChange] = useState<{ field: FieldName; value: string } | null>(
    null
  );
  const [calendarData, setCalendarData] = useState<{
    addCalendarLink: string;
    webViewLink: string;
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState<string>("");

  const isMember = checkRoles(user, [UserRole._MEMBER, UserRole._COORDINATOR, UserRole._ADMIN]);

  useEffect(() => {
    setAltEmailDraft(user?.alternativeEmail ?? "");
    setPhoneDraft(user?.phone ?? "");
    setPreferredDraft(user?.preferredContactMethod ?? "email");
    setGithubDraft(user?.github ?? "");
    setLinkedinDraft(user?.linkedin ?? "");
    setCalendarData(null);
  }, [user]);

  const askConfirm = (field: FieldName, value: string) => {
    setPendingChange({ field, value });
    setShowConfirmDialog(true);
  };

  const handleBlur = (
    field: Extract<FieldName, "alternativeEmail" | "phone" | "github" | "linkedin">,
    value: string
  ) => {
    if (
      (field === "alternativeEmail" && value !== (user?.alternativeEmail ?? "")) ||
      (field === "phone" && value !== (user?.phone ?? "")) ||
      (field === "github" && value !== (user?.github ?? "")) ||
      (field === "linkedin" && value !== (user?.linkedin ?? ""))
    ) {
      askConfirm(field, value);
    }
  };

  const handlePreferredChange = (value: string) => {
    if (value !== (user?.preferredContactMethod ?? "email")) {
      setPreferredDraft(value);
      askConfirm("preferredContactMethod", value);
    }
  };

  const handleConfirmChange = async () => {
    if (!pendingChange || !user) return;
    setShowConfirmDialog(false);
    setError("");

    try {
      const { field } = pendingChange;
      const value = pendingChange.value.trim();

      if (field === "alternativeEmail") {
        const res = await fetch("/api/user/verify-email/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ istid: user.istid, alternativeEmail: value }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || dict?.errors?.verify_email);
        }
        // TODO: (SUCCESS) show success toast after the verification email request is sent.
      } else {
        const res = await fetch(`/api/user/update/${user.istid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ [field]: value }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || dict?.errors?.update);
        }
      }

      const userRes = await fetch("/api/auth/userdata");
      if (userRes.ok) {
        const updated = await userRes.json();
        setUser(updated);
      }
    } catch (e) {
      // TODO: (ERROR)
      setError(e instanceof Error ? e.message : dict?.errors?.update_profile);
    } finally {
      setPendingChange(null);
    }
  };

  const getCalendarData = async () => {
    if (calendarData) return calendarData;
    if (!user?.istid) return null;
    try {
      // TODO: show loading toast while fetching calendar
      const response = await fetch(`/api/calendar/${user.istid}`);
      if (!response.ok) {
        throw new Error(dict?.errors?.fetch_calendar);
      }
      const data = await response.json();
      const links = {
        addCalendarLink: data.addCalendarLink,
        webViewLink: data.webViewLink,
      };
      setCalendarData(links);
      return links;
    } catch (e) {
      // TODO: (ERROR)
      setError(e instanceof Error ? e.message : dict?.errors?.get_calendar_link);
      return null;
    }
  };

  const handleAddCalendar = async () => {
    if (!user?.istid || calendarLoading) return;
    setCalendarLoading(true);
    setError("");

    try {
      const data = await getCalendarData();
      if (data?.addCalendarLink) {
        window.open(data.addCalendarLink, "_blank");
      }
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleViewCalendar = async () => {
    if (!user?.istid || calendarLoading) return;
    setCalendarLoading(true);
    setError("");

    try {
      const data = await getCalendarData();
      if (data?.webViewLink) {
        window.open(data.webViewLink, "_blank");
      }
    } finally {
      setCalendarLoading(false);
    }
  };

  const onCvUpload = async (file: File | null) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      // TODO: (ERROR)
      setError(dict?.errors?.pdf_only);
      return;
    }
    setCvLoading(true);
    try {
      // TODO: (LOADING) show loading toast while the CV upload is in progress.
      const form = new FormData();
      form.append("file", file);
      form.append("istid", user.istid);

      const res = await fetch("/api/user/cv-bank", { method: "POST", body: form });
      if (!res.ok) throw new Error(dict?.errors?.cv_upload);
      setHasCV(true);
      // TODO: (SUCCESS) show success toast after the CV is uploaded.
    } catch (e) {
      // TODO: (ERROR)
      setError(e instanceof Error ? e.message : dict?.errors?.cv_upload_error);
    } finally {
      setCvLoading(false);
    }
  };

  const onCvRemove = async () => {
    setCvLoading(true);
    try {
      const res = await fetch("/api/user/cv-bank", { method: "DELETE" });
      if (!res.ok) throw new Error(dict?.errors?.cv_remove);
      setHasCV(false);
      // TODO: (SUCCESS) show success toast after the CV is removed.
    } catch (e) {
      // TODO: (ERROR)
      setError(e instanceof Error ? e.message : dict?.errors?.cv_remove_error);
    } finally {
      setCvLoading(false);
    }
  };

  const onCvDownload = async () => {
    setCvLoading(true);
    try {
      const res = await fetch("/api/user/cv-bank?download");
      if (!res.ok) throw new Error(dict?.errors?.cv_not_found);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${user.istid || "cv"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // TODO: (ERROR)
      setError(e instanceof Error ? e.message : dict?.errors?.cv_download);
    } finally {
      setCvLoading(false);
    }
  };

  const getFieldDisplayName = (field: FieldName) => {
    switch (field) {
      case "alternativeEmail":
        return dict?.fields?.alternativeEmail;
      case "phone":
        return dict?.fields?.phone;
      case "preferredContactMethod":
        return dict?.fields?.preferredContactMethod;
      case "github":
        return dict?.fields?.github;
      case "linkedin":
        return dict?.fields?.linkedin;
    }
  };

  const getValueDisplayName = (field: FieldName, value: string) => {
    if (field === "preferredContactMethod") {
      return (
        (
          {
            email: dict?.values?.preferredContactMethod?.email,
            alternativeEmail: dict?.values?.preferredContactMethod?.alternativeEmail,
            phone: dict?.values?.preferredContactMethod?.phone,
          } as Record<string, string>
        )[value] || value
      );
    }
    return value || "—";
  };

  return (
    <>
      <h1 className={styles.title}>
        <span className={styles.primary}>{dict?.title_letters?.[0]}</span>
        <span className={styles.secondary}>{dict?.title_letters?.[1]}</span>
        <span className={styles.tertiary}>{dict?.title_letters?.[2]}</span>
        <span className={styles.quaternary}>{dict?.title_letters?.[3]}</span>
      </h1>
      <div className={styles.container}>
        <div className={styles.left}>
          <div className={styles.details}>
            <Image
              src={user?.photo || "/default-profile.png"}
              alt={dict?.photo_alt}
              width={180}
              height={180}
              className={styles.photo}
            />
            <div className={styles.userInfo}>
              <h2 className={styles.name}>{getFirstAndLastName(user?.name)}</h2>
              <p className={styles.istID}>{user?.istid}</p>
              <p className={styles.email}>{user?.email}</p>
            </div>
          </div>
          <div className={styles.contactInfo}>
            <div>
              <div className={styles.contactLabel}>{dict?.labels?.alternativeEmail}</div>
              <div className={styles.contactField}>
                <FiMail className={styles.icon} />
                <input
                  type="email"
                  className={styles.contactInput}
                  placeholder={dict?.placeholders?.alternativeEmail}
                  value={altEmailDraft}
                  onChange={(e) => setAltEmailDraft(e.target.value)}
                  onBlur={() => handleBlur("alternativeEmail", altEmailDraft)}
                />
                {user?.alternativeEmail && !user?.alternativeEmailVerified && (
                  <span>{dict?.labels?.unverified}</span>
                )}
              </div>
            </div>
            <div>
              <div className={styles.contactLabel}>{dict?.labels?.phone}</div>
              <div className={styles.contactField}>
                <FiPhone className={styles.icon} />
                <input
                  type="tel"
                  className={styles.contactInput}
                  placeholder={dict?.placeholders?.phone}
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  onBlur={() => handleBlur("phone", phoneDraft)}
                />
              </div>
            </div>
            <div>
              <div className={styles.contactLabel}>{dict?.labels?.preferredContactMethod}</div>
              <div className={styles.contactField}>
                <RiContactsBook3Line className={styles.icon} />
                <select
                  className={styles.contactSelect}
                  value={preferredDraft}
                  onChange={(e) => handlePreferredChange(e.target.value)}>
                  <option value="email">{dict?.values?.preferredContactMethod?.email}</option>
                  {(altEmailDraft || user?.alternativeEmail) && (
                    <option value="alternativeEmail">{dict?.values?.preferredContactMethod?.alternativeEmail}</option>
                  )}
                  {(phoneDraft || user?.phone) && <option value="phone">{dict?.values?.preferredContactMethod?.phone}</option>}
                </select>
              </div>
            </div>
            {isMember && (
              <>
                <div>
                  <div className={styles.contactLabel}>{dict?.github_label}</div>
                  <div className={styles.contactField}>
                    <FiGithub className={styles.icon} />
                    <input
                      type="text"
                      className={styles.contactInput}
                      placeholder={dict?.github_placeholder}
                      value={githubDraft}
                      onChange={(e) => setGithubDraft(e.target.value)}
                      onBlur={() => handleBlur("github", githubDraft)}
                    />
                  </div>
                </div>
                <div>
                  <div className={styles.contactLabel}>{dict?.linkedin_label}</div>
                  <div className={styles.contactField}>
                    <FiLinkedin className={styles.icon} />
                    <input
                      type="text"
                      className={styles.contactInput}
                      placeholder={dict?.linkedin_placeholder}
                      value={linkedinDraft}
                      onChange={(e) => setLinkedinDraft(e.target.value)}
                      onBlur={() => handleBlur("linkedin", linkedinDraft)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className={styles.right}>
          {isMember && (
            <>
              <div className={styles.schedule}>
                <div className={styles.sectionTitle}>
                  <FiCalendar className={styles.icon} />
                  <span>{dict?.sections?.calendar}</span>
                </div>
                <p className={styles.infoText}>{dict?.sections?.calendarDescription}</p>
                <div className={styles.actionButtons}>
                  <a
                    className={styles.button}
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewCalendar();
                    }}
                    href="#"
                    style={{
                      cursor: calendarLoading ? "not-allowed" : "pointer",
                      opacity: calendarLoading ? 0.6 : 1,
                    }}>
                    <LuCalendarDays /> {calendarLoading ? dict?.labels?.loading: dict?.buttons?.view_calendar}
                  </a>
                  <a
                    className={styles.filledButton}
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddCalendar();
                    }}
                    href="#"
                    style={{
                      cursor: calendarLoading ? "not-allowed" : "pointer",
                      opacity: calendarLoading ? 0.6 : 1,
                    }}>
                    <IoOpenOutline />{" "}
                    {calendarLoading ? dict?.labels?.loading : dict?.buttons?.open_in_google}
                  </a>
                </div>
              </div>
            </>
          )}
          <div className={styles.cvbank}>
                <div className={styles.sectionTitle}>
              <FiUpload className={styles.icon} />
              <span>{dict?.sections?.cvbank}</span>
              <div className={styles.infoBubbleWrapper}>
                <FiInfo className={styles.infoBubble} />
                <div className={styles.tooltip}>{dict?.sections?.cvbankTooltip}</div>
              </div>
            </div>
            {!hasCV ? (
              <>
                <label className={styles.cvUpload} htmlFor="cv-input">
                  <div>
                    <FiUpload className={styles.cvUploadIcon} />
                    <p>{dict?.placeholders?.cvUpload}</p>
                  </div>
                </label>
                <input
                  id="cv-input"
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={(e) => onCvUpload(e.target.files?.[0] ?? null)}
                  disabled={cvLoading}
                />
              </>
            ) : (
                <div className={styles.actionButtons}>
                <button className={styles.button} onClick={onCvDownload} disabled={cvLoading}>
                  <FiDownload /> {dict?.buttons?.download_cv}
                </button>
                <button className={styles.button} onClick={onCvRemove} disabled={cvLoading}>
                  <FiTrash2 /> {dict?.buttons?.remove_cv}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* TODO: replace this inline error with a toast and remove this fallback once Sonner is implemented here. */}
      {error && <p className={styles.error}>{error}</p>}
      <ConfirmDialog
        open={showConfirmDialog}
        message={
          pendingChange
            ? pendingChange.value === ""
              ? (dict?.confirm_remove_field || "").replace("{field}", getFieldDisplayName(pendingChange.field) || "")
              : (dict?.confirm_change_field || "")
                  .replace("{field}", getFieldDisplayName(pendingChange.field) || "")
                  .replace("{value}", getValueDisplayName(pendingChange.field, pendingChange.value))
            : ""
        }
        onConfirm={handleConfirmChange}
        onCancel={() => {
          setShowConfirmDialog(false);
          setPendingChange(null);
        }}
        dict={dict?.confirm_dialog}
      />
    </>
  );
}
