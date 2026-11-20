"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { IoLocationOutline, IoShareOutline } from "react-icons/io5";
import { MdAccessTime } from "react-icons/md";
import { formatEventDateTime } from "@/utils/calendarUtils";
import { getEventIcon } from "@/components/activities/EventIcons";
import Linkify from "linkify-react";
import { Alert, Modal, Button, Badge, Input, Select, Checkbox } from "@neiist/ui";
import { useUser } from "@/context/UserContext";
import type { Activity } from "@/types/events";
import styles from "@/styles/components/activities/EventDetails.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

function renderEventIcon(iconName?: string, size = 28) {
  const IconComponent = getEventIcon(iconName);
  return <IconComponent size={size} />;
}

interface EventDetailsProps {
  event: Activity;
  onClose: () => void;
  isSignedUp: boolean;
  onSignUpChange: (_eventId: string, _signedUp: boolean) => void;
  onUpdate?: (_updatedEvent?: Activity) => void;
  dict: Dictionary["activities"]["details"];
  locale?: string;
}

export default function EventDetails({
  event,
  onClose,
  isSignedUp,
  onSignUpChange,
  dict,
  locale = "pt",
}: EventDetailsProps) {
  const router = useRouter();
  const { user } = useUser();
  const currentIstid = user?.istid ?? undefined;

  const [isProcessing, setIsProcessing] = useState(false);
  const [signedUp, setSignedUp] = useState(isSignedUp);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formResponses, setFormResponses] = useState<Record<string, unknown>>({});
  const [currentTimestamp] = useState(() => Date.now());

  const act = event;
  const resolvedIconName = act.customIcon || "FaCalendar";

  const { startDate, endDate, startTime, endTime, isAllDay } = formatEventDateTime(act);

  const subscriberCount = act.subscriberCount ?? 0;
  const signupEnabled = act.signupEnabled;
  const signupDeadline = act.signupDeadline;
  const maxAttendees = act.maxAttendees;
  const ticketProductId = act.ticketProductId;
  const ticketPrice = act.ticketPrice;
  const isPaidTicket = Boolean(ticketProductId);
  const parsedSignupFields = act.signupFields ?? [];

  const maxAttendeesNum = maxAttendees ? Number(maxAttendees) : Infinity;
  const isDeadlinePassed = Boolean(
    signupDeadline && currentTimestamp > new Date(signupDeadline).getTime()
  );
  const isEventEnded = Boolean(event.end && currentTimestamp > new Date(event.end).getTime());
  const isFull = maxAttendeesNum < Infinity && subscriberCount >= maxAttendeesNum;
  const canSignUp = signupEnabled && !isDeadlinePassed && !isEventEnded && !isFull;

  useEffect(() => setSignedUp(isSignedUp), [isSignedUp]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleClose = useCallback(() => {
    document.body.style.overflow = "";
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [handleClose]);

  const handleShare = () => {
    const url = `${window.location.origin}/${locale}/activities?eventId=${event.id}`;
    navigator.clipboard.writeText(url);
    Alert.success(dict.link_copied);
  };

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setFormResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  const submitSignUp = async (responses?: Record<string, unknown>) => {
    if (!currentIstid) {
      Alert.warning(dict.please_login);
      return;
    }

    if (parsedSignupFields.length > 0) {
      for (const field of parsedSignupFields) {
        if (field.required) {
          const val = responses ? responses[field.id] : formResponses[field.id];
          if (
            val === undefined ||
            val === null ||
            val === "" ||
            (field.type === "checkbox" && !val)
          ) {
            Alert.error(`Por favor preenche o campo obrigatório: ${field.label}`);
            return;
          }
        }
      }
    }

    setIsProcessing(true);
    const alertId = Alert.loading(dict.signing_up);
    try {
      const res = await fetch("/api/calendar/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventId: event.id,
          signUp: true,
          formResponses: responses ?? formResponses,
        }),
      });

      if (res.status === 401) {
        window.location.reload();
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || dict.errors.sign_up);
      }

      const data = await res.json();
      setSignedUp(data.signedUp);
      setIsFormOpen(false);
      onSignUpChange(event.id, data.signedUp);
      router.refresh();
      Alert.success(dict.signed_up);
    } catch (error) {
      Alert.error(error instanceof Error ? error.message : dict.errors.update_signup);
    } finally {
      Alert.dismiss(alertId);
      setIsProcessing(false);
    }
  };

  const handleSignUpClick = () => {
    if (!currentIstid) {
      Alert.warning(dict.please_login);
      return;
    }

    if (parsedSignupFields.length > 0) {
      setIsFormOpen(true);
      return;
    }

    submitSignUp();
  };

  const handleCancelSignUp = async () => {
    if (isPaidTicket) {
      Alert.warning(dict.labels.contact_coordinators_for_refund);
      return;
    }

    setIsProcessing(true);
    const alertId = Alert.loading(dict.cancelling_signup);
    try {
      const res = await fetch("/api/calendar/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ eventId: event.id, signUp: false }),
      });

      if (res.status === 401) {
        window.location.reload();
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || dict.errors.update_signup);
      }

      const data = await res.json();
      setSignedUp(data.signedUp);
      onSignUpChange(event.id, data.signedUp);
      router.refresh();
      Alert.success(dict.signup_cancelled);
    } catch (error) {
      Alert.error(error instanceof Error ? error.message : dict.errors.update_signup);
    } finally {
      Alert.dismiss(alertId);
      setIsProcessing(false);
    }
  };

  const remainingSpots =
    maxAttendeesNum < Infinity ? Math.max(0, maxAttendeesNum - subscriberCount) : null;

  return (
    <Modal open={true} onClose={handleClose} size="md" closeLabel={dict.close}>
      <Modal.Header onClose={handleClose} closeLabel={dict.close}>
        <div className={styles.modalHeaderTitle}>
          <div className={styles.eventIcon}>{renderEventIcon(resolvedIconName, 28)}</div>
          <h2 className={styles.eventTitle}>{event.title || dict.untitled_event}</h2>
          <Button
            variant="ghost"
            size="icon"
            shape="pill"
            onClick={handleShare}
            title={dict.share_title}
            aria-label={dict.share_title}>
            <IoShareOutline size={18} />
          </Button>
        </div>
      </Modal.Header>

      <Modal.Body className={styles.modalBody}>
        <div className={styles.detailsSection}>
          <div className={styles.detailRow}>
            <MdAccessTime size={20} className={styles.detailIcon} />
            {isAllDay ? (
              <span>{startDate === endDate ? `${startDate}` : `${startDate} → ${endDate}`}</span>
            ) : startDate === endDate ? (
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
              <IoLocationOutline size={20} className={styles.detailIcon} />
              <span>
                {Array.isArray(event.location) ? event.location.join(", ") : event.location}
              </span>
            </div>
          )}

          {remainingSpots !== null && (
            <div className={styles.badgeRow}>
              {remainingSpots === 0 ? (
                <Badge variant="danger" size="md">
                  {dict.labels.capacity_reached}
                </Badge>
              ) : remainingSpots < Math.max(3, maxAttendeesNum * 0.1) ? (
                <Badge variant="tertiary" size="md">
                  {remainingSpots} {dict.labels.spots_remaining}
                </Badge>
              ) : (
                <Badge variant="secondary" size="md">
                  {remainingSpots} {dict.labels.available_spots}
                </Badge>
              )}
            </div>
          )}
        </div>

        {event.description && (
          <div className={styles.descriptionSection}>
            <Linkify
              options={{
                target: "_blank",
                rel: "noopener noreferrer",
                attributes: { className: styles.descriptionLink },
              }}>
              {event.description}
            </Linkify>
          </div>
        )}

        {isFormOpen && (
          <div className={styles.dynamicFormContainer}>
            <h4 className={styles.dynamicFormTitle}>{dict.labels.fill_signup_form}</h4>
            {parsedSignupFields.map((field) => (
              <div key={field.id} className={styles.dynamicFormField}>
                {field.type === "text" && (
                  <Input
                    label={`${field.label}${field.required ? " *" : ""}`}
                    placeholder={field.placeholder || ""}
                    value={String(formResponses[field.id] ?? "")}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    disabled={isProcessing}
                  />
                )}
                {field.type === "select" && (
                  <Select
                    label={`${field.label}${field.required ? " *" : ""}`}
                    options={(field.options || []).map((opt: string) => ({
                      label: opt,
                      value: opt,
                    }))}
                    value={String(formResponses[field.id] ?? "")}
                    onChange={(val) => handleFieldChange(field.id, val)}
                    disabled={isProcessing}
                  />
                )}
                {field.type === "checkbox" && (
                  <Checkbox
                    label={`${field.label}${field.required ? " *" : ""}`}
                    checked={Boolean(formResponses[field.id])}
                    onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                    disabled={isProcessing}
                  />
                )}
              </div>
            ))}

            <div className={styles.dynamicFormActions}>
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsFormOpen(false)}
                disabled={isProcessing}>
                Voltar
              </Button>
              <Button
                variant="solid"
                color="primary"
                onClick={() => submitSignUp()}
                loading={isProcessing}
                disabled={isProcessing}>
                {isProcessing ? dict.processing : dict.labels.submit_form}
              </Button>
            </div>
          </div>
        )}
      </Modal.Body>

      {!isFormOpen && (signedUp || ticketProductId || canSignUp) && (
        <Modal.Footer className={styles.modalFooter}>
          {signedUp ? (
            <div className={styles.signedUpActions}>
              <Button
                variant="solid"
                color="primary"
                fullWidth
                size="lg"
                onClick={() => {
                  handleClose();
                  router.push(`/${locale}/activities/${event.id}/ticket`);
                }}>
                {dict.buttons.view_ticket}
              </Button>
              {!isPaidTicket && !isEventEnded && (
                <Button
                  variant="outline"
                  color="danger"
                  fullWidth
                  onClick={handleCancelSignUp}
                  loading={isProcessing}
                  disabled={isProcessing}>
                  {isProcessing ? dict.processing : dict.buttons.cancel_signup}
                </Button>
              )}
            </div>
          ) : ticketProductId ? (
            <Button
              variant="solid"
              color="primary"
              fullWidth
              size="lg"
              onClick={() => {
                handleClose();
                router.push(`/${locale}/shop/${ticketProductId}`);
              }}>
              {dict.buttons.buy_ticket} {ticketPrice ? `(${ticketPrice}€)` : ""}
            </Button>
          ) : canSignUp ? (
            <Button
              variant="solid"
              color="primary"
              fullWidth
              size="lg"
              onClick={handleSignUpClick}
              loading={isProcessing}
              disabled={isProcessing || !currentIstid}>
              {isProcessing
                ? dict.processing
                : !currentIstid
                  ? dict.please_login
                  : dict.buttons.sign_up}
            </Button>
          ) : null}
        </Modal.Footer>
      )}
    </Modal>
  );
}
