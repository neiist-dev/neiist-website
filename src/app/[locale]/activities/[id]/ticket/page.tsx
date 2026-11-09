import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, ColorfulText } from "@neiist/ui";
import { LuMapPin, LuClock, LuArrowLeft, LuReceipt } from "react-icons/lu";
import Linkify from "linkify-react";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  getUserEventTicket,
  getEventTicketByCode,
  getActivityByIdFromDb,
} from "@/lib/db/repositories/event.repository";
import TicketPass from "@/components/activities/TicketPass";
import TicketDownloadIcsButton from "@/components/activities/TicketDownloadIcsButton";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale } from "@/i18n/i18n-config";
import GlobalLoading from "@/app/loading";
import styles from "@/styles/pages/Ticket.module.css";

interface TicketPageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ code?: string; from?: string }>;
}

async function TicketContent({ params, searchParams }: TicketPageProps) {
  const [resolvedParams, resolvedSearch, session] = await Promise.all([
    params,
    searchParams,
    getAuthenticatedUser(),
  ]);

  const { locale: rawLocale, id } = resolvedParams;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);
  const code = resolvedSearch.code;
  const backHref =
    resolvedSearch.from === "my-tickets" ? `/${locale}/my-tickets` : `/${locale}/activities`;
  const currentIstid = session?.user.istid;

  const [ticketPass, activity] = await Promise.all([
    currentIstid
      ? getUserEventTicket(id, currentIstid)
      : code
        ? getEventTicketByCode(code)
        : Promise.resolve(null),
    getActivityByIdFromDb(id),
  ]);

  if (!ticketPass || !activity) {
    notFound();
  }

  const startVal = activity.start;
  const endVal = activity.end;
  const formattedStart = startVal
    ? new Date(startVal).toLocaleString(locale === "pt" ? "pt-PT" : "en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const formattedEndTime =
    endVal && !activity.allDay
      ? new Date(endVal).toLocaleTimeString(locale === "pt" ? "pt-PT" : "en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <div className={styles.container}>
      <Link href={backHref} className={styles.backLink}>
        <LuArrowLeft size={16} />
        <span>{dict.ticket_pass.back_to_activities}</span>
      </Link>

      <div className={styles.layout}>
        <div className={styles.content}>
          <header className={styles.header}>
            <ColorfulText as="h1" text={activity.title} className={styles.title} />
            <Badge variant={ticketPass.is_paid ? "primary" : "outline"} size="md">
              {ticketPass.is_paid ? dict.ticket_pass.paid_ticket : dict.ticket_pass.free_signup}
            </Badge>
          </header>

          <div className={styles.metaList}>
            <span>
              <LuClock size={16} />
              {formattedStart}
              {formattedEndTime ? ` — ${formattedEndTime}` : ""}
            </span>

            {activity.location && (
              <span>
                <LuMapPin size={16} />
                {activity.location}
              </span>
            )}

            {ticketPass.order_number && (
              <span>
                <LuReceipt size={16} />
                {dict.ticket_pass.order_prefix}{" "}
                <Link href={`/${locale}/my-tickets?orderId=${ticketPass.order_number}`}>
                  {ticketPass.order_number}
                </Link>
              </span>
            )}
          </div>

          {activity.description && (
            <p className={styles.description}>
              <Linkify options={{ target: "_blank", rel: "noopener noreferrer" }}>
                {activity.description}
              </Linkify>
            </p>
          )}

          <div>
            <TicketDownloadIcsButton
              activityId={activity.id}
              label={dict.ticket_pass.download_calendar}
              fullWidth={false}
            />
          </div>

          {ticketPass.form_responses && Object.keys(ticketPass.form_responses).length > 0 && (
            <div className={styles.responses}>
              <h3>{dict.ticket_pass.responses_title}</h3>

              <div className={styles.responsesGrid}>
                {Object.entries(ticketPass.form_responses).map(([label, val]) => (
                  <div key={label} className={styles.responseCard}>
                    <span className={styles.responseLabel}>{label}</span>
                    <span className={styles.responseValue}>
                      {typeof val === "boolean"
                        ? val
                          ? dict.ticket_pass.yes
                          : dict.ticket_pass.no
                        : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside>
          <TicketPass ticket={ticketPass} dict={dict.ticket_pass} locale={locale} />
        </aside>
      </div>
    </div>
  );
}

export default function TicketPage(props: TicketPageProps) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <TicketContent {...props} />
    </Suspense>
  );
}
