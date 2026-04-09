import SumUpReadersManagement from "@/components/shop/SumUpReadersManagement";
import styles from "@/styles/pages/ShopPos.module.css";

export default function ShopPosPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.primary}>Gestão</span>
          <span className={styles.secondary}> de TPA</span>
          <span className={styles.tertiary}>s Sum</span>
          <span className={styles.quaternary}>Up</span>
        </h1>
      </div>
      <SumUpReadersManagement />
    </div>
  );
}
