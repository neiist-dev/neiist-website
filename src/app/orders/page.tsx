import OrdersTable from "@/components/shop/OrdersTable";
import OrderDetailOverlay from "@/components/shop/OrderDetailsOverlay";
import { getAllOrders, getUser } from "@/utils/dbUtils";
import { cookies } from "next/headers";
import { UserRole, mapRoleToUserRole } from "@/types/user";

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function OrdersManagementPage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;
  const orders = await getAllOrders();

  const cookieStore = await cookies();
  const userDataCookie = cookieStore.get("userData")?.value;
  const userData = userDataCookie ? JSON.parse(userDataCookie) : null;

  let user = null;
  let roles: UserRole[] = [UserRole._GUEST];
  if (userData?.istid) {
    user = await getUser(userData.istid);
    if (user?.roles) {
      roles = user.roles.map(mapRoleToUserRole);
    }
  }

  const isCoordinatorOrAbove =
    roles.includes(UserRole._COORDINATOR) || roles.includes(UserRole._ADMIN);

  return (
    <>
      <OrdersTable orders={orders} />
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
