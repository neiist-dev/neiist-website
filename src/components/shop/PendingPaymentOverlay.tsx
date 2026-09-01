import { useState } from "react";
import { FaCalendarAlt, FaCheck } from "react-icons/fa";
import { IoIosWarning } from "react-icons/io";
import { Order } from "@/types/shop/order";
import { getCampusLocation, getCampusSchedule } from "@/utils/shop/shopUtils";
import CampusScheduleOverlay from "@/components/shop/CampusScheduleOverlay";
import styles from "@/styles/components/shop/PendingPaymentOverlay.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface PendingPaymentOverlayProps {
  order?: Order | null;
  paymentMethod?: string;
  onAction: () => void;
  actionLabel?: string;
  dict: Dictionary["pending_payment"];
}

export default function PendingPaymentOverlay({
  order,
  paymentMethod,
  onAction,
  actionLabel,
  dict,
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

          <h2 className={styles.title}>{isInPerson ? dict.title_pending : dict.title_submitted}</h2>

          <div className={styles.muted}>
            {isInPerson ? (
              paymentMethod === "mbway" ? (
                <>
                  {dict.mbway_intro}
                  <br />
                  {order ? (
                    <>
                      {dict.mbway_transfer.replace("{amount}", order.total_amount.toFixed(2))}
                      <br />
                      <strong>{order.mbway_number ?? dict.mbway_unavailable}</strong>
                      <br />
                      {dict.mbway_instructions.replace(
                        "{order_number}",
                        String(order.order_number)
                      )}
                      <br />
                      {dict.mbway_email_info}
                    </>
                  ) : (
                    dict.loading_details
                  )}
                </>
              ) : (
                <>
                  {dict.in_person_intro}
                  <br />
                  {dict.in_person_location.replace("{location}", getCampusLocation(order?.campus))}
                  {order?.campus && getCampusSchedule(order.campus) && (
                    <button
                      type="button"
                      className={styles.scheduleButton}
                      onClick={() => setShowScheduleModal(true)}>
                      <FaCalendarAlt size={13} /> {dict.view_schedule}
                    </button>
                  )}
                </>
              )
            ) : (
              <>
                {dict.thanks_order}
                <br />
                {dict.confirmation_email}
              </>
            )}
          </div>

          <div className={styles.actionButtons}>
            <button type="button" onClick={onAction} className={styles.btnPrimary}>
              {actionLabel || (isInPerson ? dict.continue : dict.view_orders)}
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
