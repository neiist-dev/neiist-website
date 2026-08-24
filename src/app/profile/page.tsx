import { Suspense } from "react";
import { cookies } from "next/headers";
import ProfileClient from "@/components/Profile";
import styles from "@/styles/pages/ProfilePage.module.css";
import { verifyJWTWebCrypto } from "@/lib/security/jwt";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/db/repositories/user.repository";
import { hasUserCV } from "@/lib/google/driveService";
import GlobalLoading from "@/app/loading";

async function ProfileContent() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const jwtUser = await verifyJWTWebCrypto(sessionToken);

  if (!jwtUser) redirect("/api/auth/login");

  const [user, hasCV] = await Promise.all([getUser(jwtUser.istid), hasUserCV(jwtUser.istid)]);

  if (!user) redirect("/api/auth/login");

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
