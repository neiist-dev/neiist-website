import { useState } from "react";
import { FaCalendarAlt, FaCheck } from "react-icons/fa";
import { IoIosWarning } from "react-icons/io";
import { Order } from "@/types/shop/order";
import { getCampusLocation, getCampusSchedule } from "@/utils/shop/shopUtils";
import CampusScheduleOverlay from "@/components/shop/CampusScheduleOverlay";
import styles from "@/styles/components/shop/PendingPaymentOverlay.module.css";

interface PendingPaymentOverlayProps {
  order?: Order | null;
  paymentMethod?: string;
  onAction: () => void;
  actionLabel?: string;
}

export default function PendingPaymentOverlay({
  order,
  paymentMethod,
  onAction,
  actionLabel,
}: PendingPaymentOverlayProps) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const isInPerson =
    paymentMethod === "in-person" || paymentMethod === "mbway" || paymentMethod === "cash";

  return (
    <>
      <div className={styles.overlay}>
        <div className={styles.panel}>
          <div
            className={`${styles.iconWrap} ${isInPerson ? styles.warningIcon : styles.checkIcon}`}>
            {isInPerson ? <IoIosWarning size={48} /> : <FaCheck size={36} />}
          </div>

          <h2 className={styles.title}>
            {isInPerson ? "Encomenda Pendente!" : "Encomenda Submetida!"}
          </h2>

          <div className={styles.muted}>
            {isInPerson ? (
              paymentMethod === "mbway" ? (
                <>
                  Para a tua encomenda ser confirmada conclui o pagamento.
                  <br />
                  {order ? (
                    <>
                      Transfere €{order.total_amount.toFixed(2)} via MBWay para o número:
                      <br />
                      <strong>{order.mbway_number ?? "Número indisponível"}</strong>
                      <br />
                      <strong>Instruções:</strong> na descrição da transferência indica{" "}
                      <strong>{order.order_number}</strong> para conseguirmos identificar o teu
                      pagamento.
                      <br />
                      Para mais informações por favor consulta o email.
                    </>
                  ) : (
                    "A carregar os detalhes do pagamento..."
                  )}
                </>
              ) : (
                <>
                  Para a tua encomenda ser confirmada conclui o pagamento.
                  <br />
                  Presencialmente na {getCampusLocation(order?.campus)}
                  {order?.campus && getCampusSchedule(order.campus) && (
                    <button
                      type="button"
                      className={styles.scheduleButton}
                      onClick={() => setShowScheduleModal(true)}>
                      <FaCalendarAlt size={13} /> Ver Horário da Sala
                    </button>
                  )}
                </>
              )
            ) : (
              <>
                Obrigado pela tua encomenda.
                <br />
                Receberás um email de confirmação em breve.
              </>
            )}
          </div>

          <div className={styles.actionButtons}>
            <button type="button" onClick={onAction} className={styles.btnPrimary}>
              {actionLabel || (isInPerson ? "Continuar" : "Ver Encomendas")}
            </button>
          </div>
        </div>
      </div>

      <CampusScheduleOverlay
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        campus={order?.campus}
      />
    </>
  );
}
