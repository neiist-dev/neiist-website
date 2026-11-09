"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  DataTable,
  ColumnDef,
  Badge,
  Button,
  Modal,
  SearchInput,
  EmptyState,
  TableSelectionBar,
  DropdownMenu,
  ColorfulText,
} from "@neiist/ui";
import MemberAvatar from "@/components/layout/MemberAvatar";
import { FaArrowLeft } from "react-icons/fa";
import {
  FiMail,
  FiClock,
  FiMapPin,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
  FiGlobe,
  FiLock,
  FiTag,
  FiCopy,
} from "react-icons/fi";
import { LuQrCode, LuPencil } from "react-icons/lu";
import { TbTableExport } from "react-icons/tb";
import { useSearch } from "@/hooks/useSearch";
import { formatEventDateTime } from "@/utils/calendarUtils";
import { getEventIcon } from "@/components/activities/EventIcons";
import EmailComposerModal from "@/components/general/EmailComposerModal";
import { sendEventParticipantsEmailAction } from "@/actions/activities";
import type { Activity, Ticket } from "@/types/events";
import type { Dictionary } from "@/i18n/dictionaries";
import styles from "@/styles/components/activities/admin/ActivityDetailsView.module.css";

function renderEventIcon(iconName?: string) {
  const IconComponent = getEventIcon(iconName);
  return <IconComponent size={24} />;
}

interface ActivityDetailsViewProps {
  event: Activity;
  roster: Ticket[];
  dict: Dictionary["activities_management"];
  locale?: string;
}

export default function ActivityDetailsView({
  event,
  roster,
  dict,
  locale = "pt",
}: ActivityDetailsViewProps) {
  const router = useRouter();
  const d = dict.details;
  const rm = dict.roster_modal;

  const [currentRoster, setCurrentRoster] = useState<Ticket[]>(roster);

  useEffect(() => {
    setCurrentRoster(roster);
  }, [roster]);

  const [selectedISTids, setSelectedISTids] = useState<Set<string>>(() => new Set());
  const [emailTargetISTids, setEmailTargetISTids] = useState<string[] | "all" | null>(null);
  const [responsesModalItem, setResponsesModalItem] = useState<Ticket | null>(null);

  const emailTargetAttendees = useMemo(() => {
    if (!emailTargetISTids) return null;
    return emailTargetISTids === "all"
      ? currentRoster
      : currentRoster.filter((r) => emailTargetISTids.includes(r.istid));
  }, [emailTargetISTids, currentRoster]);

  const dateTime = useMemo(() => formatEventDateTime(event), [event]);

  const {
    results: filteredAttendees,
    query: searchQuery,
    setQuery: setSearchQuery,
  } = useSearch<Ticket>({
    data: currentRoster,
    fields: ["name", "istid", "email", "ticket_code"],
    returnAllWhenEmpty: true,
  });

  const checkedInCount = useMemo(
    () => currentRoster.filter((r) => Boolean(r.checked_in_at)).length,
    [currentRoster]
  );

  const maxAttendeesVal = event.maxAttendees;

  const handleToggleCheckin = useCallback(
    async (attendee: Ticket) => {
      const isCheckedIn = Boolean(attendee.checked_in_at);
      const targetCheckin = !isCheckedIn;
      try {
        const res = await fetch(`/api/calendar/activities/${event.id}/checkin`, {
          method: targetCheckin ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ticketCodeOrIstid: attendee.ticket_code || attendee.istid }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || d.checkin_error);
        }
        const data = await res.json();
        const checkedInAt = targetCheckin
          ? data.result?.checked_in_at
            ? new Date(data.result.checked_in_at)
            : new Date()
          : null;

        setCurrentRoster((prev) =>
          prev.map((item) =>
            item.istid === attendee.istid ? { ...item, checked_in_at: checkedInAt } : item
          )
        );
        Alert.success(
          targetCheckin
            ? d.checkin_success.replace("{name}", attendee.name)
            : d.undo_checkin_success.replace("{name}", attendee.name)
        );
      } catch (err: unknown) {
        Alert.error(err instanceof Error ? err.message : d.checkin_error);
      }
    },
    [event.id, d]
  );

  const copyToClipboard = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        Alert.success(d.copied_success.replace("{label}", label));
      } catch {
        Alert.error(d.copied_error.replace("{label}", label.toLowerCase()));
      }
    },
    [d]
  );

  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/calendar/activities/${event.id}/export?locale=${locale}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inscritos_${event.id}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      Alert.success(d.export_success);
    } catch (err) {
      console.error("Export error:", err);
      Alert.error(d.export_error);
    } finally {
      setIsExporting(false);
    }
  };

  const renderAttendeeMenuItems = useCallback(
    (attendee: Ticket) => {
      const isCheckedIn = Boolean(attendee.checked_in_at);
      return (
        <>
          <DropdownMenu.Item
            icon={<FiMail size={14} />}
            onClick={() => setEmailTargetISTids([attendee.istid])}>
            {d.send_email}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            icon={isCheckedIn ? <FiXCircle size={14} /> : <FiCheckCircle size={14} />}
            onClick={() => handleToggleCheckin(attendee)}>
            {isCheckedIn ? d.undo_checkin : d.checkin}
          </DropdownMenu.Item>
          {attendee.form_responses && Object.keys(attendee.form_responses).length > 0 && (
            <DropdownMenu.Item
              icon={<FiFileText size={14} />}
              onClick={() => setResponsesModalItem(attendee)}>
              {d.view_responses}
            </DropdownMenu.Item>
          )}
          {(attendee.ticket_code || attendee.email) && <DropdownMenu.Divider />}
          {attendee.ticket_code && (
            <DropdownMenu.Item
              icon={<FiCopy size={14} />}
              onClick={() => copyToClipboard(attendee.ticket_code, d.ticket_code)}>
              {d.copy_ticket}
            </DropdownMenu.Item>
          )}
          {attendee.email && (
            <DropdownMenu.Item
              icon={<FiCopy size={14} />}
              onClick={() => copyToClipboard(attendee.email || "", d.email)}>
              {d.copy_email}
            </DropdownMenu.Item>
          )}
        </>
      );
    },
    [handleToggleCheckin, copyToClipboard, d]
  );

  const columns = useMemo<ColumnDef<Ticket>[]>(
    () => [
      {
        id: "name",
        header: rm.col_name,
        dataLabel: rm.col_name,
        isCardHeader: true,
        cell: (row) => (
          <div className={styles.attendeeCell}>
            <MemberAvatar name={row.name} photo={`/api/user/photo/${row.istid}`} size="sm" />
            <div className={styles.attendeeInfo}>
              <span className={styles.attendeeName}>{row.name}</span>
              <span className={styles.attendeeEmail}>{row.email}</span>
            </div>
          </div>
        ),
      },
      {
        id: "istid",
        header: rm.col_istid,
        dataLabel: rm.col_istid,
        cell: (row) => row.istid,
      },
      {
        id: "ticket_code",
        header: rm.col_ticket,
        dataLabel: rm.col_ticket,
        cell: (row) => row.ticket_code || "—",
      },
      {
        id: "checked_in",
        header: rm.col_checkin,
        dataLabel: rm.col_checkin,
        cell: (row) =>
          row.checked_in_at ? (
            <Badge variant="primary">
              <FiCheckCircle size={12} /> {rm.checked_in}
            </Badge>
          ) : (
            <Badge variant="outline">
              <FiXCircle size={12} /> {rm.not_checked_in}
            </Badge>
          ),
      },
      {
        id: "responses",
        header: rm.col_responses,
        dataLabel: rm.col_responses,
        cell: (row) => {
          const hasResponses = row.form_responses && Object.keys(row.form_responses).length > 0;
          if (!hasResponses) return "—";
          return (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setResponsesModalItem(row);
              }}>
              <FiFileText size={14} /> {d.view_responses}
            </Button>
          );
        },
      },
    ],
    [rm, d]
  );

  return (
    <div className={styles.container}>
      <Button
        type="button"
        variant="ghost"
        color="neutral"
        className={styles.backBtn}
        onClick={() => router.push(`/${locale}/activities/manage`)}>
        <FaArrowLeft /> {d.back_to_events}
      </Button>

      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            <span className={styles.eventIcon}>
              {renderEventIcon(event.customIcon ?? undefined)}
            </span>
            <ColorfulText as="h1" text={event.title} className={styles.title} />
            {event.signupEnabled ? (
              <Badge variant="primary">{d.signups_open}</Badge>
            ) : (
              <Badge variant="outline">{d.signups_closed}</Badge>
            )}
          </div>

          <div className={styles.metaRow}>
            {dateTime.startDate !== "TBD" && (
              <span className={styles.metaItem}>
                <FiClock size={14} />
                {dateTime.startDate}{" "}
                {dateTime.isAllDay ? d.all_day : d.at_time.replace("{time}", dateTime.startTime)}
              </span>
            )}
            {event.location && (
              <span className={styles.metaItem}>
                <FiMapPin size={14} />
                {Array.isArray(event.location) ? event.location.join(", ") : event.location}
              </span>
            )}
            <span className={styles.metaItem}>
              {event.public ? <FiGlobe size={14} /> : <FiLock size={14} />}
              {event.public ? d.public : d.unlisted}
            </span>
            {event.type && (
              <span className={styles.metaItem}>
                <FiTag size={14} />
                {event.type}
              </span>
            )}
          </div>
        </div>

        <div className={styles.actionsToolbar}>
          <Button
            type="button"
            variant="solid"
            color="primary"
            size="sm"
            onClick={() => router.push(`/${locale}/activities/${event.id}/checkin`)}>
            <LuQrCode size={14} /> {d.open_scanner}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push(`/${locale}/activities/manage/${event.id}/edit`)}>
            <LuPencil size={14} /> {d.edit}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEmailTargetISTids("all")}
            disabled={currentRoster.length === 0}>
            <FiMail size={14} /> {d.send_email}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            loading={isExporting}
            disabled={currentRoster.length === 0 || isExporting}>
            <TbTableExport size={14} /> {d.export_excel}
          </Button>
        </div>
      </header>

      <section className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>{d.total_attendees}</span>
          <span className={styles.metricValue}>
            {currentRoster.length}
            {maxAttendeesVal ? ` / ${maxAttendeesVal}` : ""}
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>{d.checked_in_attendees}</span>
          <span className={styles.metricValue}>
            {checkedInCount} / {currentRoster.length}
          </span>
        </div>
      </section>

      <div className={styles.controlsRow}>
        <div className={styles.searchWrapper}>
          <SearchInput
            placeholder={d.search_placeholder}
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
      </div>

      {selectedISTids.size > 0 && (
        <TableSelectionBar
          count={selectedISTids.size}
          label={selectedISTids.size === 1 ? d.selected_count : d.selected_count_plural}
          onClear={() => setSelectedISTids(new Set())}
          clearLabel={d.clear_selection}>
          <Button
            type="button"
            variant="solid"
            color="primary"
            size="sm"
            onClick={() =>
              setEmailTargetISTids(selectedISTids.size > 0 ? Array.from(selectedISTids) : "all")
            }>
            <FiMail size={14} /> {d.send_email_selected}
          </Button>
        </TableSelectionBar>
      )}

      <DataTable
        data={filteredAttendees}
        columns={columns}
        enableRowSelection={true}
        selectedRowIds={selectedISTids}
        onSelectionChange={setSelectedISTids}
        getRowId={(row) => row.istid}
        rowActions={renderAttendeeMenuItems}
        actionsTitle={d.attendee_actions}
        responsive="cards"
        emptyMessage={<EmptyState title={d.empty_title} description={d.empty_desc} />}
      />

      {emailTargetAttendees && (
        <EmailComposerModal
          open={Boolean(emailTargetAttendees)}
          onClose={() => setEmailTargetISTids(null)}
          title={
            emailTargetAttendees.length === 1
              ? `Enviar Email: ${emailTargetAttendees[0].name}`
              : `Enviar Email: ${event.title}`
          }
          recipientCount={emailTargetAttendees.length}
          initialSubject={`Informações sobre o evento ${event.title}`}
          initialBody={
            emailTargetAttendees.length === 1
              ? `Olá ${emailTargetAttendees[0].name},\n\nEntramos em contacto relativamente ao evento **${event.title}**...\n\nO teu código de bilhete: **${emailTargetAttendees[0].ticket_code || "N/A"}**\n\nCom os melhores cumprimentos,\nNEIIST`
              : `Olá {{name}},\n\nEntramos em contacto relativamente ao evento **${event.title}**...\n\nO teu código de bilhete: **{{ticket_code}}**\n\nCom os melhores cumprimentos,\nNEIIST`
          }
          variables={[
            {
              key: "name",
              label: "Nome do Participante",
              sampleValue: emailTargetAttendees[0]?.name || "Maria Silva",
            },
            {
              key: "istid",
              label: "IST ID",
              sampleValue: emailTargetAttendees[0]?.istid || "ist110000",
            },
            {
              key: "ticket_code",
              label: "Código do Bilhete",
              sampleValue: emailTargetAttendees[0]?.ticket_code || "BAD882",
            },
            {
              key: "event_title",
              label: "Nome do Evento",
              sampleValue: event.title || "Evento",
            },
          ]}
          sampleData={{
            name: emailTargetAttendees[0]?.name || "Maria Silva",
            istid: emailTargetAttendees[0]?.istid || "ist110000",
            ticket_code: emailTargetAttendees[0]?.ticket_code || "BAD882",
            event_title: event.title || "Evento",
          }}
          onSend={async ({ subject, body }) => {
            const recipientIstids =
              emailTargetISTids === "all" ? undefined : (emailTargetISTids ?? undefined);
            const res = await sendEventParticipantsEmailAction({
              eventId: event.id,
              subject,
              body,
              recipientIstids,
            });
            Alert.success(`Email enviado com sucesso para ${res.sentCount} participante(s)!`);
          }}
        />
      )}

      {responsesModalItem && (
        <Modal
          open={Boolean(responsesModalItem)}
          onClose={() => setResponsesModalItem(null)}
          title={d.responses_title.replace("{name}", responsesModalItem.name)}
          size="md">
          <div className={styles.responsesList}>
            {Object.entries(responsesModalItem.form_responses || {}).map(([q, a]) => (
              <div key={q} className={styles.responseItem}>
                <span className={styles.responseQuestion}>{q}</span>
                <span className={styles.responseAnswer}>
                  {typeof a === "boolean" ? (a ? d.yes : d.no) : String(a || "—")}
                </span>
              </div>
            ))}
          </div>
          <div className={styles.modalFooterActions}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setResponsesModalItem(null)}>
              {d.close}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
