import { Suspense } from "react";
import MyOrdersList from "@/components/shop/checkout/MyOrdersList";
import OrderDetailOverlay from "@/components/shop/manage/modals/OrderDetailsOverlay";
import { requireUser } from "@/lib/auth";
import { getUserOrders, getAllProducts } from "@/lib/db/repositories/shop.repository";
import { isTicketOrder } from "@/utils/shop/orderStatusUtils";
import GlobalLoading from "@/app/loading";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

interface PageProps {
  params: LocaleParams;
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

  const [userOrders, products] = await Promise.all([
    getUserOrders(auth.user.istid),
    getAllProducts(true),
  ]);
  const myOrders = userOrders.filter((order) => !isTicketOrder(order));
  const selectedOrderId = resolvedSearch.orderId ? String(resolvedSearch.orderId).trim() : null;
  const selectedOrder = selectedOrderId
    ? (myOrders.find((order) => order.order_number === selectedOrderId) ?? null)
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
          dict={dict.order_details}
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
