import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserTickets } from "@/lib/db/repositories/event.repository";
import { getUserOrders, getAllProducts } from "@/lib/db/repositories/shop.repository";
import MyTicketsList from "@/components/activities/MyTicketsList";
import OrderDetailOverlay from "@/components/shop/manage/modals/OrderDetailsOverlay";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";
import GlobalLoading from "@/app/loading";
import { ColorfulText } from "@neiist/ui";
import styles from "@/styles/components/activities/MyTickets.module.css";

interface PageProps {
  params: LocaleParams;
  searchParams: Promise<{ orderId?: string }>;
}

async function MyTicketsContent({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearch, session] = await Promise.all([
    params,
    searchParams,
    getAuthenticatedUser(),
  ]);

  const { locale: rawLocale } = resolvedParams;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);

  if (!session?.user) redirect(`/${locale}`);

  const [tickets, myOrders, products] = await Promise.all([
    getUserTickets(session.user.istid),
    getUserOrders(session.user.istid),
    getAllProducts(true),
  ]);

  const selectedOrderId = resolvedSearch.orderId ? String(resolvedSearch.orderId).trim() : null;
  const selectedOrder = selectedOrderId
    ? (myOrders.find((order) => order.order_number === selectedOrderId) ?? null)
    : null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <ColorfulText as="h1" className={styles.title} text={dict.tickets.title} />
        <p className={styles.subtitle}>{dict.tickets.subtitle}</p>
      </div>

      <MyTicketsList
        tickets={tickets}
        products={products}
        orders={myOrders}
        dict={dict.tickets}
        basePath={`/${locale}`}
      />

      {selectedOrder && (
        <OrderDetailOverlay
          order={selectedOrder}
          canManage={false}
          basePath={`/${locale}/my-tickets`}
          dict={dict.order_details}
        />
      )}
    </div>
  );
}

export default function MyTicketsPage(props: PageProps) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <MyTicketsContent {...props} />
    </Suspense>
  );
}
