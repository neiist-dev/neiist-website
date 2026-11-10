import { Suspense } from "react";
import { redirect } from "next/navigation";
import OrdersTable from "@/components/shop/manage/OrdersTable";
import OrderDetailOverlay from "@/components/shop/manage/modals/OrderDetailsOverlay";
import { getAllOrders, getAllProducts } from "@/lib/db/repositories/shop.repository";
import { requireUser } from "@/lib/auth";
import { sanitizeOrder } from "@/utils/shop/shopUtils";
import { isCurrentAcademicYear } from "@/utils/academicYearUtils";
import GlobalLoading from "@/app/loading";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";
import { Order } from "@/types/shop/order";
import { hasPermission } from "@/lib/security/permissions";

interface PageProps {
  params: LocaleParams;
  searchParams: Promise<{ orderId?: string; archive?: string }>;
}

async function OrdersManagementContent({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams]);
  const locale = isValidLocale(resolvedParams.locale) ? resolvedParams.locale : defaultLocale;

  const session = await requireUser();
  const { user } = session;
  if (
    !hasPermission(user, "orders:read") &&
    !hasPermission(user, "orders:deliver") &&
    !hasPermission(user, "orders:write")
  ) {
    redirect(`/${locale}/unauthorized`);
  }

  const isArchive = resolvedSearch.archive === "true";
  const selectedOrderId = resolvedSearch.orderId ? String(resolvedSearch.orderId).trim() : null;
  const dict = getDictionary(locale);

  const canReadCustomer = hasPermission(user, "orders:read_customer");
  const canEditOrder = hasPermission(user, "orders:write");
  const canDeliver = hasPermission(user, "orders:deliver") || canEditOrder;
  const canOverride = hasPermission(user, "orders:override");

  const [allOrders, products] = await Promise.all([getAllOrders(), getAllProducts(true)]);

  const filteredOrders = allOrders.filter((order) =>
    isArchive ? !isCurrentAcademicYear(order.created_at) : isCurrentAcademicYear(order.created_at)
  );
  const orders = canReadCustomer ? filteredOrders : filteredOrders.map(sanitizeOrder);

  let selectedOrder: Order | null = null;
  if (selectedOrderId) {
    const rawOrder = allOrders.find((o) => o.order_number === selectedOrderId);
    selectedOrder = rawOrder ? (canReadCustomer ? rawOrder : sanitizeOrder(rawOrder)) : null;
  }
  const overlayBasePath = `/${locale}/orders${isArchive ? "?archive=true" : ""}`;

  return (
    <>
      <OrdersTable
        orders={orders}
        products={products}
        dict={dict.orders_table}
        basePath={`/${locale}`}
        isArchive={isArchive}
        canOverride={canOverride}
      />
      {selectedOrder && (
        <OrderDetailOverlay
          order={selectedOrder}
          canManage={canEditOrder}
          canDeliver={canDeliver}
          canOverride={canOverride}
          basePath={overlayBasePath}
          canEditNotes={canEditOrder}
          dict={dict.order_details}
        />
      )}
    </>
  );
}

export default function OrdersManagementPage(props: PageProps) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <OrdersManagementContent {...props} />
    </Suspense>
  );
}
