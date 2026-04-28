import Calendar from "@/components/activities/Calendar";
import { getActivitiesEventsFromDb } from "@/utils/dbUtils";
import { syncNotionEventsToDb } from "@/utils/eventsUtils";
import { getLocale, getDictionary } from "@/lib/i18n";
import { UserRole } from "@/types/user";
import { serverCheckRoles } from "@/utils/permissionUtils";
import styles from "@/styles/pages/Activities.module.css";

async function getEventsAndSubscriptions() {
  let istid: string | null = null;
  let isAdmin = false;

  const perm = await serverCheckRoles([]); // authenticate
  if (perm.isAuthorized && perm.user) {
    istid = perm.user.istid;
    isAdmin = perm.roles?.includes(UserRole._ADMIN) ?? false;
  }

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
  searchParams,
}: {
  searchParams?: Promise<{ eventId?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const { events, signedUpEventIds } = await getEventsAndSubscriptions();
  const urlSelectdEventID = params.eventId || undefined;
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {(() => {
          const letters: string[] | undefined = dict.activities?.title_letters;
          const title: string | undefined = dict.activities?.title;
          if (letters && letters.length > 0) {
            return letters.map((l: string, i: number) => (
              <span key={i} className={(styles as any)[["primary", "secondary", "tertiary", "quaternary"][i]]}>
                {l}
              </span>
            ));
          }
          if (title) {
            return <span>{title}</span>;
          }
          return null;
        })()}
      </h1>
          <Calendar
            events={events}
            signedUpEventIds={signedUpEventIds}
            initialSelectedEventId={urlSelectdEventID}
            dict={dict.activities}
            locale={locale}
          />
    </div>
  );
}
