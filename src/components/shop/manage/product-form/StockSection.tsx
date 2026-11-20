"use client";

import React from "react";
import { Field, Select, Input, DateInput } from "@neiist/ui";
import { FaBox } from "react-icons/fa";
import { pt } from "date-fns/locale";
import { StockType, ProductType, ProductChannel } from "@/types/shop/product";
import styles from "@/styles/components/shop/manage/ProductForm.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface StockSectionProps {
  stockType: StockType;
  stockQuantity: number;
  totalVariantStock: number;
  hasVariants: boolean;
  orderStart?: Date;
  orderDeadline?: Date;
  productType: ProductType;
  channels: ProductChannel[];
  uploading?: boolean;
  onUpdate: (_updates: {
    stock_type?: StockType;
    stock_quantity?: number;
    order_start?: Date;
    order_deadline?: Date;
  }) => void;
  dict: Dictionary["shop"]["product_form"];
}

export function StockSection({
  stockType,
  stockQuantity,
  totalVariantStock,
  hasVariants,
  orderStart,
  orderDeadline,
  productType,
  channels,
  uploading,
  onUpdate,
  dict,
}: StockSectionProps) {
  const isLockedToUntracked = productType === "food_drink" || channels.includes("fast-pos");

  return (
    <div className={styles.stackBlock}>
      <div className={styles.sectionTitle}>
        <FaBox /> {dict.stock_title}
      </div>

      <Field label={dict.stock_type_label}>
        <Select
          options={[
            { label: dict.stock_limited, value: "limited" },
            { label: dict.stock_on_demand, value: "on_demand" },
            { label: "Sem Gestão de Stock / Ilimitado", value: "untracked" },
          ]}
          value={stockType}
          disabled={uploading || isLockedToUntracked}
          onChange={(val) => {
            const st = val as StockType;
            onUpdate({
              stock_type: st,
              ...(st === "limited" && !hasVariants ? { stock_quantity: 0 } : {}),
            });
          }}
        />
      </Field>

      <Field label={dict.start_date_label}>
        <DateInput
          value={orderStart}
          onChange={(date) => onUpdate({ order_start: date })}
          placeholder={dict.start_date_placeholder}
          mobileDrawerTitle={dict.start_date_label}
          locale={pt}
        />
      </Field>

      {stockType === "limited" ? (
        <Field label={dict.total_quantity_label}>
          <Input
            type="number"
            value={hasVariants ? totalVariantStock : stockQuantity}
            onChange={(e) => onUpdate({ stock_quantity: Number(e.target.value) })}
            disabled={hasVariants}
          />
          {hasVariants && <p className={styles.hint}>{dict.total_quantity_hint}</p>}
        </Field>
      ) : (
        <Field label={dict.deadline_label}>
          <DateInput
            value={orderDeadline}
            onChange={(date) => onUpdate({ order_deadline: date })}
            placeholder={dict.deadline_placeholder}
            mobileDrawerTitle={dict.deadline_label}
            locale={pt}
          />
        </Field>
      )}
    </div>
  );
}
