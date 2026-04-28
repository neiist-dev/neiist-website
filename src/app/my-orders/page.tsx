import MyOrdersList from "@/components/shop/MyOrdersList";
import OrderDetailOverlay from "@/components/shop/OrderDetailsOverlay";
import { getUserFromJWT } from "@/utils/authUtils";
import { getAllOrders, getAllProducts } from "@/utils/dbUtils";
import { cookies } from "next/headers";
import { getLocale, getDictionary } from "@/lib/i18n";

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function MyOrdersPage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const jwtUser = sessionToken ? getUserFromJWT(sessionToken) : undefined;

  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const [allOrders, products] = await Promise.all([getAllOrders(), getAllProducts()]);
  const myOrders = jwtUser ? allOrders.filter((o) => o.user_istid === jwtUser.istid) : [];

  return (
    <>
      <MyOrdersList orders={myOrders} products={products} dict={dict.my_orders} />
      {orderId && (
        <OrderDetailOverlay
          orderId={Number(orderId)}
          orders={myOrders}
          canManage={false}
          basePath="/my-orders"
          canEditNotes={true}
          dict={{
            order_details: dict.order_details,
            confirm_dialog: dict.confirm_dialog,
            new_order_modal: dict.new_order_modal,
            create_user_modal: dict.create_user_modal,
            pos_payment: dict.pos_payment,
          }}
        />
      )}
    </>
  );
}
