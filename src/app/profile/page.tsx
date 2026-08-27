import { Suspense } from "react";
import ProfileClient from "@/components/Profile";
import { requireUser } from "@/lib/auth";
import { hasUserCV } from "@/lib/google/driveService";
import GlobalLoading from "@/app/loading";
import styles from "@/styles/pages/ProfilePage.module.css";

async function ProfileContent() {
  const { user } = await requireUser();
  const hasCV = await hasUserCV(user.istid);

  return <ProfileClient initialUser={user} initialHasCV={hasCV} />;
}

export default function ProfilePage() {
  return (
    <div className={styles.container}>
      <Suspense fallback={<GlobalLoading />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}
