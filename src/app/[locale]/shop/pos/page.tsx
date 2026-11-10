import { Suspense } from "react";
import PosDesk from "@/components/shop/pos/PosDesk";
import {
  getAllProducts,
  getAllCategories,
  getOrderByNumber,
} from "@/lib/db/repositories/shop.repository";
import { getAllStations } from "@/lib/db/repositories/pos.repository";
import { requirePermission, requireUser } from "@/lib/auth";
import GlobalLoading from "@/app/loading";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";
import { Order } from "@/types/shop/order";

interface PageProps {
  params: LocaleParams;
  searchParams: Promise<{ orderNumber?: string; orderId?: string }>;
}

async function ShopPosContent({ params, searchParams }: PageProps) {
  const session = await requireUser();
  await requirePermission("pos:access");

  const [{ locale: rawLocale }, resolvedSearch] = await Promise.all([params, searchParams]);
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);
  const targetOrderNumber = resolvedSearch.orderNumber || resolvedSearch.orderId;

  const [products, stations, categories, initialPendingOrder] = await Promise.all([
    getAllProducts("pos"),
    getAllStations(),
    getAllCategories(),
    targetOrderNumber ? getOrderByNumber(String(targetOrderNumber).trim()) : Promise.resolve(null),
  ]);

  return (
    <PosDesk
      products={products}
      stations={stations}
      categories={categories}
      basePath={`/${locale}`}
      initialPendingOrder={initialPendingOrder as Order | null}
      currentUser={session.user}
      dict={dict.pos}
      paymentsDict={dict.payments}
    />
  );
}

export default function ShopPosPage(props: PageProps) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <ShopPosContent {...props} />
    </Suspense>
  );
}
