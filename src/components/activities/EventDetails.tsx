"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as FA from "react-icons/fa";
import * as MD from "react-icons/md";
import * as IO from "react-icons/io5";
import * as TB from "react-icons/tb";
import * as GI from "react-icons/gi";
import * as HI from "react-icons/hi2";
import * as BS from "react-icons/bs";
import { IoClose, IoLocationOutline, IoShareOutline } from "react-icons/io5";
import { MdAccessTime } from "react-icons/md";
import IconPicker from "./IconPicker";
import { formatEventDateTime } from "@/utils/calendarUtils";
import { getEventSettings } from "@/types/events";
import Linkify from "linkify-react";
import { useUser } from "@/context/UserContext";
import { UserRole } from "@/types/user";
import { checkRoles } from "@/types/user";
import type {
  EventSettings,
  NormalizedCalendarEvent,
  EventSubscriber,
  CalendarEvent,
} from "@/types/events";
import type { IconType } from "react-icons";
import styles from "@/styles/components/activities/EventDetails.module.css";

type CalendarEventWithOptionalCustom = CalendarEvent & { customIcon?: string };
interface EventDetailsProps {
  event: NormalizedCalendarEvent;
  onClose: () => void;
  isSignedUp: boolean;
  // eslint-disable-next-line no-unused-vars
  onSignUpChange: (eventId: string, signedUp: boolean) => void;
  // eslint-disable-next-line no-unused-vars
  onUpdate: (updatedEvent?: CalendarEvent) => void;
}

export default function EventDetails({
  event,
  onClose,
  isSignedUp,
  onSignUpChange,
  onUpdate,
}: EventDetailsProps) {
  const router = useRouter();
  const { user } = useUser();
  const currentIstid = user?.istid ?? undefined;
  const isAdmin = checkRoles(user, [UserRole._ADMIN]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [signedUp, setSignedUp] = useState(isSignedUp);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [settings, setSettings] = useState<EventSettings>(() => getEventSettings(event.raw));
  const hasChanges = useRef(false);

  const ICON_REGISTRY: Record<string, IconType> = {
    ...FA,
    ...MD,
    ...IO,
    ...TB,
    ...GI,
    ...HI,
    ...BS,
  };
  const resolvedIconName =
    settings.customIcon ||
    event.raw.extendedProperties?.private?.customIcon ||
    (event.raw as CalendarEventWithOptionalCustom).customIcon ||
    "FaCalendar";
  const EventIcon: IconType = ICON_REGISTRY[resolvedIconName] || FA.FaCalendar;

  const { startDate, endDate, startTime, endTime, isAllDay } = formatEventDateTime(event.raw);
  const subscriberCount = event.raw.subscriberCount ?? 0;
  const maxAttendeesNum = parseInt(settings.maxAttendees) || Infinity;
  const canSignUp = settings.signupEnabled && subscriberCount < maxAttendeesNum;

  useEffect(() => {
    setSettings(getEventSettings(event.raw));
    hasChanges.current = false;
  }, [event]);

  useEffect(() => setSignedUp(isSignedUp), [isSignedUp]);

  const saveSettings = useCallback(async () => {
    if (!isAdmin || !hasChanges.current) return;
    try {
      const res = await fetch("/api/calendar/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventId: event.id,
          signupEnabled: settings.signupEnabled,
          signupDeadline: settings.signupDeadline
            ? new Date(settings.signupDeadline).toISOString()
            : null,
          maxAttendees: settings.maxAttendees ? parseInt(settings.maxAttendees) : null,
          customIcon: settings.customIcon || null,
          description: settings.description || null,
        }),
      });

      if (res.status === 401) {
        window.location.reload();
        return;
      }

      if (res.ok) {
        const patchedRaw: CalendarEvent = {
          ...(event.raw as CalendarEvent),
          extendedProperties: {
            ...(event.raw.extendedProperties || {}),
            private: {
              ...(event.raw.extendedProperties?.private || {}),
              customIcon: settings.customIcon || undefined,
            },
          },
          description: settings.description || undefined,
        };
        onUpdate(patchedRaw);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }, [isAdmin, settings, event.id, event.raw, onUpdate, router]);

  const handleClose = useCallback(async () => {
    await saveSettings();
    onClose();
  }, [saveSettings, onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [handleClose]);

  const updateSetting = <K extends keyof EventSettings>(key: K, value: EventSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    hasChanges.current = true;
  };

  const handleSignUp = async () => {
    if (!currentIstid) {
      // TODO: show toast notification prompting the user to log in
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch("/api/calendar/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ eventId: event.id, signUp: !signedUp }),
      });

      if (res.status === 401) {
        window.location.reload();
        return;
      }

      if (!res.ok) throw new Error("Failed to sign up");
      const data = await res.json();
      setSignedUp(data.signedUp);
      onSignUpChange(event.id, data.signedUp);
      router.refresh();
    } catch (error) {
      console.error("Failed to sign up:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailAttendees = async () => {
    try {
      const res = await fetch(`/api/calendar/activities?eventId=${event.id}`, {
        credentials: "include",
      });
      if (res.status === 401) {
        window.location.reload();
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch attendees");
      const data = await res.json();
      const emails = (data.subscribers as EventSubscriber[]).map((s) => s.email).join(",");
      window.open(
        `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(emails)}`,
        "_blank"
      );
    } catch (error) {
      console.error("Error fetching attendees:", error);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/activities?eventId=${event.id}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={handleClose} aria-label="Fechar">
          <IoClose size={32} />
        </button>

        <div className={styles.eventHeader}>
          <div
            className={styles.eventIcon}
            onClick={isAdmin ? () => setShowIconPicker(true) : undefined}
            style={{ cursor: isAdmin ? "pointer" : "default" }}>
            <EventIcon size={48} />
          </div>
          <h2 className={styles.eventTitle}>{event.summary || "Untitled Event"}</h2>
          <button
            className={styles.shareButton}
            onClick={handleShare}
            title="Copiar link do evento">
            <IoShareOutline size={22} />
          </button>
        </div>

        <div className={styles.detailsSection}>
          <div className={styles.detailRow}>
            <MdAccessTime size={24} />
            {isAllDay ? (
              <span>{startDate == endDate ? `${startDate}` : `${startDate} → ${endDate}`}</span>
            ) : startDate == endDate ? (
              <span>
                {startDate} | {startTime} - {endTime}
              </span>
            ) : (
              <span>
                {startDate} → {endDate} | {startTime} - {endTime}
              </span>
            )}
          </div>
          {event.location && (
            <div className={styles.detailRow}>
              <IoLocationOutline size={24} />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {settings.description && !isAdmin && (
          <div className={styles.descriptionSection}>
            <Linkify
              options={{
                target: "_blank",
                rel: "noopener noreferrer",
                attributes: { className: styles.descriptionLink },
              }}>
              {settings.description}
            </Linkify>
          </div>
        )}

        {isAdmin && (
          <div className={styles.adminSection}>
            <label>
              Descrição do evento
              <textarea
                value={settings.description}
                onChange={(e) => updateSetting("description", e.target.value)}
                rows={4}
                placeholder="Adicionar descrição..."
                disabled={isProcessing}
              />
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={settings.signupEnabled}
                onChange={(e) => updateSetting("signupEnabled", e.target.checked)}
                disabled={isProcessing}
              />
              <span>Permitir inscrições</span>
            </label>

            {settings.signupEnabled && (
              <>
                <label>
                  Data limite para inscrições
                  <input
                    type="datetime-local"
                    value={settings.signupDeadline}
                    onChange={(e) => updateSetting("signupDeadline", e.target.value)}
                    disabled={isProcessing}
                  />
                </label>

                <label>
                  Número máximo de participantes
                  <input
                    type="number"
                    min="1"
                    value={settings.maxAttendees}
                    onChange={(e) => updateSetting("maxAttendees", e.target.value)}
                    placeholder="Sem limite"
                    disabled={isProcessing}
                  />
                </label>
              </>
            )}
          </div>
        )}

        <div className={styles.actionSection}>
          {isAdmin && subscriberCount > 0 && (
            <div className={styles.subscriberCount}>
              {String(subscriberCount).padStart(2, "0")} Inscritos
            </div>
          )}

          <button
            className={styles.signUpButton}
            onClick={handleSignUp}
            disabled={isProcessing || !canSignUp || !currentIstid}>
            {isProcessing
              ? "A processar..."
              : !currentIstid
                ? "Por favor inicie sessão para se inscrever"
                : signedUp
                  ? "Cancelar inscrição"
                  : "Sign Up"}
          </button>
          {isAdmin && subscriberCount > 0 && (
            <button onClick={handleEmailAttendees} className={styles.emailLink}>
              Enviar email para todos os inscritos.
            </button>
          )}
        </div>
      </div>

      {showIconPicker && (
        <IconPicker
          value={settings.customIcon}
          onChange={(icon) => updateSetting("customIcon", icon)}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </div>
  );
}
