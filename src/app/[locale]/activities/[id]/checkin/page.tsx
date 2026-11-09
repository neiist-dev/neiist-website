import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getActivityById } from "@/lib/db/repositories/event.repository";
import CheckinScanner from "@/components/activities/admin/CheckinScanner";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale } from "@/i18n/i18n-config";
import GlobalLoading from "@/app/loading";

interface CheckinPageProps {
  params: Promise<{ locale: string; id: string }>;
}

async function CheckinPageContent({ params }: CheckinPageProps) {
  await requirePermission("events:checkin");

  const { locale: rawLocale, id } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);

  const activity = await getActivityById(id);
  if (!activity) notFound();

  return <CheckinScanner event={activity} dict={dict.checkin_scanner} basePath={`/${locale}`} />;
}

export default function CheckinPage(props: CheckinPageProps) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <CheckinPageContent {...props} />
    </Suspense>
  );
}
