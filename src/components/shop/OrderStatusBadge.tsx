import styles from "@/styles/components/shop/OrderStatusBadge.module.css";
import { OrderStatus } from "@/types/shop";

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`${styles.status} ${styles[status]}`}>
      {status === "pending" && "Pendente"}
      {status === "paid" && "Pago"}
      {status === "preparing" && "A preparar"}
      {status === "ready" && "Pronto"}
      {status === "delivered" && "Entregue"}
      {status === "cancelled" && "Cancelada"}
    </span>
  );
}
