import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import {
  getActivityByIdFromDb,
  getEventAttendanceRoster,
} from "@/lib/db/repositories/event.repository";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale } from "@/i18n/i18n-config";
import GlobalLoading from "@/app/loading";
import ActivityDetailsView from "@/components/activities/admin/ActivityDetailsView";

export const instant = false;

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

async function ActivityManageDetailsContent({ params }: PageProps) {
  await requirePermission("events:read");

  const resolved = await params;
  const locale = isValidLocale(resolved.locale) ? resolved.locale : defaultLocale;
  const dict = getDictionary(locale);
  const [event, roster] = await Promise.all([
    getActivityByIdFromDb(resolved.id),
    getEventAttendanceRoster(resolved.id),
  ]);

  if (!event) notFound();

  return (
    <ActivityDetailsView
      event={event}
      roster={roster}
      dict={dict.activities_management}
      locale={locale}
    />
  );
}

export default function ActivityManageDetailsPage(props: PageProps) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <ActivityManageDetailsContent {...props} />
    </Suspense>
  );
}
