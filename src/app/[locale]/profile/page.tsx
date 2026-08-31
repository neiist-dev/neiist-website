import { Suspense } from "react";
import ProfileClient from "@/components/Profile";
import { requireUser } from "@/lib/auth";
import { hasUserCV } from "@/lib/google/driveService";
import GlobalLoading from "@/app/loading";
import styles from "@/styles/pages/ProfilePage.module.css";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

async function ProfileContent({ params }: { params: LocaleParams }) {
  const { user } = await requireUser();
  const hasCV = await hasUserCV(user.istid);

  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).profile;

  return <ProfileClient initialUser={user} initialHasCV={hasCV} dict={dict} />;
}

export default function ProfilePage({ params }: { params: LocaleParams }) {
  return (
    <div className={styles.container}>
      <Suspense fallback={<GlobalLoading />}>
        <ProfileContent params={params} />
      </Suspense>
    </div>
  );
}
