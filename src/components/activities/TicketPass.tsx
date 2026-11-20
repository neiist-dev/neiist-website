import TicketPassCanvas from "@/components/activities/TicketPassCanvas";
import type { Ticket } from "@/types/events";
import type { Dictionary } from "@/i18n/dictionaries";
import styles from "@/styles/components/activities/TicketPass.module.css";

interface TicketPassProps {
  ticket: Ticket;
  dict: Dictionary["ticket_pass"];
  locale: string;
}

export default function TicketPass({ ticket, dict, locale }: TicketPassProps) {
  const isCheckedIn = Boolean(ticket.checked_in_at);

  return (
    <div className={styles.card}>
      <div className={styles.qrWrapper}>
        <TicketPassCanvas value={ticket.ticket_code} isValidated={isCheckedIn} />
      </div>

      <div className={styles.details}>
        <span className={styles.label}>{dict.title}</span>
        <div className={styles.code}>{ticket.ticket_code}</div>
        <p className={styles.instructions}>{dict.instructions}</p>
        {isCheckedIn && (
          <span className={styles.validation}>
            {ticket.checked_in_by_name
              ? dict.validated_at_by
                  .replace(
                    "{time}",
                    new Date(ticket.checked_in_at!).toLocaleTimeString(
                      locale === "pt" ? "pt-PT" : "en-GB",
                      { hour: "2-digit", minute: "2-digit" }
                    )
                  )
                  .replace("{staff}", ticket.checked_in_by_name)
              : dict.validated_at.replace(
                  "{time}",
                  new Date(ticket.checked_in_at!).toLocaleTimeString(
                    locale === "pt" ? "pt-PT" : "en-GB",
                    { hour: "2-digit", minute: "2-digit" }
                  )
                )}
          </span>
        )}
      </div>
    </div>
  );
}
