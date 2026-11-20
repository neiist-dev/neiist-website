import { Suspense } from "react";
import CampusSchedulesManagement from "@/components/shop/manage/CampusSchedulesManagement";
import { getAllStations } from "@/lib/db/repositories/pos.repository";
import { requirePermission } from "@/lib/auth";
import GlobalLoading from "@/app/loading";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

async function CampusSchedulesContent({ params }: { params: LocaleParams }) {
  await requirePermission("shop:write");
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);

  const stations = await getAllStations();

  return <CampusSchedulesManagement stations={stations} dict={dict.campus_schedules_management} />;
}

export default function CampusSchedulesPage({ params }: { params: LocaleParams }) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <CampusSchedulesContent params={params} />
    </Suspense>
  );
}
