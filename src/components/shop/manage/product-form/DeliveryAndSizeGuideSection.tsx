"use client";

import { useState } from "react";
import { FaTruck, FaRulerHorizontal, FaEye, FaTrash } from "react-icons/fa";
import { Field, Input, ConfirmDialog } from "@neiist/ui";
import SizeGuideOverlay from "@/components/shop/catalog/SizeGuideOverlay";
import SizeGuideEditor from "./SizeGuideEditor";
import styles from "@/styles/components/shop/manage/ProductForm.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface DeliveryAndSizeGuideSectionProps {
  estimatedDelivery: string;
  sizeGuide: string;
  onUpdateDelivery: (_val: string) => void;
  onUpdateSizeGuide: (_val: string) => void;
  dict: Dictionary["shop"]["product_form"];
}

export function DeliveryAndSizeGuideSection({
  estimatedDelivery,
  sizeGuide,
  onUpdateDelivery,
  onUpdateSizeGuide,
  dict,
}: DeliveryAndSizeGuideSectionProps) {
  const [showSizeGuidePreview, setShowSizeGuidePreview] = useState(false);
  const [showSizeGuideEditor, setShowSizeGuideEditor] = useState(false);
  const [showDeleteSizeGuideConfirm, setShowDeleteSizeGuideConfirm] = useState(false);

  return (
    <>
      <div className={styles.stackBlock}>
        <Field label={dict.estimated_delivery_label}>
          <div className={styles.inputRow}>
            <span className={styles.inputIcon}>
              <FaTruck />
            </span>
            <Input
              value={estimatedDelivery}
              onChange={(e) => onUpdateDelivery(e.target.value)}
              placeholder={dict.estimated_delivery_placeholder}
            />
          </div>
        </Field>

        <Field label={dict.size_guide_label}>
          <div className={styles.inputRow}>
            <span className={styles.inputIcon}>
              <FaRulerHorizontal />
            </span>
            <div className={styles.fieldActions}>
              <button
                type="button"
                className={styles.actionBtnSmall}
                onClick={() => setShowSizeGuideEditor(true)}>
                {dict.edit_button}
              </button>
              {sizeGuide && (
                <>
                  <button
                    type="button"
                    className={styles.actionBtnSmall}
                    onClick={() => setShowSizeGuidePreview(true)}>
                    <FaEye size={12} /> {dict.preview_button}
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtnSmall} ${styles.actionBtnDanger}`}
                    onClick={() => setShowDeleteSizeGuideConfirm(true)}>
                    <FaTrash size={11} /> {dict.remove_button}
                  </button>
                </>
              )}
            </div>
          </div>
        </Field>
      </div>

      <SizeGuideOverlay
        open={showSizeGuidePreview}
        onClose={() => setShowSizeGuidePreview(false)}
        customContent={sizeGuide}
      />
      <SizeGuideEditor
        open={showSizeGuideEditor}
        onClose={() => setShowSizeGuideEditor(false)}
        value={sizeGuide}
        onChange={(newVal) => onUpdateSizeGuide(newVal)}
      />
      <ConfirmDialog
        open={showDeleteSizeGuideConfirm}
        message={dict.delete_size_guide_confirm}
        confirmLabel={dict.remove_button}
        cancelLabel={dict.back}
        onConfirm={() => {
          onUpdateSizeGuide("");
          setShowDeleteSizeGuideConfirm(false);
        }}
        onCancel={() => setShowDeleteSizeGuideConfirm(false)}
      />
    </>
  );
}
