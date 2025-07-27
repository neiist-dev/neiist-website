import { cookies } from "next/headers";
import ProfileClient from "@/components/Profile";
import styles from "@/styles/pages/ProfilePage.module.css";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const userDataCookie = cookieStore.get("userData")?.value;
  const user = userDataCookie ? JSON.parse(userDataCookie) : null;

  return (
    <div className={styles.container}>
      <header className={styles.title}>Perfil</header>
      <ProfileClient initialUser={user} />
    </div>
  );
}
