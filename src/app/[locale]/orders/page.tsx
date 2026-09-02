import { Suspense } from "react";
import OrdersTable from "@/components/shop/OrdersTable";
import OrderDetailOverlay from "@/components/shop/OrderDetailsOverlay";
import { UserRole } from "@/types/user";
import { getAllOrders, getAllProducts } from "@/lib/db/repositories/shop.repository";
import { requireRoles } from "@/lib/auth";
import { sanitizeOrder } from "@/utils/shop/shopUtils";
import { isCurrentAcademicYear } from "@/utils/shop/orderFilterUtils";
import GlobalLoading from "@/app/loading";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";
import { Order } from "@/types/shop/order";

interface PageProps {
  params: Promise<LocaleParams>;
  searchParams: Promise<{ orderId?: string; archive?: string }>;
}

async function OrdersManagementContent({ params, searchParams }: PageProps) {
  const { roles } = await requireRoles([
    UserRole._ADMIN,
    UserRole._COORDINATOR,
    UserRole._SHOP_MANAGER,
  ]);

  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams]);
  const locale = isValidLocale(resolvedParams.locale) ? resolvedParams.locale : defaultLocale;
  const isArchive = resolvedSearch.archive === "true";
  const selectedOrderId = resolvedSearch.orderId ? Number(resolvedSearch.orderId) : null;
  const dict = getDictionary(locale);

  const isManager = roles.some((r) =>
    [UserRole._ADMIN, UserRole._COORDINATOR, UserRole._SHOP_MANAGER].includes(r)
  );
  const canEditOrder = roles.some((r) => [UserRole._ADMIN, UserRole._COORDINATOR].includes(r));

  const [allOrders, products] = await Promise.all([getAllOrders(), getAllProducts(true)]);

  const filteredOrders = allOrders.filter((order) =>
    isArchive ? !isCurrentAcademicYear(order.created_at) : isCurrentAcademicYear(order.created_at)
  );
  const orders = isManager ? filteredOrders : filteredOrders.map(sanitizeOrder);

  let selectedOrder: Order | null = null;
  if (selectedOrderId) {
    const rawOrder = allOrders.find((o) => o.id === selectedOrderId);
    selectedOrder = rawOrder ? (isManager ? rawOrder : sanitizeOrder(rawOrder)) : null;
  }
  const overlayBasePath = `/${locale}/orders${isArchive ? "?archive=true" : ""}`;

  return (
    <>
      <OrdersTable
        orders={orders}
        products={products}
        dict={dict.orders_table}
        posPaymentDict={dict.pos_payment}
        basePath={`/${locale}`}
        isArchive={isArchive}
      />
      {selectedOrder && (
        <OrderDetailOverlay
          order={selectedOrder}
          canManage={isManager}
          basePath={overlayBasePath}
          canEditNotes={canEditOrder}
          canEditItems={canEditOrder}
          products={products}
          dict={dict.order_details}
          posPaymentDict={dict.pos_payment}
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
