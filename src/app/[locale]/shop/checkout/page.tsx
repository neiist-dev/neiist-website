import { Suspense } from "react";
import CheckoutForm from "@/components/shop/CheckoutForm";
import { requireUser } from "@/lib/auth";
import GlobalLoading from "@/app/loading";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

async function CheckoutContent({ params }: { params: LocaleParams }) {
  const { user } = await requireUser();
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <CheckoutForm
      user={user}
      dict={dict.checkout_form}
      pendingPaymentDict={dict.pending_payment}
      checkoutOverlayDict={dict.checkout_overlay}
      basePath={`/${locale}`}
    />
  );
}

export default function CheckoutPage({ params }: { params: LocaleParams }) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <CheckoutContent params={params} />
    </Suspense>
  );
}
