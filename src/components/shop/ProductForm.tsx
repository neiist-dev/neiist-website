"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  FaArrowLeft,
  FaPlus,
  FaUpload,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { Product, Category } from "@/types/shop";
import styles from "@/styles/components/shop/ProductForm.module.css";
import { splitNameHex, joinNameHex, isColorKey } from "@/utils/shopUtils";
import ColourPicker from "@/components/ColourPicker";

interface ProductFormProps {
  product?: Product | null;
  isEdit?: boolean;
  onBack: () => void;
  categories: Category[];
  locale: string;
  dict: {
    unknown_error: string;
    edit: string;
    add_product: string;
    back_button: string;
    images_label: string;
    no_image: string;
    upload_image_label: string;
    product_name_placeholder: string;
    product_price_placeholder: string;
    product_description_placeholder: string;
    choose_categories: string;
    new_category_placeholder: string;
    add_category_button: string;
    limited_stock: string;
    on_demand_stock: string;
    product_quantity_placeholder: string;
    limit_date_placeholder: string;
    option_types: string;
    option_placeholder: string;
    variants_label: string;
    no_variants: string;
    extra_price: string;
    stock_placeholder: string;
    upload: string;
    saving: string;
    save_changes: string;
    create_product: string;
    error_create_category: string;
    error_create_category2: string;
    error_name_missing: string;
    error_category_missing: string;
    error_variant1: string;
    error_variant2: string;
    error_color1: string;
    error_color2: string;
    error_saving_product: string;
    error: string;
    default_option_color: string;
    default_option_size: string;
  };
}

type VariantForm = {
  id?: number;
  options: { [k: string]: string };
  price_modifier: number;
  stock_quantity: number;
  active: boolean;
  images: string[];
  newImages: Array<{ file: File; preview: string }>;
};

export default function ProductForm({
  product,
  isEdit = false,
  onBack,
  categories,
  dict,
  locale
}: ProductFormProps) {
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price || 0);
  const [category, setCategory] = useState(product?.category || "");
  const [stockType, setStockType] = useState(product?.stock_type || "limited");
  const [stockQuantity, setStockQuantity] = useState(product?.stock_quantity || 0);

  const [orderDeadline, setOrderDeadline] = useState<Date | undefined>(
    product?.order_deadline ? new Date(product.order_deadline) : undefined
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [existingImages, setExistingImages] = useState<string[]>(product?.images || []);
  const [newImages, setNewImages] = useState<Array<{ file: File; preview: string }>>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [allCategories, setAllCategories] = useState<Category[]>(categories);
  const [newCategory, setNewCategory] = useState("");

  const [optionTypes, setOptionTypes] = useState<string[]>(
    product?.variants?.length
      ? [...new Set(product.variants.flatMap((v) => Object.keys(v.options || {})))]
      : [dict.default_option_color, dict.default_option_size]
  );

  const [variants, setVariants] = useState<VariantForm[]>(
    product?.variants?.map((v) => ({
      id: v.id,
      options: Object.fromEntries(
        Object.entries(v.options || {}).map(([key, value]) => [
          key,
          typeof value === "string" ? value.replace(/^["']|["']$/g, "") : value,
        ])
      ),
      price_modifier: v.price_modifier || 0,
      stock_quantity: v.stock_quantity || 0,
      active: v.active !== false,
      images: v.images || [],
      newImages: [],
    })) || []
  );

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const allImages = [...existingImages, ...newImages.map((img) => img.preview)];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const preview = URL.createObjectURL(file);
    setNewImages((prev) => [...prev, { file, preview }]);
    setSelectedImageIndex(allImages.length);
  };

  const removeImage = (index: number) => {
    if (index < existingImages.length) {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      const newIndex = index - existingImages.length;
      setNewImages((prev) => {
        URL.revokeObjectURL(prev[newIndex].preview);
        return prev.filter((_, i) => i !== newIndex);
      });
    }
    setSelectedImageIndex(0);
  };

  const handleAddCategory = async () => {
    const trimmedName = newCategory.trim();
    if (!trimmedName) return;

    setError("");

    try {
      const response = await fetch("/api/shop/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (response.ok) {
        const data = await response.json();
        const newCat = data.category || data;
        const categoryToAdd = {
          id: newCat.id || Date.now(),
          name: newCat.name || trimmedName,
        };

        setAllCategories((prev) => [...prev, categoryToAdd]);
        setCategory(categoryToAdd.name);
        setNewCategory("");
      } else {
        const errorData = await response.json();
        // TODO: (ERROR)
        setError(dict.error_create_category + (errorData.message || errorData.error));
      }
    } catch (error) {
      console.error("Category creation error:", error);
      // TODO: (ERROR)
      setError(dict.error_create_category2);
    }
  };

  const addOptionType = () => setOptionTypes((prev) => [...prev, ""]);

  const updateOptionType = (index: number, value: string) => {
    const oldType = optionTypes[index];
    setOptionTypes((prev) => prev.map((type, i) => (i === index ? value : type)));
    setVariants((prev) =>
      prev.map((variant) => {
        const newOptions = { ...variant.options };
        if (oldType in newOptions && value !== oldType) {
          newOptions[value] = newOptions[oldType];
          delete newOptions[oldType];
        }
        return { ...variant, options: newOptions };
      })
    );
  };

  const removeOptionType = (index: number) => {
    const removedType = optionTypes[index];
    setOptionTypes((prev) => prev.filter((_, i) => i !== index));
    setVariants((prev) =>
      prev.map((variant) => ({
        ...variant,
        options: Object.fromEntries(
          Object.entries(variant.options).filter(([key]) => key !== removedType)
        ),
      }))
    );
  };

  const addVariant = () => {
    const newVariant = {
      options: Object.fromEntries(optionTypes.map((type) => [type, ""])),
      price_modifier: 0,
      stock_quantity: 0,
      active: true,
      images: [],
      newImages: [],
    };
    setVariants((prev) => [...prev, newVariant]);
  };

  const updateVariant = (index: number, updates: Partial<(typeof variants)[0]>) => {
    setVariants((prev) =>
      prev.map((variant, i) => (i === index ? { ...variant, ...updates } : variant))
    );
  };

  const updateVariantOption = (variantIndex: number, optionType: string, value: string) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === variantIndex
          ? { ...variant, options: { ...variant.options, [optionType]: value } }
          : variant
      )
    );
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    variantIndex: number
  ) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    const newImages = imageFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    updateVariant(variantIndex, {
      newImages: [...variants[variantIndex].newImages, ...newImages],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      // TODO: (ERROR)
      setError(dict.error_name_missing);
      return;
    }
    if (!category) {
      // TODO: (ERROR)
      setError(dict.error_category_missing);
      return;
    }
    for (const variant of variants) {
      for (const optionType of optionTypes) {
        const val = (variant.options[optionType] || "").trim();
        if (!val) {
          // TODO: (ERROR)
          setError(`${dict.error_variant1} "${optionType}" ${dict.error_variant2}`);
          return;
        }
        if (isColorKey(optionType)) {
          const { hex } = splitNameHex(val);
          if (!hex) {
            // TODO: (ERROR)
            setError(
              `${dict.error_color1} "${optionType}" ${dict.error_color2}`
            );
            return;
          }
        }
      }
    }

    setUploading(true);

    try {
      // TODO: (LOADING) show loading toast while the product is being saved and images are uploaded.
      const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      const imageUploads = await Promise.all(
        newImages.map(async ({ file }) => ({
          imageBase64: await convertToBase64(file),
          imageName: file.name,
        }))
      );

      const variantsWithUploads = await Promise.all(
        variants.map(async (variant) => ({
          id: variant.id,
          options: variant.options,
          price_modifier: variant.price_modifier,
          stock_quantity: variant.stock_quantity,
          active: variant.active,
          images: variant.images,
          imageUploads: await Promise.all(
            variant.newImages.map(async ({ file }) => ({
              imageBase64: await convertToBase64(file),
              imageName: file.name,
            }))
          ),
        }))
      );

      const productData = {
        id: product?.id,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        category: category,
        stock_type: stockType,
        stock_quantity: Number(stockQuantity),
        images: existingImages,
        imageUploads,
        variants: variantsWithUploads,
        order_deadline: orderDeadline ? orderDeadline.toISOString() : null,
      };

      const url = isEdit ? `/api/shop/products/${product?.id}` : "/api/shop/products";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        // TODO: (SUCCESS) show success toast after the product is created or updated.
        window.location.href = "/shop/manage";
      } else {
        const errorData = await response.json();
        // TODO: (ERROR)
        setError(dict.error + (errorData.message || errorData.error || dict.unknown_error));
      }
    } catch {
      // TODO: (ERROR)
      setError(dict.error_saving_product);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <button type="button" className={styles.backButton} onClick={onBack}>
        <FaArrowLeft /> {dict.back_button}
      </button>

      <h1 className={styles.title}>{isEdit ? `${dict.edit} ${name}` : dict.add_product}</h1>

      {/* TODO: replace this inline error with a toast and remove this fallback once Sonner is implemented here. */}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.section}>
        <label className={styles.label}>{dict.images_label}</label>
        <div className={styles.imageArea}>
          {allImages.length > 0 ? (
            <div className={styles.imagePreview}>
              <Image
                src={allImages[selectedImageIndex]}
                alt="Product"
                fill
                style={{ objectFit: "cover" }}
              />
              {allImages.length > 1 && (
                <div className={styles.imageNav}>
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}>
                    <FaChevronLeft />
                  </button>
                  <span>
                    {selectedImageIndex + 1}/{allImages.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImageIndex(Math.min(allImages.length - 1, selectedImageIndex + 1))
                    }>
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.noImage}>{dict.no_image}</div>
          )}
        </div>

        <label className={styles.button}>
          <FaUpload /> {dict.upload_image_label}
          <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
        </label>

        <div className={styles.thumbList}>
          {allImages.map((img, idx) => (
            <span key={idx} className={styles.thumbItem}>
              <Image src={img} alt="" width={32} height={32} className={styles.thumb} />
              <button
                type="button"
                className={styles.thumbBtn}
                onClick={() => setSelectedImageIndex(idx)}>
                {idx + 1}
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => removeImage(idx)}>
                <FaTrash />
              </button>
            </span>
          ))}
        </div>
      </div>
      <div className={styles.section}>
        <input
          className={styles.field}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={dict.product_name_placeholder}
          required
        />

        <div className={styles.row}>
          <input
            className={styles.field}
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            step="0.01"
            min="0"
            placeholder={dict.product_price_placeholder}
            required
          />
          <span>€</span>
        </div>

        <textarea
          className={styles.field}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={dict.product_description_placeholder}
          rows={3}
        />

        <select
          className={styles.field}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required>
          <option value="">{dict.choose_categories}</option>
          {allCategories.map((cat) => (
            <option key={cat.id || cat.name} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>

        <div className={styles.row}>
          <input
            className={styles.field}
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder={dict.new_category_placeholder}
          />
          <button type="button" className={styles.button} onClick={handleAddCategory}>
            {dict.add_category_button}
          </button>
        </div>

        <select
          className={styles.field}
          value={stockType}
          onChange={(e) => setStockType(e.target.value as "limited" | "on_demand")}>
          <option value="limited">{dict.limited_stock}</option>
          <option value="on_demand">{dict.on_demand_stock}</option>
        </select>

        {stockType === "limited" && variants.length === 0 && (
          <input
            className={styles.field}
            type="number"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(Number(e.target.value))}
            placeholder={dict.product_quantity_placeholder}
            min="0"
          />
        )}
        <div className={styles.row} style={{ position: "relative" }}>
          <input
            ref={inputRef}
            type="text"
            value={orderDeadline ? orderDeadline.toLocaleString(locale) : ""}
            placeholder={dict.limit_date_placeholder}
            readOnly
            onClick={() => setShowDatePicker(true)}
            className={styles.field}
          />
          {showDatePicker && (
            <div style={{ position: "absolute", zIndex: 10 }}>
              <DayPicker
                mode="single"
                selected={orderDeadline}
                onSelect={(date) => {
                  setOrderDeadline(date ?? undefined);
                  setShowDatePicker(false);
                }}
                weekStartsOn={1}
                captionLayout="dropdown"
                navLayout="around"
              />
            </div>
          )}
        </div>
        <div>
          <label className={styles.label}>{dict.option_types}</label>
          <div className={styles.row}>
            {optionTypes.map((type, idx) => (
              <div key={idx} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  className={styles.field}
                  style={{ width: 120 }}
                  value={type}
                  onChange={(e) => updateOptionType(idx, e.target.value)}
                  placeholder={`${dict.option_placeholder} ${idx + 1}`}
                />
                {optionTypes.length > 1 && (
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => removeOptionType(idx)}>
                    <FaTrash />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className={styles.addButton} onClick={addOptionType}>
              <FaPlus />
            </button>
          </div>
        </div>
        <div>
          <div className={styles.row}>
            <label className={styles.label}>{dict.variants_label}</label>
            <button type="button" className={styles.addButton} onClick={addVariant}>
              <FaPlus />
            </button>
          </div>

          {variants.length === 0 && <div className={styles.noVarients}>{dict.no_variants}</div>}

          {variants.map((variant, i) => (
            <div
              key={variant.id ?? `new-${i}`}
              className={styles.row}
              style={{ alignItems: "flex-start", gap: "0.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {optionTypes.map((type) => {
                  const raw = variant.options[type] || "";
                  if (isColorKey(type)) {
                    const { name: colorName, hex: colorHex } = splitNameHex(raw);
                    return (
                      <div
                        key={type}
                        style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <input
                          className={styles.field}
                          style={{ width: 140 }}
                          value={colorName}
                          onChange={(e) =>
                            updateVariantOption(i, type, joinNameHex(e.target.value, colorHex))
                          }
                          placeholder={type}
                          required
                        />
                        <div style={{ width: 220, display: "flex", alignItems: "center", gap: 8 }}>
                          <ColourPicker
                            value={colorHex || "#000000"}
                            onChange={(hex) => {
                              updateVariantOption(i, type, joinNameHex(colorName, hex));
                            }}
                          />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <input
                      key={type}
                      className={styles.field}
                      style={{ width: 100 }}
                      value={variant.options[type] || ""}
                      onChange={(e) => updateVariantOption(i, type, e.target.value)}
                      placeholder={type}
                      required
                    />
                  );
                })}
              </div>

              <input
                className={styles.field}
                style={{ width: 80 }}
                type="number"
                value={variant.price_modifier}
                onChange={(e) => updateVariant(i, { price_modifier: Number(e.target.value) })}
                step="0.01"
                placeholder={dict.extra_price}
              />

              <input
                className={styles.field}
                style={{ width: 60 }}
                type="number"
                value={variant.stock_quantity}
                onChange={(e) => updateVariant(i, { stock_quantity: Number(e.target.value) })}
                min="0"
                placeholder={dict.stock_placeholder}
              />

              <input
                type="checkbox"
                checked={variant.active}
                onChange={(e) => updateVariant(i, { active: e.target.checked })}
                style={{ width: 20, height: 20 }}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label className={styles.button} style={{ fontSize: "0.8rem", padding: "0.25rem" }}>
                  <FaUpload />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleVariantImageUpload(e, i)}
                    hidden
                  />
                </label>

                <div className={styles.thumbList}>
                  {variant.images?.map((img, idx) => (
                    <span key={`img-${idx}`} className={styles.thumbItem}>
                      <Image src={img} alt="" width={24} height={24} className={styles.thumb} />
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => {
                          const newImages =
                            variant.images?.filter((_, imgIdx) => imgIdx !== idx) || [];
                          updateVariant(i, { images: newImages });
                        }}>
                        <FaTrash />
                      </button>
                    </span>
                  ))}
                  {variant.newImages.map((upload, idx) => (
                    <span key={`${dict.upload} ${idx}`} className={styles.thumbItem}>
                      <Image
                        src={upload.preview}
                        alt=""
                        width={24}
                        height={24}
                        className={styles.thumb}
                      />
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => {
                          URL.revokeObjectURL(upload.preview);
                          const newUploads = variant.newImages.filter(
                            (_, imgIdx) => imgIdx !== idx
                          );
                          updateVariant(i, { newImages: newUploads });
                        }}>
                        <FaTrash />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => removeVariant(i)}>
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className={styles.button} disabled={uploading}>
        {uploading ? dict.saving : isEdit ? dict.save_changes : dict.create_product}
      </button>
    </form>
  );
}
