"use client";
import { useRouter } from "next/navigation";
import { FaCheck } from "react-icons/fa";
import styles from "@/styles/components/shop/CheckoutFormOverlay.module.css";
import { PaymentMethod } from "@/types/shop";

interface Props {
  orderId: number | null;
  paymentMethod: PaymentMethod;
}

export default function CheckoutDoneOverlay({ orderId, paymentMethod }: Props) {
  const router = useRouter();
  const isInPerson = paymentMethod === "in-person";

  const handleViewOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.setItem("cart", "[]");
    window.dispatchEvent(new Event("cartUpdated"));
    if (orderId != null) {
      router.push(`/my-orders?orderId=${orderId}`);
    } else {
      router.push("/my-orders");
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.checkIcon}>
          <FaCheck size={48} strokeWidth={3} />
        </div>
        <h2 className={styles.title}>
          {isInPerson ? "Encomenda Registada!" : "Encomenda Submetida!"}
        </h2>
        <p className={styles.muted}>
          {isInPerson ? (
            <>
              A tua encomenda foi registada.
              <br />
              Paga presencialmente na banca.
            </>
          ) : (
            <>
              Obrigado pela tua encomenda.
              <br />
              Receberás um email de confirmação em breve.
            </>
          )}
        </p>
        {orderId && (
          <a
            className={styles.link}
            href={`/my-orders?orderId=${orderId}`}
            onClick={handleViewOrder}>
            Ver encomenda
          </a>
        )}
      </div>
    </div>
  );
}
