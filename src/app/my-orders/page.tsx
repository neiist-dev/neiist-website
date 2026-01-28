import MyOrdersList from "@/components/shop/MyOrdersList";
import OrderDetailOverlay from "@/components/shop/OrderDetailsOverlay";
import { getUserFromJWT } from "@/utils/authUtils";
import { getAllOrders, getAllProducts } from "@/utils/dbUtils";
import { cookies } from "next/headers";

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function MyOrdersPage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const jwtUser = sessionToken ? getUserFromJWT(sessionToken) : undefined;

  const [allOrders, products] = await Promise.all([getAllOrders(), getAllProducts()]);
  const myOrders = jwtUser ? allOrders.filter((o) => o.user_istid === jwtUser.istid) : [];

  return (
    <>
      <MyOrdersList orders={myOrders} products={products} />
      {orderId && (
        <OrderDetailOverlay
          orderId={Number(orderId)}
          orders={myOrders}
          canManage={false}
          basePath="/my-orders"
          canEditNotes={true}
        />
      )}
    </>
  );
}
