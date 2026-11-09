"use client";

import React from "react";
import { Field, Input, Textarea, MultiSelect } from "@neiist/ui";
import styles from "@/styles/components/shop/manage/ProductForm.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface BasicsSectionProps {
  name: string;
  description: string;
  price: number;
  category: string;
  categoryOptions: string[];
  onUpdate: (_updates: {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
  }) => void;
  onCategoryCreate: (_name: string) => Promise<void>;
  dict: Dictionary["shop"]["product_form"];
}

export function BasicsSection({
  name,
  description,
  price,
  category,
  categoryOptions,
  onUpdate,
  onCategoryCreate,
  dict,
}: BasicsSectionProps) {
  return (
    <div className={styles.stackBlock}>
      <Field label={dict.product_name_label}>
        <Input
          value={name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder={dict.product_name_placeholder}
          required
        />
      </Field>

      <Field label={dict.description_label}>
        <Textarea
          value={description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder={dict.description_placeholder}
          rows={3}
        />
      </Field>

      <Field label={dict.category_label}>
        <MultiSelect
          availableItems={categoryOptions}
          selectedItems={category ? [category] : []}
          onChange={(items) => onUpdate({ category: items[0] ?? "" })}
          onItemCreate={onCategoryCreate}
          placeholder={category || dict.choose_category_placeholder}
          multiSelect={false}
        />
      </Field>

      <Field label={dict.base_price_label}>
        <Input
          type="number"
          value={price}
          onChange={(e) => onUpdate({ price: Number(e.target.value) })}
          step="0.01"
          min="0"
          required
        />
      </Field>
    </div>
  );
}
