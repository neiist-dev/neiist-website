import OrdersTable from "@/components/shop/OrdersTable";
import OrderDetailOverlay from "@/components/shop/OrderDetailsOverlay";
import { getAllOrders, getAllProducts } from "@/utils/dbUtils";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { UserRole } from "@/types/user";
import { getLocale, getDictionary } from "@/lib/i18n";
import { OrderDetailsOverlayDict, OrdersTableDict } from "@/types/i18n";

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function OrdersManagementPage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const [orders, products] = await Promise.all([getAllOrders(), getAllProducts(true)]);
  const roles = (await serverCheckRoles([]))?.roles ?? [UserRole._GUEST];

  const canManage =
    roles.includes(UserRole._COORDINATOR) ||
    roles.includes(UserRole._ADMIN) ||
    roles.includes(UserRole._SHOP_MANAGER);

  const canEditOrder = roles.includes(UserRole._ADMIN) || roles.includes(UserRole._COORDINATOR);

  return (
    <>
      <OrdersTable orders={orders} products={products} locale={locale} dict={dict as OrdersTableDict} />
      {orderId && (
        <OrderDetailOverlay
          orderId={Number(orderId)}
          orders={orders}
          canManage={canManage}
          basePath="/orders"
          canEditNotes={canEditOrder}
          canEditItems={canEditOrder}
          products={products}
          dict={dict as OrderDetailsOverlayDict}
        />
      )}
    </>
  );
}
