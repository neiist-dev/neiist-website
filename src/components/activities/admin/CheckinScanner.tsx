"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Alert,
  Badge,
  Button,
  SearchInput,
  ConfirmDialog,
  Modal,
  Heading,
  Text,
  Stack,
  ColorfulText,
  Table,
} from "@neiist/ui";
import {
  LuWifi,
  LuWifiOff,
  LuRefreshCw,
  LuArrowLeft,
  LuTriangleAlert,
  LuScanLine,
} from "react-icons/lu";
import type { Activity, Ticket, CheckinResult } from "@/types/events";
import type { Dictionary } from "@/i18n/dictionaries";
import { useOfflineSyncQueue } from "@/hooks/useOfflineSyncQueue";
import { getEventRosterAction } from "@/actions/activities";
import styles from "@/styles/components/activities/admin/CheckinScanner.module.css";

interface CheckinScannerProps {
  event: Activity;
  dict: Dictionary["checkin_scanner"];
  basePath: string;
}

export default function CheckinScanner({ event, dict, basePath }: CheckinScannerProps) {
  const [barcodeSupported, setBarcodeSupported] = useState<boolean | null>(null);
  const [roster, setRoster] = useState<Ticket[]>([]);
  const [rosterLoaded, setRosterLoaded] = useState(false);
  const [directInput, setDirectInput] = useState("");
  const [confirmingAttendee, setConfirmingAttendee] = useState<Ticket | null>(null);

  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isScanningRef = useRef(false);
  const lastScannedCodeRef = useRef<{ code: string; time: number } | null>(null);

  // Universal offline sync queue hook
  const { isOffline, setIsOffline, pendingCount, isSyncing, enqueue, syncNow } =
    useOfflineSyncQueue<string>({
      queueKey: `checkin_${event.id}`,
      leaveGuardMessage: dict.leave_guard,
      onSync: async (codes: string[]) => {
        const res = await fetch(`/api/calendar/activities/${event.id}/checkin/batch-sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ items: codes.map((c) => ({ ticketCodeOrIstid: c })) }),
        });
        if (!res.ok) return { success: false };
        const data = await res.json();
        return { success: true, syncedCount: data.syncedCount };
      },
    });

  // Pre-cache attendee roster
  const loadRoster = useCallback(async () => {
    try {
      const rosterData = await getEventRosterAction(event.id);
      setRoster(rosterData || []);
      setRosterLoaded(true);
    } catch (err) {
      console.warn("[CheckinScanner] Failed to fetch online roster:", err);
    }
  }, [event.id]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  // Check native BarcodeDetector support
  useEffect(() => {
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        (
          window.BarcodeDetector as unknown as {
            getSupportedFormats: () => Promise<string[]>;
          }
        )
          .getSupportedFormats()
          .then((formats) => {
            setBarcodeSupported(formats.includes("qr_code") || formats.includes("data_matrix"));
          })
          .catch(() => setBarcodeSupported(false));
      } catch {
        setBarcodeSupported(false);
      }
    } else {
      setBarcodeSupported(false);
    }
  }, []);

  const handleUndoCheckin = useCallback(
    async (code: string) => {
      try {
        const res = await fetch(`/api/calendar/activities/${event.id}/checkin`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ticketCodeOrIstid: code }),
        });
        if (!res.ok) throw new Error("Undo check-in failed");
        Alert.success(dict.undo_checkin_success);
        setRoster((prev) =>
          prev.map((item) =>
            item.ticket_code === code || item.istid === code
              ? {
                  ...item,
                  checked_in_at: null,
                  checked_in_by: null,
                  checked_in_by_name: null,
                }
              : item
          )
        );
      } catch {
        Alert.error(dict.undo_error);
      }
    },
    [event.id, dict]
  );

  const checkedInCount = useMemo(() => {
    return roster.filter((r) => Boolean(r.checked_in_at)).length;
  }, [roster]);

  const recentCheckedIn = useMemo(() => {
    return roster
      .filter((r) => Boolean(r.checked_in_at))
      .sort((a, b) => +new Date(b.checked_in_at!) - +new Date(a.checked_in_at!))
      .slice(0, 5);
  }, [roster]);

  const processCheckin = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;

      if (!isOffline) {
        try {
          const res = await fetch(`/api/calendar/activities/${event.id}/checkin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ ticketCodeOrIstid: trimmed }),
          });

          if (res.status === 404) {
            Alert.error(dict.invalid_code);
            return;
          }

          const payload = await res.json();
          const checkinData: CheckinResult = payload.result || payload;

          if (checkinData.already_checked_in) {
            const prefix = checkinData.attendee_name ? `${checkinData.attendee_name}: ` : "";
            Alert.warning(`${prefix}${dict.already_checked_in}`);
            return;
          }

          const prefix = checkinData.attendee_name ? `${checkinData.attendee_name}: ` : "";
          Alert.success(`${prefix}${dict.success_validated}`);

          setRoster((prev) =>
            prev.map((item) =>
              item.istid === checkinData.attendee_istid || item.ticket_code === trimmed
                ? { ...item, checked_in_at: new Date() }
                : item
            )
          );
          return;
        } catch {
          setShowOfflineModal(true);
        }
      }

      // Offline Validation Fallback
      const attendee = roster.find(
        (r) =>
          r.ticket_code?.toLowerCase() === trimmed.toLowerCase() ||
          r.istid.toLowerCase() === trimmed.toLowerCase()
      );

      if (!attendee) {
        Alert.error(dict.invalid_code);
        return;
      }

      if (attendee.checked_in_at) {
        Alert.warning(`${attendee.name}: ${dict.already_checked_in}`);
        return;
      }

      enqueue(trimmed);
      const nowCheckin = new Date();
      setRoster((prev) =>
        prev.map((r) =>
          r.istid === attendee.istid || r.ticket_code === trimmed
            ? { ...r, checked_in_at: nowCheckin }
            : r
        )
      );

      Alert.success(`${attendee.name}: ${dict.offline_validated}`);
    },
    [event.id, isOffline, roster, enqueue, dict]
  );

  // Camera Barcode Scanning Loop
  useEffect(() => {
    if (!videoRef.current || barcodeSupported === false) return;
    let stream: MediaStream | null = null;
    let detector: { detect: (_src: HTMLVideoElement) => Promise<{ rawValue: string }[]> } | null =
      null;
    let animFrame = 0;

    const startCamera = async () => {
      try {
        if ("BarcodeDetector" in window) {
          detector = new (
            window.BarcodeDetector as unknown as {
              new (_opts: { formats: string[] }): typeof detector;
            }
          )({
            formats: ["qr_code", "data_matrix"],
          });
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          isScanningRef.current = true;
          scanLoop();
        }
      } catch (err) {
        console.warn("[CheckinScanner] Camera access denied or unavailable:", err);
      }
    };

    const scanLoop = async () => {
      if (!isScanningRef.current || !videoRef.current || !detector) return;
      try {
        if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const raw = barcodes[0].rawValue;
            const now = Date.now();
            if (
              !lastScannedCodeRef.current ||
              lastScannedCodeRef.current.code !== raw ||
              now - lastScannedCodeRef.current.time > 3000
            ) {
              lastScannedCodeRef.current = { code: raw, time: now };
              processCheckin(raw);
            }
          }
        }
      } catch {
        // frame detection error ignored
      }
      animFrame = requestAnimationFrame(scanLoop);
    };

    startCamera();

    return () => {
      isScanningRef.current = false;
      cancelAnimationFrame(animFrame);
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [barcodeSupported, processCheckin]);

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = directInput.trim().toLowerCase();
    if (!q) return;

    const found = roster.find(
      (r) => r.istid.toLowerCase() === q || (r.ticket_code && r.ticket_code.toLowerCase() === q)
    );

    if (!found) {
      Alert.error(dict.invalid_code);
      return;
    }

    setConfirmingAttendee(found);
  };

  const handleConfirmAttendee = async () => {
    if (!confirmingAttendee) return;
    const target = confirmingAttendee;
    setConfirmingAttendee(null);
    setDirectInput("");

    const code = target.ticket_code || target.istid;
    if (target.checked_in_at) {
      await handleUndoCheckin(code);
    } else {
      await processCheckin(code);
    }
  };

  const handleSyncClick = async () => {
    const res = await syncNow();
    if (res.synced > 0) {
      Alert.success(dict.sync_complete);
      loadRoster();
    }
  };

  return (
    <div className={styles.container}>
      <Link href={`${basePath}/activities/manage`} className={styles.backLink}>
        <LuArrowLeft size={16} />
        <span>{dict.back_to_activities}</span>
      </Link>

      <div className={styles.stationGrid}>
        <div className={styles.scannerColumn}>
          <div className={styles.cameraWrapper}>
            <video ref={videoRef} className={styles.cameraVideo} playsInline muted />
            <div className={styles.cameraOverlay}>
              <div className={styles.scanTarget} />
            </div>
          </div>
          <p className={styles.cameraPrompt}>{dict.camera_prompt}</p>

          <form onSubmit={handleDirectSubmit} className={styles.directInputForm}>
            <div className={styles.directInputWrapper}>
              <SearchInput
                placeholder={dict.manual_search_placeholder}
                value={directInput}
                onChange={setDirectInput}
              />
            </div>
            <Button type="submit" variant="solid" color="primary">
              <LuScanLine size={16} />
              <span>{dict.verify}</span>
            </Button>
          </form>
        </div>

        <div className={styles.infoColumn}>
          <div className={styles.headerCard}>
            <div className={styles.headerTop}>
              <ColorfulText as="h1" text={event.title} className={styles.eventTitle} />

              <div className={styles.badgesGroup}>
                <Badge variant={isOffline ? "danger" : "secondary"} size="md">
                  {isOffline ? (
                    <>
                      <LuWifiOff size={14} className={styles.buttonInlineIcon} />
                      <span>{dict.offline_badge}</span>
                    </>
                  ) : (
                    <>
                      <LuWifi size={14} className={styles.buttonInlineIcon} />
                      <span>{dict.online_badge}</span>
                    </>
                  )}
                </Badge>

                {pendingCount > 0 && (
                  <Badge variant="tertiary" size="md">
                    <LuTriangleAlert size={14} className={styles.buttonInlineIcon} />
                    <span>
                      {pendingCount} {dict.pending_sync}
                    </span>
                  </Badge>
                )}

                {pendingCount > 0 && !isOffline && (
                  <Button
                    size="sm"
                    variant="solid"
                    color="warning"
                    onClick={handleSyncClick}
                    loading={isSyncing}>
                    <LuRefreshCw size={12} />
                    <span>{isSyncing ? dict.syncing : dict.sync_now}</span>
                  </Button>
                )}
              </div>
            </div>

            <div className={styles.statsRow}>
              <div>
                {dict.checked_in_stat}:{" "}
                <strong>
                  {checkedInCount} / {roster.length}
                </strong>
              </div>
              {rosterLoaded && (
                <div>
                  {dict.total_registered_stat}: <strong>{roster.length}</strong>
                </div>
              )}
            </div>
          </div>

          <div className={styles.recentCard}>
            <h2 className={styles.recentTitle}>{dict.recent_checkins_title}</h2>
            {recentCheckedIn.length === 0 ? (
              <p className={styles.recentEmpty}>{dict.no_recent_checkins}</p>
            ) : (
              <Table responsive="scroll">
                <Table.Body>
                  {recentCheckedIn.map((item) => (
                    <Table.Row key={item.istid}>
                      <Table.Cell>
                        <div>
                          <strong>{item.name}</strong>
                        </div>
                        <span className={styles.recentMeta}>{item.istid}</span>
                      </Table.Cell>
                      <Table.Cell>
                        {item.checked_in_at
                          ? new Date(item.checked_in_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          : "—"}
                      </Table.Cell>
                      <Table.Cell style={{ textAlign: "right" }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          color="danger"
                          onClick={() => handleUndoCheckin(item.ticket_code || item.istid)}>
                          {dict.undo}
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            )}
          </div>
        </div>
      </div>

      {confirmingAttendee && (
        <Modal
          open={Boolean(confirmingAttendee)}
          onClose={() => setConfirmingAttendee(null)}
          size="sm">
          <Modal.Header
            title={
              <Heading level={4} color="var(--primary)" style={{ margin: 0 }}>
                {confirmingAttendee.checked_in_at
                  ? dict.already_validated_title
                  : dict.confirm_title}
              </Heading>
            }
            onClose={() => setConfirmingAttendee(null)}
          />
          <Modal.Body>
            <Stack gap="sm">
              <Text>
                <strong>{confirmingAttendee.name}</strong>
              </Text>
              <Text variant="muted">
                {dict.istid_label}: <strong>{confirmingAttendee.istid}</strong>
              </Text>
              {confirmingAttendee.ticket_code && (
                <Text variant="muted">
                  {dict.ticket_label}:{" "}
                  <Badge variant="secondary">{confirmingAttendee.ticket_code}</Badge>
                </Text>
              )}
              <Text>
                {confirmingAttendee.checked_in_at
                  ? dict.confirm_prompt_undo
                  : dict.confirm_prompt_validate}
              </Text>
            </Stack>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={() => setConfirmingAttendee(null)}>
              {dict.cancel}
            </Button>
            <Button
              variant={confirmingAttendee.checked_in_at ? "danger" : "primary"}
              onClick={handleConfirmAttendee}>
              {confirmingAttendee.checked_in_at ? dict.undo_checkin : dict.validate_button}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {showOfflineModal && (
        <ConfirmDialog
          open={showOfflineModal}
          title={dict.offline_confirm_title}
          message={dict.offline_confirm_text}
          confirmLabel={dict.confirm_offline}
          cancelLabel={dict.offline_retry}
          onConfirm={() => {
            setIsOffline(true);
            setShowOfflineModal(false);
          }}
          onCancel={() => setShowOfflineModal(false)}
        />
      )}
    </div>
  );
}
