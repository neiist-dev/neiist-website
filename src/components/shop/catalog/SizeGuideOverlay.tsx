import { Modal, Badge, Text } from "@neiist/ui";
import styles from "@/styles/components/shop/catalog/SizeGuideOverlay.module.css";
import { SizeGuideData } from "@/components/shop/manage/product-form/SizeGuideEditor";

export default function SizeGuideOverlay({
  open,
  onClose,
  title = "Guia de Tamanhos",
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
    <Modal open={open} onClose={onClose} title={title} size="md">
      <div className={styles.modalContent}>
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
          <Text size="sm" variant="muted" className={styles.unit}>
            Medidas em centímetros
          </Text>
        </div>

        <ul className={styles.explanationList}>
          {data.explanations.map((explanation) => (
            <li key={explanation.label}>
              <Badge variant="primary" size="md" className={styles.explanationBadge}>
                {explanation.label}
              </Badge>
              <span>{explanation.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
