import styles from "@/styles/components/shop/CheckoutFormOverlay.module.css";
import { User } from "@/types/user";
import { CartItem } from "@/types/shop";

interface Props {
  cart: CartItem[];
  campus: string;
  nif: string;
  notes: string;
  payment: "Dinheiro" | "MBWay";
  user: User;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}

const unitPrice = (item: CartItem) =>
  item.product.price +
  (item.variantId
    ? (item.product.variants.find((v) => v.id === item.variantId)?.price_modifier ?? 0)
    : 0);

export default function CheckoutConfirmOverlay({
  cart,
  campus,
  nif,
  notes,
  payment,
  user,
  loading,
  error,
  onBack,
  onSubmit,
}: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <h2 className={styles.title}>Confirmar Encomenda</h2>

        <ul className={styles.items}>
          {cart.map((item, i) => (
            <li key={i} className={styles.itemLine}>
              <span className={styles.itemName}>{item.product.name}</span>
              <span className={styles.itemQtyPrice}>
                {item.quantity} × {unitPrice(item).toFixed(2)}€
              </span>
            </li>
          ))}
        </ul>

        <div className={styles.muted}>
          <p>
            <b>Campus:</b> {campus}
          </p>
          <p>
            <b>NIF:</b> {nif || <em>Não indicado</em>}
          </p>
          <p>
            <b>Notas:</b> {notes || <em>Sem notas</em>}
          </p>
          <p>
            <b>Método de Pagamento:</b> {payment}
          </p>
          <p style={{ marginTop: 8 }}>
            <b>Nome:</b> {user.name}
            <br />
            <b>ISTID:</b> {user.istid}
            <br />
            <b>Email:</b> {user.email}
            {user.phone ? (
              <>
                <br />
                <b>Telemóvel:</b> {user.phone}
              </>
            ) : null}
          </p>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.btnSecondary} onClick={onBack}>
            Voltar
          </button>
          <button type="button" className={styles.btn} onClick={onSubmit} disabled={loading}>
            {loading ? "A processar..." : "Confirmar Encomenda"}
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
}
