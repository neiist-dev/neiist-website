import type { Activity } from "@/types/events";

export const truncateToDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

export const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return truncateToDay(c);
};

export const datesMatch = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const formatTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}h${String(date.getMinutes()).padStart(2, "0")}`;

export const formatDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

export function formatEventDateTime(event: Activity): {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
} {
  if (!event?.start && !event?.end)
    return { startDate: "TBD", endDate: "TBD", startTime: "TBD", endTime: "TBD", isAllDay: false };

  const start = new Date(event.start);
  const end = new Date(event.end);
  const startTime = `${String(start.getHours()).padStart(2, "0")}h${String(start.getMinutes()).padStart(2, "0")}`;
  const endTime = `${String(end.getHours()).padStart(2, "0")}h${String(end.getMinutes()).padStart(2, "0")}`;

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
    startTime,
    endTime,
    isAllDay: Boolean(event.allDay),
  };
}
