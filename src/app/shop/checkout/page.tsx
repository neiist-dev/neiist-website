import CheckoutForm from "@/components/shop/CheckoutForm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const userDataCookie = cookieStore.get("userData")?.value;
  const user = userDataCookie ? JSON.parse(userDataCookie) : null;

  if (!user) {
    redirect("/login?redirect=/shop/checkout");
  }

  return <CheckoutForm user={user} />;
}
