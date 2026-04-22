import CheckoutForm from "@/components/shop/CheckoutForm";
import { getUserFromJWT } from "@/utils/authUtils";
import { getUser } from "@/utils/dbUtils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OrderSource } from "@/types/shop/orderKind";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const { source } = await searchParams;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const jwtUser = getUserFromJWT(sessionToken)!;

  const user = await getUser(jwtUser.istid);
  if (!user) {
    redirect("/login?redirect=/shop/checkout");
  }

  const checkoutSource: OrderSource = source === "dinner" ? "dinner" : "other";

  return <CheckoutForm user={user} source={checkoutSource} />;
}
