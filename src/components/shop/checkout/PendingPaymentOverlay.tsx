import { useState } from "react";
import { FaCalendarAlt, FaCheck } from "react-icons/fa";
import { IoIosWarning } from "react-icons/io";
import { Button, Spinner } from "@neiist/ui";
import { Order } from "@/types/shop/order";
import { getCampusSchedule } from "@/types/schedule";
import { getCampusLocation } from "@/utils/shop/shopUtils";
import { isReservationOrder } from "@/utils/shop/orderStatusUtils";
import CampusScheduleOverlay from "@/components/shop/manage/modals/CampusScheduleOverlay";
import styles from "@/styles/components/shop/checkout/PendingPaymentOverlay.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface PendingPaymentOverlayProps {
  order?: Order | null;
  onAction: () => void;
  actionLabel?: string;
  dict: Dictionary["pending_payment"];
  paymentsDict: Dictionary["payments"];
}

export default function PendingPaymentOverlay({
  order,
  onAction,
  actionLabel,
  dict,
  paymentsDict,
}: PendingPaymentOverlayProps) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  if (!order)
    return (
      <div className={styles.overlay}>
        <Spinner state="loading" title={dict.loading_details} size={48} />
      </div>
    );

  const isUnpaidReservation = isReservationOrder(order);

  return (
    <>
      <div className={styles.overlay}>
        <div className={styles.panel}>
          <div
            className={`${styles.iconWrap} ${isUnpaidReservation ? styles.warningIcon : styles.checkIcon}`}>
            {isUnpaidReservation ? <IoIosWarning size={48} /> : <FaCheck size={36} />}
          </div>

          <h2 className={styles.title}>
            {isUnpaidReservation ? paymentsDict.reservation.pending_title : dict.title_submitted}
          </h2>

          <div className={styles.muted}>
            {isUnpaidReservation ? (
              <>
                {paymentsDict.reservation.pending_intro}
                <br />
                {paymentsDict.reservation.pending_location.replace(
                  "{location}",
                  getCampusLocation(order.campus)
                )}
                {order.campus && getCampusSchedule(order.campus) && (
                  <div className={styles.scheduleAction}>
                    <Button variant="outline" size="sm" onClick={() => setShowScheduleModal(true)}>
                      <FaCalendarAlt size={13} /> {dict.view_schedule}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                {dict.thanks_order}
                <br />
                {dict.confirmation_email}
              </>
            )}
          </div>

          <div className={styles.actionButtons}>
            <Button variant="primary" onClick={onAction}>
              {isUnpaidReservation
                ? paymentsDict.reservation.continue
                : actionLabel || dict.view_orders}
            </Button>
          </div>
        </div>
      </div>

      <CampusScheduleOverlay
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        campus={order.campus}
        dict={dict}
      />
    </>
  );
}
