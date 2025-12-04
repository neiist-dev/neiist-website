import MyOrdersList from "@/components/shop/MyOrdersList";
import OrderDetailOverlay from "@/components/shop/OrderDetailsOverlay";
import { getAllOrders, getAllProducts } from "@/utils/dbUtils";
import { cookies } from "next/headers";

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function MyOrdersPage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;
  const cookieStore = await cookies();
  const userDataCookie = cookieStore.get("user_data")?.value;
  const userData = userDataCookie ? JSON.parse(userDataCookie) : null;

  const [allOrders, products] = await Promise.all([getAllOrders(), getAllProducts()]);
  const myOrders = userData ? allOrders.filter((o) => o.user_istid === userData.istid) : [];

  return (
    <>
      <MyOrdersList orders={myOrders} products={products} />
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
