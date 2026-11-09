import { Suspense } from "react";
import EventForm from "@/components/activities/admin/EventForm";
import { requirePermission } from "@/lib/auth";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";
import { getDictionary } from "@/i18n/dictionaries";
import GlobalLoading from "@/app/loading";

async function NewEventContent({ params }: { params: LocaleParams }) {
  await requirePermission("events:write");

  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <EventForm
      isEdit={false}
      backHref={`/${locale}/activities/manage`}
      dict={dict.activities_management}
      iconDict={dict.activities.details.icon_picker}
    />
  );
}

export default function NewEventPage({ params }: { params: LocaleParams }) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <NewEventContent params={params} />
    </Suspense>
  );
}
