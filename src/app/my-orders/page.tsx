import { Suspense } from "react";
import MyOrdersList from "@/components/shop/MyOrdersList";
import OrderDetailOverlay from "@/components/shop/OrderDetailsOverlay";
import { requireUser } from "@/lib/auth";
import { getAllOrders, getAllProducts } from "@/lib/db/repositories/shop.repository";
import GlobalLoading from "@/app/loading";

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

async function MyOrdersContent({ searchParams }: PageProps) {
  const { orderId } = await searchParams;
  const { user } = await requireUser();

  const [allOrders, products] = await Promise.all([getAllOrders(), getAllProducts(true)]);
  const myOrders = allOrders.filter((order) => order.user_istid === user.istid);

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

export default function MyOrdersPage(props: PageProps) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <MyOrdersContent {...props} />
    </Suspense>
  );
}
