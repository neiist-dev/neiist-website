import { Suspense } from "react";
import { redirect } from "next/navigation";
import EventForm from "@/components/activities/admin/EventForm";
import { getActivityById } from "@/lib/db/repositories/event.repository";
import { requirePermission } from "@/lib/auth";
import { defaultLocale, isValidLocale } from "@/i18n/i18n-config";
import { getDictionary } from "@/i18n/dictionaries";
import GlobalLoading from "@/app/loading";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

async function EditEventContent({ params }: PageProps) {
  await requirePermission("events:write");

  const { locale: rawLocale, id } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);

  const event = await getActivityById(id);
  if (!event) redirect(`/${locale}/activities/manage`);

  return (
    <EventForm
      event={event}
      isEdit={true}
      backHref={`/${locale}/activities/manage`}
      dict={dict.activities_management}
      iconDict={dict.activities.details.icon_picker}
    />
  );
}

export default function EditEventPage(props: PageProps) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <EditEventContent {...props} />
    </Suspense>
  );
}
