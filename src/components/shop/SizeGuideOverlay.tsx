import { MdClose } from "react-icons/md";
import styles from "@/styles/components/shop/SizeGuideOverlay.module.css";
import { SizeGuideData } from "@/components/shop/SizeGuideEditor";

export default function SizeGuideOverlay({
  open,
  onClose,
  title,
  customContent,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  customContent?: string;
}) {
  if (!open || !customContent) return null;
  const data: SizeGuideData = JSON.parse(customContent);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Fechar">
          <MdClose size={24} />
        </button>
        <h2 className={styles.title}>{title || "Guia de Tamanhos"}</h2>

        <div className={styles.tableWrapper}>
          <table className={styles.sizeTable}>
            <thead>
              <tr>
                <th></th>
                {data.sizes.map((sizeColumn) => (
                  <th key={sizeColumn.size}>{sizeColumn.size}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.explanations.map((explanation) => (
                <tr key={explanation.label}>
                  <td>
                    <b>{explanation.label}</b>
                  </td>
                  {data.sizes.map((sizeColumn) => (
                    <td key={sizeColumn.size}>{sizeColumn[explanation.label]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.unit}>Medidas em centímetros</div>
        </div>

        <ul className={styles.explanationList}>
          {data.explanations.map((explanation) => (
            <li key={explanation.label}>
              <span className={styles.explanationLabel}>{explanation.label}</span>{" "}
              {explanation.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
