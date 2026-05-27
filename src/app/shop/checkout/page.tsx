import CheckoutForm from "@/components/shop/CheckoutForm";
import { getUserFromJWT } from "@/utils/authUtils";
import { getUser } from "@/utils/dbUtils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const jwtUser = getUserFromJWT(sessionToken);

  if (!jwtUser) {
    redirect("/api/auth/login?returnUrl=/shop/checkout");
  }

  const user = await getUser(jwtUser.istid);
  if (!user) {
    redirect("/api/auth/login?returnUrl=/shop/checkout");
  }

  return <CheckoutForm user={user} />;
}
