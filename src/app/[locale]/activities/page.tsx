import Calendar from "@/components/activities/Calendar";
import { syncNotionEventsToDb } from "@/utils/eventsUtils";
import { UserRole } from "@/types/user";
import ColorfulText from "@/components/ColorfulText";
import styles from "@/styles/pages/Activities.module.css";
import { getActivitiesEventsFromDb } from "@/lib/db/repositories/event.repository";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

async function getEventsAndSubscriptions() {
  const session = await getAuthenticatedUser();
  const istid = session?.user.istid ?? null;
  const isAdmin = session?.roles.includes(UserRole._ADMIN) ?? false;

  let events = await getActivitiesEventsFromDb();

  // If no events in DB, sync from Notion
  if (events.length === 0) {
    await syncNotionEventsToDb();
    events = await getActivitiesEventsFromDb();
  }

  const signedUpEventIds = istid
    ? events.filter((event) => event.subscribers?.includes(istid)).map((event) => event.id)
    : [];

  return { events, signedUpEventIds, istid, isAdmin };
}

export default async function ActivitiesPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);

  const { eventId } = await searchParams;
  const { events, signedUpEventIds } = await getEventsAndSubscriptions();

  return (
    <div className={styles.container}>
      <ColorfulText as="h1" className={styles.title} text={dict.activities.title} />
      <Calendar
        events={events}
        signedUpEventIds={signedUpEventIds}
        initialSelectedEventId={eventId}
        dict={dict.activities}
        currentLocale={locale}
      />
    </div>
  );
}
