import styles from "@/styles/components/shop/CheckoutFormOverlay.module.css";

interface Props {
  orderId: number | null;
}

export default function CheckoutDoneOverlay({ orderId }: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <h2 className={styles.title}>Encomenda Submetida!</h2>
        <p className={styles.muted} style={{ textAlign: "center" }}>
          Obrigado pela tua encomenda.
          <br />
          <a className={styles.link} href={`/my-orders?orderId=${orderId}`}>
            Ver encomenda
          </a>
        </p>
      </div>
    </div>
  );
}
