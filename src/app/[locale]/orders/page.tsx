import { Suspense } from "react";
import OrdersTable from "@/components/shop/OrdersTable";
import OrderDetailOverlay from "@/components/shop/OrderDetailsOverlay";
import { UserRole } from "@/types/user";
import { getAllOrders, getAllProducts } from "@/lib/db/repositories/shop.repository";
import { requireRoles } from "@/lib/auth";
import { sanitizeOrder } from "@/utils/shop/shopUtils";
import GlobalLoading from "@/app/loading";

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

async function OrdersManagementContent({ searchParams }: PageProps) {
  const { roles } = await requireRoles([
    UserRole._ADMIN,
    UserRole._COORDINATOR,
    UserRole._SHOP_MANAGER,
    UserRole._MEMBER,
  ]);

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
      <OrdersTable orders={orders} products={products} />
      {orderId && (
        <OrderDetailOverlay
          orderId={Number(orderId)}
          orders={orders}
          canManage={isManager}
          basePath="/orders"
          canEditNotes={canEditOrder}
          canEditItems={canEditOrder}
          products={products}
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
