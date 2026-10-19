import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getVotingSessionById,
  getSessionResults,
  getSessionNominees,
} from "@/lib/db/repositories/voting.repository";
import VotingSessionDetailsView from "@/components/voting/admin/VotingSessionDetailsView";
import { requirePermission } from "@/lib/auth";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale } from "@/i18n/i18n-config";
import GlobalLoading from "@/app/loading";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

async function VotingSessionDetailsContent({ params }: PageProps) {
  await requirePermission("voting:read");
  const { locale: rawLocale, id } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).voting_management;

  const sessionId = parseInt(id, 10);
  if (isNaN(sessionId)) notFound();

  const [session, results, nominees] = await Promise.all([
    getVotingSessionById(sessionId),
    getSessionResults(sessionId),
    getSessionNominees(sessionId),
  ]);

  if (!session) notFound();

  return (
    <VotingSessionDetailsView
      session={session}
      results={results}
      nominees={nominees}
      dict={dict}
      locale={locale}
    />
  );
}

export default function VotingSessionDetailsPage({ params }: PageProps) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <VotingSessionDetailsContent params={params} />
    </Suspense>
  );
}
