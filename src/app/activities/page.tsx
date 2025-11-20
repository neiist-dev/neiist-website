import { cookies } from "next/headers";
import Calendar from "@/components/activities/Calendar";
import { getActivitiesEventsFromDb, getUser } from "@/utils/dbUtils";
import { syncNotionEventsToDb } from "@/utils/eventsUtils";
import { UserRole, mapRoleToUserRole } from "@/types/user";
import styles from "@/styles/pages/Activities.module.css";

async function getEventsAndSubscriptions() {
  const cookieStore = await cookies();
  const userDataCookie = cookieStore.get("user_data")?.value;
  let istid: string | null = null;
  let isAdmin = false;

  if (userDataCookie) {
    try {
      const userData = JSON.parse(userDataCookie);
      istid = userData.istid;
      if (istid) {
        const user = await getUser(istid);
        if (user) {
          const userRoles = user.roles?.map((role) => mapRoleToUserRole(role)) || [];
          isAdmin = userRoles.includes(UserRole._ADMIN);
        }
      }
    } catch {
      istid = null;
    }
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

export default async function ActivitiesPage() {
  const { events, signedUpEventIds, istid, isAdmin } = await getEventsAndSubscriptions();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <span className={styles.primary}>Ati</span>
        <span className={styles.secondary}>vi</span>
        <span className={styles.tertiary}>da</span>
        <span className={styles.quaternary}>des</span>
      </h1>
      <Calendar
        events={events}
        signedUpEventIds={signedUpEventIds}
        userIstid={istid}
        isAdmin={isAdmin}
      />
    </div>
  );
}
