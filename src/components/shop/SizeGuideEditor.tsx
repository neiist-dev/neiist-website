import { useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import styles from "@/styles/components/shop/SizeGuideOverlay.module.css";

export interface SizeGuideData {
  sizes: Array<{ size: string; [key: string]: string | number }>;
  explanations: Array<{ label: string; text: string }>;
}

export const DEFAULT_SIZE_GUIDE_DATA: SizeGuideData = {
  sizes: [
    { size: "XS", A: 56, B: 50, C: 46, D: 58 },
    { size: "S", A: 58, B: 52, C: 48, D: 60 },
    { size: "M", A: 60, B: 54, C: 50, D: 62 },
    { size: "L", A: 62, B: 56, C: 52, D: 64 },
    { size: "XL", A: 64, B: 58, C: 54, D: 66 },
    { size: "XXL", A: 66, B: 60, C: 56, D: 68 },
  ],
  explanations: [
    { label: "A", text: "Medida do pescoço até ao cinto (Altura)" },
    { label: "B", text: "Metade do diâmetro à altura do peito (Largura)" },
    { label: "C", text: "Medida de ombro a ombro" },
    { label: "D", text: "Comprimento do ombro até ao punho" },
  ],
};

export default function SizeGuideEditor({
  value,
  onChange,
  open,
  onClose,
}: {
  value: string;
  onChange: (_value: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<SizeGuideData>(() =>
    value ? JSON.parse(value) : DEFAULT_SIZE_GUIDE_DATA
  );

  useEffect(() => {
    if (open) {
      const nextData = value ? JSON.parse(value) : DEFAULT_SIZE_GUIDE_DATA;
      setData(nextData);
      if (!value) onChange(JSON.stringify(nextData));
    }
  }, [open, value, onChange]);

  const update = (updater: (_prevData: SizeGuideData) => SizeGuideData) => {
    setData((prevData) => {
      const nextData = updater(prevData);
      onChange(JSON.stringify(nextData));
      return nextData;
    });
  };

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Fechar">
          <MdClose size={24} />
        </button>
        <h2 className={styles.title}>Editar Guia de Tamanhos</h2>

        <div className={styles.tableWrapper}>
          <table className={styles.sizeTable}>
            <thead>
              <tr>
                <th></th>
                {data.sizes.map((sizeColumn, sizeIndex) => (
                  <th key={`head-${sizeColumn.size}`}>
                    <input
                      value={sizeColumn.size}
                      onChange={(event) =>
                        update((currentData) => ({
                          ...currentData,
                          sizes: currentData.sizes.map((item, index) =>
                            index === sizeIndex ? { ...item, size: event.target.value } : item
                          ),
                        }))
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Backspace" &&
                          !sizeColumn.size &&
                          data.sizes.length > 1
                        ) {
                          update((currentData) => ({
                            ...currentData,
                            sizes: currentData.sizes.filter((_, index) => index !== sizeIndex),
                          }));
                        }
                      }}
                    />
                  </th>
                ))}
                <th style={{ border: "none", width: "2rem" }}>
                  <button
                    type="button"
                    className={styles.addColBtn}
                    onClick={() =>
                      update((currentData) => ({
                        ...currentData,
                        sizes: [...currentData.sizes, { size: "Novo" }],
                      }))
                    }
                    title="Adicionar coluna">
                    <FaPlus size={10} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.explanations.map((explanation) => (
                <tr key={`row-${explanation.label}`}>
                  <td>
                    <b>{explanation.label}</b>
                  </td>
                  {data.sizes.map((sizeColumn, sizeIndex) => (
                    <td key={`cell-${sizeColumn.size}-${explanation.label}`}>
                      <input
                        value={sizeColumn[explanation.label] ?? ""}
                        onChange={(event) =>
                          update((currentData) => ({
                            ...currentData,
                            sizes: currentData.sizes.map((item, index) =>
                              index === sizeIndex
                                ? { ...item, [explanation.label]: event.target.value }
                                : item
                            ),
                          }))
                        }
                      />
                    </td>
                  ))}
                  <td style={{ border: "none" }}></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.unit}>Medidas em centímetros</div>
        </div>

        <ul className={styles.explanationList}>
          {data.explanations.map((explanation, explanationIndex) => (
            <li key={`exp-${explanation.label}`}>
              <span className={styles.explanationLabel}>{explanation.label}</span>
              <input
                value={explanation.text}
                onChange={(event) =>
                  update((currentData) => ({
                    ...currentData,
                    explanations: currentData.explanations.map((item, index) =>
                      index === explanationIndex ? { ...item, text: event.target.value } : item
                    ),
                  }))
                }
                placeholder="Descrição da medida..."
              />
              {data.explanations.length > 1 && (
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() =>
                    update((currentData) => ({
                      ...currentData,
                      explanations: currentData.explanations.filter(
                        (_, index) => index !== explanationIndex
                      ),
                    }))
                  }
                  title="Remover medida">
                  <FaTrash size={11} />
                </button>
              )}
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={styles.addBtn}
          onClick={() =>
            update((currentData) => ({
              ...currentData,
              explanations: [
                ...currentData.explanations,
                { label: String.fromCharCode(65 + currentData.explanations.length), text: "" },
              ],
            }))
          }>
          <FaPlus size={10} /> Adicionar Medida
        </button>
      </div>
    </div>
  );
}
