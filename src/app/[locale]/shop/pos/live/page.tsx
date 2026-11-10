import { Suspense } from "react";
import LivePos from "@/components/shop/pos/LivePos";
import { getAllProducts } from "@/lib/db/repositories/shop.repository";
import { getAllStations } from "@/lib/db/repositories/pos.repository";
import { requirePermission, requireUser } from "@/lib/auth";
import GlobalLoading from "@/app/loading";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

async function LivePosContent({ params }: { params: LocaleParams }) {
  const session = await requireUser();
  await requirePermission("pos:access");

  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);

  const [products, stations] = await Promise.all([getAllProducts("fast-pos"), getAllStations()]);

  return (
    <LivePos
      products={products}
      stations={stations}
      currentUser={session.user}
      dict={dict.pos}
      paymentsDict={dict.payments}
    />
  );
}

export default function LivePosPage({ params }: { params: LocaleParams }) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <LivePosContent params={params} />
    </Suspense>
  );
}
