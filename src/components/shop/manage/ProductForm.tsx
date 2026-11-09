"use client";

import { FaArrowLeft, FaPlus, FaSave } from "react-icons/fa";
import { Product } from "@/types/shop/product";
import { Category } from "@/types/shop/category";
import { ColorfulText } from "@neiist/ui";
import styles from "@/styles/components/shop/manage/ProductForm.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

import { useProductForm } from "@/hooks/shop/manage/product-form/useProductForm";
import { BasicsSection } from "./product-form/BasicsSection";
import { TypeChannelsSection } from "./product-form/TypeChannelsSection";
import { StockSection } from "./product-form/StockSection";
import { VariantsSection } from "./product-form/VariantsSection";
import { DeliveryAndSizeGuideSection } from "./product-form/DeliveryAndSizeGuideSection";
import { ImagesSection } from "./product-form/ImagesSection";

import { Activity } from "@/types/events";

export interface ProductFormProps {
  product?: Product;
  isEdit?: boolean;
  onBackAction?: () => void;
  backHref?: string;
  categories: Category[];
  events?: Activity[];
  dict: Dictionary["shop"]["product_form"];
}

export default function ProductForm({
  product,
  isEdit = false,
  onBackAction,
  backHref = "/shop/manage",
  categories,
  events,
  dict,
}: ProductFormProps) {
  const {
    form,
    updateForm,
    categoryOptions,
    handleCategoryCreate,
    productImages,
    setProductImages,
    variantDefinitions,
    setVariantDefinitions,
    variants,
    setVariants,
    groupImages,
    setGroupImages,
    hasVariants,
    totalVariantStock,
    allGlobalImages,
    hasAnyVariantSpecificImage,
    uploading,
    handleSubmit,
    router,
  } = useProductForm({
    product,
    isEdit,
    backHref,
    categories,
    dict,
  });

  const showGlobalImages =
    !hasVariants || allGlobalImages.length > 0 || !hasAnyVariantSpecificImage;

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onBackAction ?? (() => router.push(backHref))}>
            <FaArrowLeft /> {dict.back}
          </button>
          <ColorfulText className={styles.title} text={isEdit ? dict.title_edit : dict.title_new} />
          <button type="submit" className={styles.btnPrimary} disabled={uploading}>
            {isEdit ? <FaSave /> : <FaPlus />}
            {uploading ? dict.saving : isEdit ? dict.save_changes : dict.create_product}
          </button>
        </div>

        <div className={styles.grid}>
          <div className={styles.sectionCol}>
            <BasicsSection
              name={form.name}
              description={form.description}
              category={form.category}
              price={form.price}
              categoryOptions={categoryOptions}
              onUpdate={updateForm}
              onCategoryCreate={handleCategoryCreate}
              dict={dict}
            />

            <TypeChannelsSection
              productType={form.product_type}
              channels={form.channels}
              eventId={form.event_id}
              eventHook={form.event_hook}
              events={events}
              onUpdate={updateForm}
            />

            <StockSection
              stockType={form.stock_type}
              stockQuantity={form.stock_quantity}
              orderStart={form.order_start}
              orderDeadline={form.order_deadline}
              hasVariants={hasVariants}
              totalVariantStock={totalVariantStock}
              productType={form.product_type}
              channels={form.channels}
              uploading={uploading}
              onUpdate={updateForm}
              dict={dict}
            />
          </div>

          <div className={styles.sectionCol}>
            <VariantsSection
              variantDefinitions={variantDefinitions}
              setVariantDefinitions={setVariantDefinitions}
              variants={variants}
              setVariants={setVariants}
              groupImages={groupImages}
              setGroupImages={setGroupImages}
              hasVariants={hasVariants}
              basePrice={form.price}
              stockType={form.stock_type}
              dict={dict}
            />

            <DeliveryAndSizeGuideSection
              estimatedDelivery={form.estimated_delivery}
              sizeGuide={form.size_guide}
              onUpdateDelivery={(estimated_delivery) => updateForm({ estimated_delivery })}
              onUpdateSizeGuide={(size_guide) => updateForm({ size_guide })}
              dict={dict}
            />

            {showGlobalImages && (
              <ImagesSection
                productImages={productImages}
                setProductImages={setProductImages}
                allGlobalImages={allGlobalImages}
                dict={dict}
              />
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
