import CheckoutForm from "@/components/shop/CheckoutForm";
import { getUserFromJWT } from "@/utils/authUtils";
import { getUser } from "@/utils/dbUtils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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
