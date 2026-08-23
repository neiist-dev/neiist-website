import CheckoutForm from "@/components/shop/CheckoutForm";
import { verifyJWTWebCrypto } from "@/lib/security/jwt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/db/repositories/user.repository";

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const jwtUser = await verifyJWTWebCrypto(sessionToken);

  if (!jwtUser) redirect("/api/auth/login?redirect=/shop/checkout");

  const user = await getUser(jwtUser.istid);
  if (!user) redirect("/api/auth/login?redirect=/shop/checkout");

  return <CheckoutForm user={user} />;
}
