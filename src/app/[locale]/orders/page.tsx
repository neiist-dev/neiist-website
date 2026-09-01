import { Suspense } from "react";
import OrdersTable from "@/components/shop/OrdersTable";
import OrderDetailOverlay from "@/components/shop/OrderDetailsOverlay";
import { UserRole } from "@/types/user";
import { getAllOrders, getAllProducts } from "@/lib/db/repositories/shop.repository";
import { requireRoles } from "@/lib/auth";
import { sanitizeOrder } from "@/utils/shop/shopUtils";
import GlobalLoading from "@/app/loading";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

interface PageProps {
  params: LocaleParams;
  searchParams: Promise<{ orderId?: string }>;
}

async function OrdersManagementContent({ params, searchParams }: PageProps) {
  const { roles } = await requireRoles([
    UserRole._ADMIN,
    UserRole._COORDINATOR,
    UserRole._SHOP_MANAGER,
    UserRole._MEMBER,
  ]);

  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dictOrdersTable = getDictionary(locale).orders_table;
  const dictOrderDetails = getDictionary(locale).order_details;
  const dictPosPayment = getDictionary(locale).pos_payment;

  const { orderId } = await searchParams;

  const isManager =
    roles.includes(UserRole._COORDINATOR) ||
    roles.includes(UserRole._ADMIN) ||
    roles.includes(UserRole._SHOP_MANAGER);

  const canEditOrder = roles.includes(UserRole._ADMIN) || roles.includes(UserRole._COORDINATOR);

  const [allOrders, products] = await Promise.all([getAllOrders(), getAllProducts(true)]);
  const orders = isManager ? allOrders : allOrders.map(sanitizeOrder);

  return (
    <>
      <OrdersTable
        orders={orders}
        products={products}
        dict={dictOrdersTable}
        posPaymentDict={dictPosPayment}
        basePath={`/${locale}`}
      />
      {orderId && (
        <OrderDetailOverlay
          orderId={Number(orderId)}
          orders={orders}
          canManage={isManager}
          basePath={`/${locale}/orders`}
          canEditNotes={canEditOrder}
          canEditItems={canEditOrder}
          products={products}
          dict={dictOrderDetails}
          posPaymentDict={dictPosPayment}
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
