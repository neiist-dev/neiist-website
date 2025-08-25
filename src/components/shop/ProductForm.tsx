"use client";
import { useState } from "react";
import Image from "next/image";
import { DatePicker, useDateInput } from "react-nice-dates";
import { enGB } from "date-fns/locale";
import "react-nice-dates/build/style.css";
import {
  FaArrowLeft,
  FaPlus,
  FaUpload,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { Product, ProductVariant, Category } from "@/types/shop";
import styles from "@/styles/components/shop/ProductForm.module.css";

interface ProductFormProps {
  product?: Product | null;
  isEdit?: boolean;
  onBack: () => void;
  categories: Category[];
}

export default function ProductForm({
  product,
  isEdit = false,
  onBack,
  categories,
}: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    category: product?.category || (categories[0]?.name ?? ""),
    stock_type: product?.stock_type || ("limited" as const),
    stock_quantity: product?.stock_quantity || 0,
  });

  const [orderDeadline, setOrderDeadline] = useState<Date | undefined>(
    product?.order_deadline ? new Date(product.order_deadline) : undefined
  );
  const [estimatedDelivery, setEstimatedDelivery] = useState<Date | undefined>(
    product?.estimated_delivery ? new Date(product.estimated_delivery) : undefined
  );

  const [existingImages, setExistingImages] = useState<string[]>(product?.images || []);
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState<
    Array<{ imageBase64: string; imageName: string; previewUrl: string }>
  >([]);

  const allImages = [...existingImages, ...pendingUploads.map((u) => u.previewUrl)].filter(Boolean);
  const totalVariantStock = variants.reduce(
    (sum, variant) => sum + (variant.stock_quantity || 0),
    0
  );
  const hasVariants = variants.length > 0;

  const orderDeadlineTimeProps = useDateInput({
    date: orderDeadline || undefined,
    format: "HH:mm",
    locale: enGB,
    onDateChange: (d) => setOrderDeadline(d || undefined),
  });
  const estimatedDeliveryTimeProps = useDateInput({
    date: estimatedDelivery || undefined,
    format: "HH:mm",
    locale: enGB,
    onDateChange: (d) => setEstimatedDelivery(d || undefined),
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: name === "price" || name === "stock_quantity" ? Number(value) : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes("jpeg") && !file.type.includes("jpg")) {
      setUploadError("Por favor selecione apenas ficheiros JPG");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const imageName =
        file.name
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "")
          .replace(/\.jpg$/, "") + ".jpg";
      const previewUrl = `data:image/jpeg;base64,${imageBase64}`;
      setPendingUploads((prev) => [...prev, { imageBase64, imageName, previewUrl }]);
      setSelectedImageIndex(existingImages.length + pendingUploads.length);
    } catch {
      setUploadError("Erro ao processar a imagem");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number, isPending: boolean) => {
    if (isPending) {
      setPendingUploads((p) => p.filter((_, i) => i !== index - existingImages.length));
    } else {
      setExistingImages((p) => p.filter((_, i) => i !== index));
    }
    setSelectedImageIndex(0);
  };

  const addVariant = () => {
    setVariants((p) => [
      ...p,
      {
        id: Date.now(),
        variant_name: "",
        variant_value: "",
        price_modifier: 0,
        stock_quantity: 0,
        active: true,
        images: [],
      },
    ]);
  };

  const updateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: string | number | boolean | string[]
  ) => {
    setVariants((p) => p.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const removeVariant = (index: number) => {
    setVariants((p) => p.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      ...formData,
      images: existingImages,
      variants: variants.filter((v) => v.variant_name && v.variant_value),
      order_deadline: orderDeadline?.toISOString() || "",
      estimated_delivery: estimatedDelivery?.toISOString() || "",
      id: product?.id || Date.now(),
      imageUploads: pendingUploads.map(({ imageBase64, imageName }) => ({
        imageBase64,
        imageName,
      })),
    };
    try {
      const response = await fetch(
        isEdit ? `/api/shop/products/${product?.id}` : "/api/shop/products",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        }
      );
      if (response.ok) window.location.href = "/shop/manage";
      else {
        const error = await response.json();
        alert("Error: " + error.error);
      }
    } catch {
      alert("Error saving product.");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <button type="button" className={styles.backButton} onClick={onBack}>
        <FaArrowLeft /> Voltar
      </button>
      <h1 className={styles.title}>{isEdit ? `Editar ${formData.name}` : "Adicionar Produto"}</h1>

      <div className={styles.section}>
        <label className={styles.label}>Imagens</label>
        <div className={styles.imageArea}>
          {allImages.length ? (
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
                    onClick={() => setSelectedImageIndex((i) => Math.max(0, i - 1))}>
                    <FaChevronLeft />
                  </button>
                  <span>
                    {selectedImageIndex + 1}/{allImages.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImageIndex((i) => Math.min(allImages.length - 1, i + 1))
                    }>
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.noImage}>Nenhuma imagem</div>
          )}
        </div>
        <label className={styles.button}>
          <FaUpload /> {uploading ? "A processar..." : "Upload (.jpg)"}
          <input
            type="file"
            accept=".jpg,image/jpeg"
            onChange={handleImageUpload}
            disabled={uploading}
            hidden
          />
        </label>
        {uploadError && <div className={styles.error}>{uploadError}</div>}
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
                onClick={() => removeImage(idx, idx >= existingImages.length)}>
                <FaTrash />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Produto</label>
        <input
          className={styles.field}
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Nome"
          required
        />
        <div className={styles.row}>
          <input
            className={styles.field}
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            placeholder="Preço"
            required
          />
          <span>€</span>
        </div>
        <textarea
          className={styles.field}
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Descrição"
          rows={3}
        />
        <select
          className={styles.field}
          name="category"
          value={formData.category}
          onChange={handleInputChange}>
          <option value="">Escolha uma categoria</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          className={styles.field}
          name="stock_type"
          value={formData.stock_type}
          onChange={handleInputChange}>
          <option value="limited">Stock Limitado</option>
          <option value="on_demand">Sob Encomenda</option>
        </select>
        {formData.stock_type === "limited" && !hasVariants && (
          <input
            className={styles.field}
            type="number"
            name="stock_quantity"
            value={formData.stock_quantity}
            onChange={handleInputChange}
            placeholder="Quantidade"
            min="0"
          />
        )}
        {hasVariants && formData.stock_type === "limited" && (
          <div>Stock Total: {totalVariantStock}</div>
        )}
        <div className={styles.row}>
          <DatePicker
            date={orderDeadline}
            onDateChange={(d) => setOrderDeadline(d || undefined)}
            locale={enGB}
            format="dd/MM/yyyy">
            {({ inputProps }) => (
              <input {...inputProps} placeholder="Data limite" className={styles.field} />
            )}
          </DatePicker>
          <input {...orderDeadlineTimeProps} placeholder="00:00" className={styles.field} />
        </div>
        <div className={styles.row}>
          <DatePicker
            date={estimatedDelivery}
            onDateChange={(d) => setEstimatedDelivery(d || undefined)}
            locale={enGB}
            format="dd/MM/yyyy">
            {({ inputProps }) => (
              <input {...inputProps} placeholder="Data entrega" className={styles.field} />
            )}
          </DatePicker>
          <input {...estimatedDeliveryTimeProps} placeholder="00:00" className={styles.field} />
        </div>

        <div style={{ marginTop: "1.2rem" }}>
          <div className={styles.row} style={{ marginBottom: "0.5rem" }}>
            <label className={styles.label}>Variantes</label>
            <button
              type="button"
              className={styles.addButton}
              onClick={addVariant}
              aria-label="Adicionar variante">
              <FaPlus />
            </button>
          </div>
          {!variants.length && <div className={styles.noVarients}>Sem variantes</div>}
          {variants.map((variant, i) => (
            <div key={i} className={styles.row}>
              <input
                className={styles.field}
                placeholder="Tipo"
                value={variant.variant_name}
                onChange={(e) => updateVariant(i, "variant_name", e.target.value)}
              />
              <input
                className={styles.field}
                placeholder="Valor"
                value={variant.variant_value}
                onChange={(e) => updateVariant(i, "variant_value", e.target.value)}
              />
              <input
                className={styles.field}
                type="number"
                placeholder="Stock"
                value={variant.stock_quantity || 0}
                onChange={(e) => updateVariant(i, "stock_quantity", Number(e.target.value))}
                min="0"
              />
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

      <button type="submit" className={styles.button}>
        {isEdit ? "Guardar" : "Criar"}
      </button>
    </form>
  );
}
