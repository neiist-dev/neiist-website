import OrdersTable from "@/components/shop/OrdersTable";
import OrderDetailOverlay from "@/components/shop/OrderDetailsOverlay";
import { getAllOrders, getAllProducts } from "@/utils/dbUtils";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { UserRole } from "@/types/user";

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function OrdersManagementPage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;
  const [orders, products] = await Promise.all([getAllOrders(), getAllProducts()]);
  const roles = (await serverCheckRoles([]))?.roles ?? [UserRole._GUEST];

  const isCoordinatorOrAbove =
    roles.includes(UserRole._COORDINATOR) || roles.includes(UserRole._ADMIN);

  return (
    <>
      <OrdersTable orders={orders} products={products} />
      {orderId && (
        <OrderDetailOverlay
          orderId={Number(orderId)}
          orders={orders}
          canManage={isCoordinatorOrAbove}
          basePath="/orders"
        />
      )}
    </>
  );
}
