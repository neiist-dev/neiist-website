import { Suspense } from "react";
import PosManagementHub from "@/components/shop/pos/PosManagementHub";
import { getAllStations, getShiftsHistory } from "@/lib/db/repositories/pos.repository";
import { requirePermission } from "@/lib/auth";
import GlobalLoading from "@/app/loading";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

async function PosManageContent({ params }: { params: LocaleParams }) {
  await requirePermission("pos:manage");

  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);

  const [stations, shifts] = await Promise.all([getAllStations(), getShiftsHistory(50)]);

  return (
    <PosManagementHub
      initialStations={stations}
      initialShifts={shifts}
      dict={dict.pos}
      sumupDict={dict.sumup_readers}
      locale={locale}
    />
  );
}

export default function PosManagePage({ params }: { params: LocaleParams }) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <PosManageContent params={params} />
    </Suspense>
  );
}
