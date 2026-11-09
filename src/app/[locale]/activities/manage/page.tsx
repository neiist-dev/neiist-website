import { Suspense } from "react";
import ActivitiesManagement from "@/components/activities/admin/ActivitiesManagement";
import { getActivitiesEventsFromDb } from "@/lib/db/repositories/event.repository";
import { requirePermission } from "@/lib/auth";
import GlobalLoading from "@/app/loading";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

async function ActivitiesManageContent({ params }: { params: LocaleParams }) {
  await requirePermission("events:read");

  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);
  const events = await getActivitiesEventsFromDb(false);

  return (
    <ActivitiesManagement
      events={events}
      dict={dict.activities_management}
      detailsDict={dict.activities.details}
      basePath={`/${locale}`}
      locale={locale}
    />
  );
}

export default function ActivitiesManagePage({ params }: { params: LocaleParams }) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <ActivitiesManageContent params={params} />
    </Suspense>
  );
}
