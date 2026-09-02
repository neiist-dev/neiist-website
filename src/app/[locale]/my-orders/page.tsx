import { Suspense } from "react";
import MyOrdersList from "@/components/shop/MyOrdersList";
import OrderDetailOverlay from "@/components/shop/OrderDetailsOverlay";
import { requireUser } from "@/lib/auth";
import { getAllOrders, getAllProducts } from "@/lib/db/repositories/shop.repository";
import GlobalLoading from "@/app/loading";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

interface PageProps {
  params: Promise<LocaleParams>;
  searchParams: Promise<{ orderId?: string }>;
}

async function MyOrdersContent({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearch, auth] = await Promise.all([
    params,
    searchParams,
    requireUser(),
  ]);

  const locale = isValidLocale(resolvedParams.locale) ? resolvedParams.locale : defaultLocale;
  const dict = getDictionary(locale);

  const [allOrders, products] = await Promise.all([getAllOrders(), getAllProducts(true)]);
  const myOrders = allOrders.filter((order) => order.user_istid === auth.user.istid);
  const selectedOrderId = resolvedSearch.orderId ? Number(resolvedSearch.orderId) : null;
  const selectedOrder = selectedOrderId
    ? (myOrders.find((order) => order.id === selectedOrderId) ?? null)
    : null;

  return (
    <>
      <MyOrdersList
        orders={myOrders}
        products={products}
        dict={dict.my_orders}
        basePath={`/${locale}`}
      />
      {selectedOrder && (
        <OrderDetailOverlay
          order={selectedOrder}
          canManage={false}
          basePath={`/${locale}/my-orders`}
          canEditNotes={true}
          dict={dict.order_details}
          posPaymentDict={dict.pos_payment}
        />
      )}
    </>
  );
}

export default function MyOrdersPage(props: PageProps) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <MyOrdersContent {...props} />
    </Suspense>
  );
}
