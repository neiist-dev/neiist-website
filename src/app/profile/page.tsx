import { cookies } from "next/headers";
import ProfileClient from "@/components/Profile";
import styles from "@/styles/pages/ProfilePage.module.css";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const userDataCookie = cookieStore.get("userData")?.value;
  const user = userDataCookie ? JSON.parse(userDataCookie) : null;

  let hasCV = false;
  if (user) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/user/cv-bank`, {
      headers: { cookie: `userData=${userDataCookie}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      hasCV = !!data.hasCV;
    }
  }

  return (
    <div className={styles.container}>
      <ProfileClient initialUser={user} initialHasCV={hasCV} />
    </div>
  );
}
