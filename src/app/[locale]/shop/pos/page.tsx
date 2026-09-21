import { Suspense } from "react";
import SumUpReadersManagement from "@/components/shop/SumUpReadersManagement";
import styles from "@/styles/pages/ShopPos.module.css";
import { requirePermission } from "@/lib/auth";
import GlobalLoading from "@/app/loading";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";
import ColorfulText from "@/components/ColorfulText";

async function ShopPosContent({ params }: { params: LocaleParams }) {
  await requirePermission("shop:write");

  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <ColorfulText as="h1" className={styles.title} text={dict.shop_pos.title} />
      </div>
      <SumUpReadersManagement dict={dict.sumup_readers} />
    </div>
  );
}

export default function ShopPosPage({ params }: { params: LocaleParams }) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <ShopPosContent params={params} />
    </Suspense>
  );
}
