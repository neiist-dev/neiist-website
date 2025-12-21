import styles from "@/styles/components/shop/SizeGuideOverlay.module.css";

const sizeTable = [
  { size: "XS", A: 56, B: 50, C: 46, D: 58 },
  { size: "S", A: 58, B: 52, C: 48, D: 60 },
  { size: "M", A: 60, B: 54, C: 50, D: 62 },
  { size: "L", A: 62, B: 56, C: 52, D: 64 },
  { size: "XL", A: 64, B: 58, C: 54, D: 66 },
  { size: "XXL", A: 66, B: 60, C: 56, D: 68 },
];

const explanations = [
  { label: "A", text: "Medida do pescoço até ao cinto (Altura)" },
  { label: "B", text: "Metade do diâmetro à altura do peito (Largura)" },
  { label: "C", text: "Medida de ombro a ombro" },
  { label: "D", text: "Comprimento do ombro até ao punho" },
];

const sizeLabels = explanations.map((e) => e.label);

export default function SizeGuideOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Fechar">
          ×
        </button>
        <h2 className={styles.title}>Guia de Tamanhos Hoodie</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.sizeTable}>
            <thead>
              <tr>
                <th></th>
                {sizeTable.map((col) => (
                  <th key={col.size}>{col.size}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sizeLabels.map((label) => (
                <tr key={label}>
                  <td>
                    <b>{label}</b>
                  </td>
                  {sizeTable.map((col) => (
                    <td key={col.size}>{col[label as keyof typeof col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.unit}>Medidas em centímetros</div>
        </div>
        <ul className={styles.explanationList}>
          {explanations.map((item) => (
            <li key={item.label}>
              <span className={styles.explanationLabel}>{item.label}</span> {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
