import { cookies } from "next/headers";
import ProfileClient from "@/components/Profile";
import styles from "@/styles/pages/ProfilePage.module.css";
import { verifyJWTWebCrypto } from "@/lib/security/jwt";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/db/repositories/user.repository";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const jwtUser = await verifyJWTWebCrypto(sessionToken);

  if (!jwtUser) redirect("/api/auth/login");

  const user = await getUser(jwtUser.istid);
  if (!user) redirect("/api/auth/login");

  let hasCV = false;
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/user/cv-bank`, {
    headers: { cookie: `session=${sessionToken}` },
    cache: "no-store",
  });
  if (res.ok) {
    const data = await res.json();
    hasCV = !!data.hasCV;
  }

  return (
    <div className={styles.container}>
      <ProfileClient initialUser={user} initialHasCV={hasCV} />
    </div>
  );
}
