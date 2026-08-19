import { FaSpinner } from "react-icons/fa";
import styles from "@/styles/pages/Loading.module.css";

export default function GlobalLoading() {
  return (
    <div className={styles.container}>
      <FaSpinner size={32} className={styles.spinner} aria-label="A carregar..." />
    </div>
  );
}
