import CheckoutForm from "@/components/shop/CheckoutForm";
import { getUserFromJWT } from "@/utils/authUtils";
import { getUser } from "@/utils/dbUtils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const jwtUser = getUserFromJWT(sessionToken)!;
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  const user = await getUser(jwtUser.istid);
  if (!user) {
    redirect("/login?redirect=/shop/checkout");
  }

  return <CheckoutForm user={user} dict={dict.checkout_form}/>;
}
