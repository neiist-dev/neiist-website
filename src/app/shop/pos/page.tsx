import SumUpReadersManagement from "@/components/shop/SumUpReadersManagement";
import styles from "@/styles/pages/ShopPos.module.css";
import { getLocale, getDictionary } from "@/lib/i18n";

export default async function ShopPosPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.primary}>{dict.shop_pos.title_1}</span>
          <span className={styles.secondary}>{dict.shop_pos.title_2}</span>
          <span className={styles.tertiary}>{dict.shop_pos.title_3}</span>
          <span className={styles.quaternary}>{dict.shop_pos.title_4}</span>
        </h1>
      </div>
      <SumUpReadersManagement dict={{ sumup_readers: dict.sumup_readers, confirm_dialog: dict.confirm_dialog }} />
    </div>
  );
}
