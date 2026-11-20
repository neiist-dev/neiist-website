import { Suspense } from "react";
import { notFound } from "next/navigation";
import GlobalLoading from "@/app/loading";
import MobileTpaClient from "@/components/shop/pos/MobileTpaClient";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";
import { requirePermission } from "@/lib/auth";
import { ENABLE_SUMUP_MOBILE_BRIDGE } from "@/types/shop/sumup";

async function MobileTpaContent({ params }: { params: LocaleParams }) {
  await requirePermission("pos:access");

  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).pos.mobile_tpa;

  return <MobileTpaClient dict={dict} />;
}

export default function MobileTpaPage({ params }: { params: LocaleParams }) {
  if (!ENABLE_SUMUP_MOBILE_BRIDGE) {
    notFound();
  }

  return (
    <Suspense fallback={<GlobalLoading />}>
      <MobileTpaContent params={params} />
    </Suspense>
  );
}
