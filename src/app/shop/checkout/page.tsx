import CheckoutForm from "@/components/shop/CheckoutForm";
import { getUserFromJWT } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUser } from "@/utils/db/userQueries";

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const jwtUser = getUserFromJWT(sessionToken)!;

  const user = await getUser(jwtUser.istid);
  if (!user) {
    redirect("/login?redirect=/shop/checkout");
  }

  return <CheckoutForm user={user} />;
}
