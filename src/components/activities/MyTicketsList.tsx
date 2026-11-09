"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, EmptyState, SearchInput } from "@neiist/ui";
import { LuTicket, LuCalendar } from "react-icons/lu";
import type { Ticket } from "@/types/events";
import type { Product } from "@/types/shop/product";
import type { Order } from "@/types/shop/order";
import type { Dictionary } from "@/i18n/dictionaries";
import { useSearch } from "@/hooks/useSearch";
import { findItemVariant, getItemImage } from "@/utils/shop/shopUtils";
import { ALL_ICONS } from "@/components/activities/EventIcons";
import styles from "@/styles/components/activities/MyTickets.module.css";

interface MyTicketsListProps {
  tickets: Ticket[];
  products?: Product[];
  orders?: Order[];
  dict: Dictionary["tickets"];
  basePath: string;
}

export default function MyTicketsList({
  tickets,
  products = [],
  orders = [],
  dict,
  basePath,
}: MyTicketsListProps) {
  const router = useRouter();

  const {
    results: filteredTickets,
    query,
    setQuery,
  } = useSearch<Ticket>({
    data: tickets,
    fields: [
      { field: "event_title", boost: 4 },
      { field: "ticket_code", boost: 3 },
      { field: "order_number", boost: 2 },
    ],
    idField: "ticket_code",
    returnAllWhenEmpty: true,
  });

  const getTicketImage = (ticket: Ticket): string | null => {
    if (ticket.order_number && orders.length > 0) {
      const order = orders.find((o) => o.order_number === ticket.order_number);
      if (order?.items && order.items.length > 0) {
        const item =
          order.items.find(
            (i) => i.event_id === ticket.event_id || i.product_type === "event_ticket"
          ) || order.items[0];
        const product = products.find((p) => String(p.id) === String(item.product_id));
        if (product) {
          const variantObj = findItemVariant(product, {
            variant_id: item.variant_id,
            variant_options: item.variant_options,
          });
          const img = getItemImage(product, variantObj);
          if (img) return img;
        }
      }
    }

    if (
      ticket.event_custom_icon &&
      (ticket.event_custom_icon.startsWith("/") ||
        ticket.event_custom_icon.startsWith("http://") ||
        ticket.event_custom_icon.startsWith("https://"))
    ) {
      return ticket.event_custom_icon;
    }

    return null;
  };

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={<LuTicket size={48} />}
        title={dict.no_tickets}
        description={dict.empty_desc}
        action={
          <Button
            variant="solid"
            color="primary"
            onClick={() => router.push(`${basePath}/activities`)}>
            <LuCalendar size={18} />
            <span>{dict.explore_events}</span>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <div className={styles.searchRow}>
        <div className={styles.searchContainer}>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={dict.search_placeholder}
            aria-label={dict.search_aria_label}
            clearLabel={dict.clear_search}
          />
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className={styles.emptySearchResults}>{dict.no_search_results}</div>
      ) : (
        <div className={styles.ticketsGrid}>
          {filteredTickets.map((ticket) => {
            const isValidated = Boolean(ticket.checked_in_at);
            const statusLabel = isValidated ? dict.status_checked_in : dict.status_confirmed;

            const cardHref = ticket.order_number
              ? `${basePath}/my-tickets?orderId=${ticket.order_number}`
              : `${basePath}/activities/${ticket.event_id}/ticket?from=my-tickets`;

            const ticketImg = getTicketImage(ticket);

            const Icon =
              ticket.event_custom_icon && ALL_ICONS[ticket.event_custom_icon]
                ? ALL_ICONS[ticket.event_custom_icon]
                : LuTicket;

            return (
              <div key={ticket.ticket_code} className={styles.ticketCard}>
                <Link
                  href={cardHref}
                  scroll={false}
                  className={styles.ticketCardLink}
                  aria-label={`${ticket.event_title} - ${statusLabel}`}>
                  <div
                    className={`${styles.orderImageWrapper} ${
                      ticketImg ? styles.orderImageWrapperWithImage : styles.orderImageWrapperEmpty
                    }`}>
                    {ticketImg ? (
                      <Image
                        src={ticketImg}
                        alt={ticket.event_title || dict.ticket_code}
                        width={367}
                        height={485}
                        className={styles.orderImage}
                      />
                    ) : (
                      <Icon size={52} />
                    )}
                  </div>

                  <div className={styles.orderInfo}>
                    <div className={styles.orderProduct}>{ticket.event_title}</div>
                    <div className={styles.orderStatus}>{statusLabel}</div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
