import { Suspense } from "react";
import MyOrdersList from "@/components/shop/MyOrdersList";
import OrderDetailOverlay from "@/components/shop/OrderDetailsOverlay";
import { requireUser } from "@/lib/auth";
import { getAllOrders, getAllProducts } from "@/lib/db/repositories/shop.repository";
import GlobalLoading from "@/app/loading";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

interface PageProps {
  params: LocaleParams;
  searchParams: Promise<{ orderId?: string }>;
}

async function MyOrdersContent({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dictMyOrders = getDictionary(locale).my_orders;
  const dictOrderDetails = getDictionary(locale).order_details;
  const dictPosPayment = getDictionary(locale).pos_payment;

  const { orderId } = await searchParams;
  const { user } = await requireUser();

  const [allOrders, products] = await Promise.all([getAllOrders(), getAllProducts(true)]);
  const myOrders = allOrders.filter((order) => order.user_istid === user.istid);

  return (
    <>
      <MyOrdersList
        orders={myOrders}
        products={products}
        dict={dictMyOrders}
        basePath={`/${locale}`}
      />
      {orderId && (
        <OrderDetailOverlay
          orderId={Number(orderId)}
          orders={myOrders}
          canManage={false}
          basePath={`/${locale}/my-orders`}
          canEditNotes={true}
          dict={dictOrderDetails}
          posPaymentDict={dictPosPayment}
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
