import SumUpReadersManagement from "@/components/shop/SumUpReadersManagement";
import styles from "@/styles/pages/ShopPos.module.css";
import { getLocale, getDictionary } from "@/lib/i18n";
import { SumUpReadersManagementDict } from "@/types/i18n";
import ColorfulText from "@/components/ColorfulText";

export default async function ShopPosPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <ColorfulText as="h1" className={styles.title} text={dict.shop_pos.title} />
      </div>
      <SumUpReadersManagement dict={dict as SumUpReadersManagementDict} />
    </div>
  );
}
