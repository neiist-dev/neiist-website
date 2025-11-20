"use client";
import { useMemo, useState, useEffect } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { pt } from "date-fns/locale/pt";
import "react-big-calendar/lib/css/react-big-calendar.css";
import EventDetails from "@/components/activities/EventDetails";
import { normalizeCalendarEvent } from "@/utils/calendarUtils";
import type { NormalizedCalendarEvent, CalendarEvent } from "@/types/events";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import * as FA from "react-icons/fa";
import * as MD from "react-icons/md";
import * as IO from "react-icons/io5";
import * as TB from "react-icons/tb";
import * as GI from "react-icons/gi";
import * as HI from "react-icons/hi2";
import * as BS from "react-icons/bs";
import styles from "@/styles/components/activities/Calendar.module.css";

const locales = { pt };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

interface CalendarProps {
  events: CalendarEvent[];
  signedUpEventIds: string[];
  userIstid: string | null;
  isAdmin: boolean;
}

interface ReactBigCalendarEvent {
  id: string;
  title: React.ReactNode;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: CalendarEvent;
}

const ALL_ICONS = {
  ...FA,
  ...MD,
  ...IO,
  ...TB,
  ...GI,
  ...HI,
  ...BS,
};

function getEventIcon(event: CalendarEvent) {
  const iconName =
    event?.extendedProperties?.private?.customIcon ||
    (event as CalendarEvent & { customIcon?: string })?.customIcon ||
    "FaCalendar";
  const Icon = ALL_ICONS[iconName as keyof typeof ALL_ICONS] || FA.FaCalendar;
  return <Icon size={18} style={{ marginRight: 6, verticalAlign: "middle" }} />;
}

function IconEventsCard({ event }: { event: ReactBigCalendarEvent }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {event.resource && getEventIcon(event.resource)}
      <span>{event.title}</span>
    </span>
  );
}

function mapToBigCalendarEvent(event: NormalizedCalendarEvent) {
  return {
    id: event.id,
    title: event.summary,
    start: event.start,
    end: event.end,
    allDay: event.isAllDay,
    resource: event.raw,
  };
}

function CustomToolbar({
  label,
  onNavigate,
}: {
  label: string;
  onNavigate: (_action: "PREV" | "NEXT" | "TODAY") => void;
}) {
  const [month, year] = label.split(" ");

  return (
    <div className={styles.header}>
      <button onClick={() => onNavigate("PREV")} aria-label="Previous Month">
        <FiChevronLeft />
      </button>
      <span>
        {month} {year}
      </span>
      <button onClick={() => onNavigate("NEXT")} aria-label="Next Month">
        <FiChevronRight />
      </button>
    </div>
  );
}

export default function Calendar({ events, signedUpEventIds, userIstid, isAdmin }: CalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<NormalizedCalendarEvent | null>(null);
  const [signUps, setSignUps] = useState<Set<string>>(new Set(signedUpEventIds));
  const [eventList, setEventList] = useState<CalendarEvent[]>(events);

  useEffect(() => {
    setEventList(events);
  }, [events]);
  useEffect(() => {
    setSignUps(new Set(signedUpEventIds));
  }, [signedUpEventIds]);

  const normalizedEvents = useMemo<NormalizedCalendarEvent[]>(
    () =>
      eventList.map(normalizeCalendarEvent).filter((e): e is NormalizedCalendarEvent => e !== null),
    [eventList]
  );
  const calendarEvents = useMemo<ReactBigCalendarEvent[]>(
    () => normalizedEvents.map(mapToBigCalendarEvent),
    [normalizedEvents]
  );
  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    setEventList((prev) => prev.map((evt) => (evt.id === updatedEvent.id ? updatedEvent : evt)));
    setSelectedEvent((current) =>
      current && current.id === updatedEvent.id ? normalizeCalendarEvent(updatedEvent) : current
    );
  };
  const components = {
    toolbar: (props: {
      label: string;
      onNavigate: (_action: "PREV" | "NEXT" | "TODAY") => void;
    }) => <CustomToolbar label={props.label} onNavigate={props.onNavigate} />,
    event: IconEventsCard,
  };

  return (
    <>
      <div className={styles.calendarWrapper}>
        {/* @ts-expect-error: Suppress invalid JSX component type error for BigCalendar, waiting update for react 19 */}
        <BigCalendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          popup
          views={["month"]}
          showAllEvents={true}
          onSelectEvent={(event: ReactBigCalendarEvent) => {
            const normalized = normalizedEvents.find((e) => e.id === event.id);
            setSelectedEvent(normalized ?? null);
          }}
          components={components}
        />
      </div>

      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          isSignedUp={signUps.has(selectedEvent.id)}
          userIstid={userIstid}
          isAdmin={isAdmin}
          onSignUpChange={(eventId: string, signedUp: boolean) => {
            setSignUps((prev) => {
              const newSet = new Set(prev);
              if (signedUp) {
                newSet.add(eventId);
              } else {
                newSet.delete(eventId);
              }
              return newSet;
            });
          }}
          onUpdate={(updatedEvent?: CalendarEvent) =>
            handleEventUpdate(updatedEvent ?? selectedEvent!.raw)
          }
        />
      )}
    </>
  );
}
