import MyOrdersList from "@/components/shop/MyOrdersList";
import OrderDetailOverlay from "@/components/shop/OrderDetailsOverlay";
import { getAllOrders } from "@/utils/dbUtils";
import { cookies } from "next/headers";

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function MyOrdersPage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;
  const cookieStore = await cookies();
  const userDataCookie = cookieStore.get("userData")?.value;
  const userData = userDataCookie ? JSON.parse(userDataCookie) : null;

  const allOrders = await getAllOrders();
  const myOrders = userData ? allOrders.filter((o) => o.user_istid === userData.istid) : [];

  return (
    <>
      <MyOrdersList orders={myOrders} />
      {orderId && (
        <OrderDetailOverlay
          orderId={Number(orderId)}
          orders={myOrders}
          canManage={false}
          basePath="/my-orders"
        />
      )}
    </>
  );
}
