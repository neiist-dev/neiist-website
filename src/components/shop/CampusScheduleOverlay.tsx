import { MdClose } from "react-icons/md";
import { getCampusSchedule } from "@/utils/shop/shopUtils";
import styles from "@/styles/components/shop/CampusScheduleOverlay.module.css";

interface CampusScheduleOverlayProps {
  open: boolean;
  onClose: () => void;
  campus?: string;
}

export default function CampusScheduleOverlay({
  open,
  onClose,
  campus,
}: CampusScheduleOverlayProps) {
  if (!open || !campus) return null;

  const scheduleInfo = getCampusSchedule(campus);
  if (!scheduleInfo) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Fechar">
          <MdClose size={24} />
        </button>

        <h2 className={styles.title}>Horário de Funcionamento</h2>
        <p className={styles.location}>{scheduleInfo.location}</p>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Dia</th>
                <th>Horário</th>
              </tr>
            </thead>
            <tbody>
              {scheduleInfo.schedule.map((daySchedule) => {
                const isClosed = daySchedule.closed || daySchedule.slots.length === 0;

                return (
                  <tr key={daySchedule.day}>
                    <td>
                      <b>{daySchedule.day}</b>
                    </td>
                    <td>
                      {isClosed
                        ? "Encerrado"
                        : daySchedule.slots.map((slot) => `${slot.start} - ${slot.end}`).join(", ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {scheduleInfo.notes && <div className={styles.notes}>{scheduleInfo.notes}</div>}
        </div>
      </div>
    </div>
  );
}
