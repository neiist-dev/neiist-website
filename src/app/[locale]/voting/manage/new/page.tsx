import VotingSessionForm from "@/components/voting/admin/VotingSessionForm";
import { getAllUsers } from "@/lib/db/repositories/user.repository";
import { getActivitiesEventsFromDb } from "@/lib/db/repositories/event.repository";
import { requireRoles } from "@/lib/auth";
import { UserRole } from "@/types/user";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

export default async function NewVotingSessionPage({ params }: { params: LocaleParams }) {
  await requireRoles([UserRole._ADMIN]);
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).voting_management;

  const [activities, users] = await Promise.all([getActivitiesEventsFromDb(), getAllUsers()]);

  return (
    <VotingSessionForm
      activities={activities}
      users={users}
      dict={dict.form}
      typesDict={dict.types}
      locale={locale}
      basePath={`/${locale}`}
    />
  );
}
