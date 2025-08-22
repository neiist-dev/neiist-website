"use client";
import { useState } from "react";
import Image from "next/image";
import { DatePicker, useDateInput } from "react-nice-dates";
import { enGB } from "date-fns/locale";
import "react-nice-dates/build/style.css";
import { FaArrowLeft, FaPlus, FaArrowRight } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import { Product, ProductVariant } from "@/types/shop";
import styles from "@/styles/components/shop/ProductForm.module.css";

interface ProductFormProps {
  product?: Product | null;
  isEdit?: boolean;
  onBack: () => void;
}

export default function ProductForm({ product, isEdit = false, onBack }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    category: product?.category || "Vestuário",
    stock_type: product?.stock_type || ("limited" as const),
    stock_quantity: product?.stock_quantity || 0,
  });

  const [orderDeadline, setOrderDeadline] = useState<Date | undefined>(
    product?.order_deadline ? new Date(product.order_deadline) : undefined
  );
  const [estimatedDelivery, setEstimatedDelivery] = useState<Date | undefined>(
    product?.estimated_delivery ? new Date(product.estimated_delivery) : undefined
  );

  const [images, setImages] = useState<string[]>(product?.images || [""]);
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleOrderDeadlineChange = (date: Date | null) => {
    setOrderDeadline(date || undefined);
  };

  const handleEstimatedDeliveryChange = (date: Date | null) => {
    setEstimatedDelivery(date || undefined);
  };

  const orderDeadlineTimeProps = useDateInput({
    date: orderDeadline || undefined,
    format: "HH:mm",
    locale: enGB,
    onDateChange: handleOrderDeadlineChange,
  });

  const estimatedDeliveryTimeProps = useDateInput({
    date: estimatedDelivery || undefined,
    format: "HH:mm",
    locale: enGB,
    onDateChange: handleEstimatedDeliveryChange,
  });

  const availableImages = images
    .concat(
      variants
        .flatMap((v) => v.images || [])
        .filter((img, idx, arr) => img && arr.indexOf(img) === idx)
    )
    .filter(Boolean);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "stock_quantity" ? Number(value) : value,
    }));
  };

  const addVariant = () => {
    setVariants([
      ...variants,
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

  const updateVariant = <Id extends keyof ProductVariant>(
    index: number,
    field: Id,
    value: ProductVariant[Id]
  ) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData: Product = {
      ...formData,
      images: images.filter(Boolean),
      variants: variants.filter((v) => v.variant_name && v.variant_value),
      order_deadline: orderDeadline?.toISOString() || "",
      estimated_delivery: estimatedDelivery?.toISOString() || "",
      id: product?.id || Date.now(),
    };

    const url = isEdit ? `/api/shop/products/${product?.id}` : "/api/shop/products";
    const method = isEdit ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        window.location.href = "/shop/manage";
      } else {
        const error = await response.json();
        alert("Error saving product: " + error.error);
      }
    } catch {
      alert("Error saving product. Please try again.");
    }
  };

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={onBack}>
        <FaArrowLeft /> Voltar
      </button>

      <h1 className={styles.title}>{isEdit ? `Editar ${formData.name}` : "Adicionar Produto"}</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <section className={styles.imageSection}>
          <div className={styles.imagePreview}>
            {availableImages[selectedImageIndex] ? (
              <Image
                src={availableImages[selectedImageIndex]}
                alt="Product"
                width={400}
                height={400}
                className={styles.mainImage}
              />
            ) : (
              <div className={styles.noImage}>Nenhuma imagem</div>
            )}
            {availableImages.length > 1 && (
              <>
                <button
                  type="button"
                  className={styles.imageArrow}
                  style={{ left: "1rem" }}
                  onClick={() =>
                    setSelectedImageIndex(
                      (prev) => (prev - 1 + availableImages.length) % availableImages.length
                    )
                  }>
                  <FaArrowLeft />
                </button>
                <button
                  type="button"
                  className={styles.imageArrow}
                  style={{ right: "1rem" }}
                  onClick={() =>
                    setSelectedImageIndex((prev) => (prev + 1) % availableImages.length)
                  }>
                  <FaArrowRight />
                </button>
              </>
            )}
          </div>

          <label className={styles.label}>
            URLs das Imagens (no upload needs to exist on the server /products/...){" "}
          </label>
          {/* TODO: Add image upload for products image */}
          {images.map((img, idx) => (
            <input
              key={idx}
              type="text"
              value={img}
              onChange={(e) => {
                const updated = [...images];
                updated[idx] = e.target.value;
                setImages(updated);
              }}
              placeholder={`URL da imagem ${idx + 1}`}
              className={styles.input}
            />
          ))}
          <button
            type="button"
            onClick={() => setImages([...images, ""])}
            className={styles.addBtn}>
            <FaPlus /> Adicionar Imagem
          </button>
        </section>

        <section className={styles.formSection}>
          <label className={styles.label}>Nome do Produto</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Nome do produto"
            className={styles.input}
            required
          />

          <label className={styles.label}>Preço</label>
          <div className={styles.priceInput}>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              required
            />
            <span>€</span>
          </div>

          <label className={styles.label}>Descrição</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Descrição do produto"
            rows={3}
            className={styles.input}
          />

          <label className={styles.label}>Categoria</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className={styles.input}>
            <option value="Vestuário">Vestuário</option>
            <option value="Merch">Merch</option>
          </select>

          <label className={styles.label}>Tipo de Stock</label>
          <select
            name="stock_type"
            value={formData.stock_type}
            onChange={handleInputChange}
            className={styles.input}>
            <option value="limited">Limitado</option>
            <option value="on_demand">Sob Encomenda</option>
          </select>

          {formData.stock_type === "limited" && (
            <>
              <label className={styles.label}>Quantidade em Stock</label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleInputChange}
                placeholder="Quantidade em stock"
                min="0"
                className={styles.input}
              />
            </>
          )}

          <label className={styles.label}>Data Limite de Encomenda</label>
          <div className={styles.dateInput}>
            <DatePicker
              date={orderDeadline}
              onDateChange={handleOrderDeadlineChange}
              locale={enGB}
              format="dd/MM/yyyy">
              {({ inputProps, focused }) => (
                <input
                  {...inputProps}
                  className={`${styles.input} ${focused ? styles.focused : ""}`}
                  placeholder="Selecionar data"
                />
              )}
            </DatePicker>
            <input
              className={`${styles.input} ${styles.timeInput}`}
              placeholder="00:00"
              {...orderDeadlineTimeProps}
            />
          </div>

          <label className={styles.label}>Data Estimada de Entrega</label>
          <div className={styles.dateInput}>
            <DatePicker
              date={estimatedDelivery}
              onDateChange={handleEstimatedDeliveryChange}
              locale={enGB}
              format="dd/MM/yyyy">
              {({ inputProps, focused }) => (
                <input
                  {...inputProps}
                  className={`${styles.input} ${focused ? styles.focused : ""}`}
                  placeholder="Selecionar data"
                />
              )}
            </DatePicker>
            <input
              className={`${styles.input} ${styles.timeInput}`}
              placeholder="00:00"
              {...estimatedDeliveryTimeProps}
            />
          </div>

          <div className={styles.variantsSection}>
            <div className={styles.variantHeader}>
              <span className={styles.label}>Variantes</span>
              <button type="button" onClick={addVariant} className={styles.addBtn}>
                <FaPlus />
              </button>
            </div>
            {variants.map((variant, index) => (
              <div key={index} className={styles.variant}>
                <input
                  type="text"
                  placeholder="Tipo (ex: Tamanho)"
                  value={variant.variant_name}
                  onChange={(e) => updateVariant(index, "variant_name", e.target.value)}
                  className={styles.input}
                />
                <input
                  type="text"
                  placeholder="Valor (ex: M)"
                  value={variant.variant_value}
                  onChange={(e) => updateVariant(index, "variant_value", e.target.value)}
                  className={styles.input}
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={variant.stock_quantity || 0}
                  onChange={(e) => updateVariant(index, "stock_quantity", Number(e.target.value))}
                  min="0"
                  className={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                  className={styles.removeBtn}>
                  <FiTrash2 />
                </button>
              </div>
            ))}

            {variants.length === 0 && (
              <p className={styles.noVariants}>Nenhuma variante. Clique no + para adicionar.</p>
            )}
          </div>

          <button type="submit" className={styles.saveBtn}>
            {isEdit ? "Guardar Alterações" : "Criar Produto"}
          </button>
        </section>
      </form>
    </div>
  );
}
