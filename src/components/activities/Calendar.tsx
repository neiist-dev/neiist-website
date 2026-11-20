"use client";

import { useMemo, useState, useEffect, useCallback, createContext, use } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer, Views, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, isBefore, startOfDay, addDays } from "date-fns";
import { pt, enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/styles/components/activities/ReactBigCalendar.css";
import EventDetails from "@/components/activities/EventDetails";
import type { Activity } from "@/types/events";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getEventIcon as getEventIconType } from "@/components/activities/EventIcons";
import styles from "@/styles/components/activities/Calendar.module.css";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/i18n-config";
import { useSearchParams } from "next/navigation";

import { Button, Tabs, TabItem } from "@neiist/ui";

const dateLocales = { pt, en: enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday start per standard
  getDay,
  locales: dateLocales,
});

interface CalendarToolbarContextType {
  dict: Dictionary["activities"];
  currentView: View;
  onViewChange: (_view: View) => void;
}

const CalendarToolbarContext = createContext<CalendarToolbarContextType | null>(null);

function CalendarToolbar(toolbarProps: {
  label: string;
  onNavigate: (_action: "PREV" | "NEXT" | "TODAY") => void;
}) {
  const ctx = use(CalendarToolbarContext);
  if (!ctx) return null;
  const { dict, currentView, onViewChange } = ctx;

  const viewTabs: TabItem[] = [
    { id: Views.MONTH, name: dict.views?.month || "Mês", content: null },
    { id: Views.WEEK, name: dict.views?.week || "Semana", content: null },
  ];

  return (
    <div className={styles.header}>
      <div className={styles.leftControls}>
        <Button
          variant="outline"
          size="sm"
          shape="pill"
          onClick={() => toolbarProps.onNavigate("TODAY")}>
          {dict.toolbar.today}
        </Button>
        <div className={styles.navigationButtons}>
          <Button
            variant="ghost"
            size="icon"
            shape="pill"
            onClick={() => toolbarProps.onNavigate("PREV")}
            aria-label={dict.toolbar.prev_month}>
            <FiChevronLeft size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            shape="pill"
            onClick={() => toolbarProps.onNavigate("NEXT")}
            aria-label={dict.toolbar.next_month}>
            <FiChevronRight size={18} />
          </Button>
        </div>
        <span className={styles.monthLabel}>{toolbarProps.label}</span>
      </div>

      <div className={styles.rightControls}>
        <Tabs
          tabs={viewTabs}
          value={currentView}
          onChange={(v) => onViewChange(v as View)}
          size="sm"
          classNames={{
            root: styles.tabsRoot,
            tabBar: styles.tabsBar,
            tabContent: styles.hiddenTabContent,
          }}
        />
      </div>
    </div>
  );
}

interface CalendarProps {
  events: Activity[];
  signedUpEventIds: string[];
  initialSelectedEventId?: string;
  dict: Dictionary["activities"];
  currentLocale: Locale;
}

interface ReactBigCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: Activity;
}

function getEventIcon(event: Activity) {
  const iconName = event?.customIcon || "FaCalendar";
  const Icon = getEventIconType(iconName);
  return <Icon size={16} className={styles.eventIcon} />;
}

function mapToBigCalendarEvent(activity: Activity): ReactBigCalendarEvent {
  const start = new Date(activity.start);
  const end = new Date(activity.end);
  return {
    id: activity.id,
    title: activity.title,
    start,
    end: activity.allDay ? addDays(end, 1) : end,
    allDay: activity.allDay,
    resource: activity,
  };
}

export default function Calendar({
  events,
  signedUpEventIds,
  initialSelectedEventId,
  dict,
  currentLocale,
}: CalendarProps) {
  const searchParams = useSearchParams();

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState<Activity | null>(null);
  const [signUps, setSignUps] = useState<Set<string>>(() => new Set(signedUpEventIds));
  const [eventList, setEventList] = useState<Activity[]>(events);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const paramView = searchParams.get("view");

  const [currentView, setCurrentView] = useState<View>(() => {
    if (paramView === "week") return Views.WEEK;
    return Views.MONTH;
  });

  useEffect(() => {
    setEventList(events);
  }, [events]);

  useEffect(() => {
    setSignUps(new Set(signedUpEventIds));
  }, [signedUpEventIds]);

  // Sync state to URL search params
  const updateUrlParams = useCallback(
    (newView: View) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newView === Views.MONTH) params.delete("view");
      else params.set("view", newView);

      const qs = params.toString();
      const newPath = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
      window.history.replaceState(null, "", newPath);
    },
    [searchParams]
  );

  const handleViewChange = useCallback(
    (view: View) => {
      setCurrentView(view);
      updateUrlParams(view);
    },
    [updateUrlParams]
  );

  const calendarEvents = useMemo<ReactBigCalendarEvent[]>(
    () => eventList.map(mapToBigCalendarEvent),
    [eventList]
  );

  useEffect(() => {
    if (initialSelectedEventId) {
      const found = eventList.find((e) => e.id === initialSelectedEventId);
      if (found) setSelectedEvent(found);
    }
  }, [initialSelectedEventId, eventList]);

  const handleEventUpdate = (updatedEvent: Activity) => {
    setEventList((prev) => prev.map((evt) => (evt.id === updatedEvent.id ? updatedEvent : evt)));
    setSelectedEvent((current) =>
      current && current.id === updatedEvent.id ? updatedEvent : current
    );
  };

  const dayPropGetter = (date: Date) => {
    const now = startOfDay(new Date());
    if (isBefore(date, now)) {
      return { className: "rbc-past-day" };
    }
    return {};
  };

  const eventPropGetter = (event: ReactBigCalendarEvent) => {
    const isPast = isBefore(event.end, new Date());
    const isHovered = hoveredEventId === event.id;
    const classes = [isPast ? "rbc-past-event" : "", isHovered ? "rbc-event-hovered" : ""]
      .filter(Boolean)
      .join(" ");
    return { className: classes };
  };

  const calendarComponents = useMemo(
    () => ({
      toolbar: CalendarToolbar,
      event: ({ event, title }: { event: ReactBigCalendarEvent; title: string }) => (
        <div
          className={styles.eventCard}
          onMouseEnter={() => setHoveredEventId(event.id)}
          onMouseLeave={() => setHoveredEventId(null)}>
          <div className={styles.eventCardLeft}>
            {event.resource && getEventIcon(event.resource)}
            <span className={styles.eventTitle}>{title}</span>
          </div>
        </div>
      ),
    }),
    []
  );

  const toolbarContextValue = useMemo(
    () => ({
      dict,
      currentView,
      onViewChange: handleViewChange,
    }),
    [dict, currentView, handleViewChange]
  );

  return (
    <CalendarToolbarContext value={toolbarContextValue}>
      <div className={styles.calendarWrapper}>
        <BigCalendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          popup
          view={currentView}
          onView={(view: View) => handleViewChange(view)}
          date={currentDate}
          onNavigate={(date: Date) => setCurrentDate(date)}
          views={[Views.MONTH, Views.WEEK]}
          min={new Date(0, 0, 0, 8, 0)} // Timetable window 08:00
          max={new Date(0, 0, 0, 23, 0)} // to 23:00
          showAllEvents={true}
          onSelectEvent={(event: ReactBigCalendarEvent) => {
            setSelectedEvent(event.resource ?? null);
          }}
          components={calendarComponents}
          dayPropGetter={dayPropGetter}
          eventPropGetter={eventPropGetter}
          culture={currentLocale}
        />
      </div>

      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          isSignedUp={signUps.has(selectedEvent.id)}
          onSignUpChange={(eventId: string, signedUp: boolean) => {
            setSignUps((prev) => {
              const newSet = new Set(prev);
              if (signedUp) newSet.add(eventId);
              else newSet.delete(eventId);
              return newSet;
            });
          }}
          onUpdate={(updatedEvent?: Activity) => handleEventUpdate(updatedEvent ?? selectedEvent)}
          dict={dict.details}
          locale={currentLocale}
        />
      )}
    </CalendarToolbarContext>
  );
}
