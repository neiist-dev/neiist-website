import { Suspense } from "react";
import CheckoutForm from "@/components/shop/CheckoutForm";
import { requireUser } from "@/lib/auth";
import GlobalLoading from "@/app/loading";

async function CheckoutContent() {
  const { user } = await requireUser();
  return <CheckoutForm user={user} />;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}
