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

//Temp save the varaints images before upload
type VariantFormRow = ProductVariant & {
  imageUploads?: Array<{ imageBase64: string; imageName: string }>;
};

function variantToFormRow(v: ProductVariant): VariantFormRow {
  return {
    id: v.id,
    sku: v.sku,
    images: v.images,
    price_modifier: v.price_modifier ?? 0,
    stock_quantity: v.stock_quantity,
    active: v.active,
    label: v.label ?? undefined,
    options: v.options ?? {},
  };
}

export default function ProductForm({
  product,
  isEdit = false,
  onBack,
  categories,
}: ProductFormProps) {
  const [optionTypes, setOptionTypes] = useState<string[]>(
    product?.variants?.length
      ? Array.from(new Set(product.variants.flatMap((v) => Object.keys(v.options || {}))))
      : ["Cor", "Tamanho"]
  );

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
  const [cats, setCats] = useState<Category[]>(categories);
  const [newCategory, setNewCategory] = useState("");
  const [variantsForm, setVariantsForm] = useState<VariantFormRow[]>(
    (product?.variants || []).map(variantToFormRow)
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState<
    Array<{ imageBase64: string; imageName: string; previewUrl: string }>
  >([]);

  const allImages = [...existingImages, ...pendingUploads.map((u) => u.previewUrl)].filter(Boolean);
  const totalVariantStock = variantsForm.reduce(
    (sum, variant) => sum + (variant.stock_quantity || 0),
    0
  );
  const hasVariants = variantsForm.length > 0;

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
    const isImage =
      (file.type && file.type.startsWith("image/")) || /\.(png|jpe?g)$/i.test(file.name);

    if (!isImage) {
      setUploadError("Por favor selecione uma imagem (jpg, jpeg ou png)");
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
      const imageName = file.name;
      const previewUrl = `data:${file.type || "image/*"};base64,${imageBase64}`;

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

  const addOptionType = () => {
    setOptionTypes((prev) => [...prev, ""]);
  };
  const updateOptionType = (idx: number, value: string) => {
    setOptionTypes((prev) => prev.map((t, i) => (i === idx ? value : t)));
    setVariantsForm((prev) =>
      prev.map((v) => {
        const newOptions: Record<string, string> = {};
        optionTypes.forEach((oldType, i) => {
          const newType = i === idx ? value : oldType;
          if (v.options[oldType] !== undefined) {
            newOptions[newType] = v.options[oldType];
          }
        });
        return { ...v, options: newOptions };
      })
    );
  };
  const removeOptionType = (idx: number) => {
    const typeToRemove = optionTypes[idx];
    setOptionTypes((prev) => prev.filter((_, i) => i !== idx));
    setVariantsForm((prev) =>
      prev.map((v) => {
        const newOptions = { ...v.options };
        delete newOptions[typeToRemove];
        return { ...v, options: newOptions };
      })
    );
  };

  const addVariant = () => {
    setVariantsForm((p) => [
      ...p,
      {
        id: Date.now() + Math.floor(Math.random() * 10000),
        price_modifier: 0,
        stock_quantity: 0,
        active: true,
        options: Object.fromEntries(optionTypes.map((t) => [t, ""])),
      },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariantsForm((p) => p.filter((_, i) => i !== index));
  };

  const updateVariantField = (
    index: number,
    field: keyof VariantFormRow,
    value: string | number | boolean | string[]
  ) => {
    setVariantsForm((p) => p.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const updateVariantOption = (variantIndex: number, optionType: string, value: string) => {
    setVariantsForm((p) =>
      p.map((v, i) =>
        i === variantIndex ? { ...v, options: { ...v.options, [optionType]: value } } : v
      )
    );
  };

  const handleVariantImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    variantIndex: number
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const uploads: Array<{ imageBase64: string; imageName: string }> = [];
    for (const file of files) {
      const isImage =
        (file.type && file.type.startsWith("image/")) || /\.(png|jpe?g)$/i.test(file.name);
      if (!isImage) continue;
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      uploads.push({ imageBase64, imageName: file.name });
    }
    setVariantsForm((p) =>
      p.map((v, i) =>
        i === variantIndex ? { ...v, imageUploads: [...(v.imageUploads || []), ...uploads] } : v
      )
    );
  };

  const removeVariantImage = (variantIndex: number, imgIdx: number) => {
    setVariantsForm((p) =>
      p.map((v, i) =>
        i === variantIndex ? { ...v, images: (v.images || []).filter((_, j) => j !== imgIdx) } : v
      )
    );
  };

  const removeVariantUpload = (variantIndex: number, uploadIdx: number) => {
    setVariantsForm((p) =>
      p.map((v, i) =>
        i === variantIndex
          ? { ...v, imageUploads: (v.imageUploads || []).filter((_, j) => j !== uploadIdx) }
          : v
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const v of variantsForm) {
      for (const t of optionTypes) {
        if (!v.options[t] || !v.options[t].trim()) {
          alert(`Todas as variantes devem ter o campo "${t}" preenchido.`);
          return;
        }
      }
    }
    const seen = new Set();
    for (const v of variantsForm) {
      const key = optionTypes.map((t) => v.options[t]).join("|");
      if (seen.has(key)) {
        alert("Não pode haver variantes duplicadas (mesma combinação de opções).");
        return;
      }
      seen.add(key);
    }

    const variants: ProductVariant[] = variantsForm.map((row) => ({
      ...row,
      imageUploads: row.imageUploads || [],
      images: row.images || [],
      options: { ...row.options },
    }));

    const productData = {
      ...formData,
      images: existingImages,
      variants,
      order_deadline: orderDeadline ? orderDeadline.toISOString() : null,
      estimated_delivery: estimatedDelivery ? estimatedDelivery.toISOString() : null,
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

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/shop/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Erro ao criar categoria");
        return;
      }
      const { category } = await res.json();
      setCats((prev) =>
        prev.some((c) => c.name.toLowerCase() === category.name.toLowerCase())
          ? prev
          : [...prev, category]
      );
      setFormData((p) => ({ ...p, category: category.name }));
      setNewCategory("");
    } catch {
      alert("Erro ao criar categoria");
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
          <FaUpload /> {uploading ? "A processar..." : "Upload (.jpg, .jpeg, .png)"}
          <input
            type="file"
            accept=".jpg,.jpeg,.png,image/*"
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
          {cats.map((cat) => (
            <option key={cat.id ?? cat.name} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
        <div className={styles.row}>
          <input
            className={styles.field}
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nova categoria"
          />
          <button
            type="button"
            className={styles.button}
            onClick={handleAddCategory}
            disabled={!newCategory.trim()}>
            Adicionar
          </button>
        </div>
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
        <div className={styles.section}>
          <label className={styles.label}>Tipos de Opção (ex: Cor, Tamanho)</label>
          <div className={styles.row}>
            {optionTypes.map((type, idx) => (
              <span key={idx} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input
                  className={styles.field}
                  style={{ width: 120 }}
                  value={type}
                  onChange={(e) => updateOptionType(idx, e.target.value)}
                  placeholder={`Opção ${idx + 1}`}
                />
                {optionTypes.length > 1 && (
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => removeOptionType(idx)}>
                    <FaTrash />
                  </button>
                )}
              </span>
            ))}
            <button type="button" className={styles.addButton} onClick={addOptionType}>
              <FaPlus />
            </button>
          </div>
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

          {!variantsForm.length && <div className={styles.noVarients}>Sem variantes</div>}

          {variantsForm.length > 0 && (
            <div className={styles.row} style={{ fontWeight: 600 }}>
              {optionTypes.map((type) => (
                <span key={type} style={{ minWidth: 90 }}>
                  {type}
                </span>
              ))}
              <span style={{ minWidth: 90 }}>Preço extra</span>
              <span style={{ minWidth: 90 }}>Stock</span>
              <span style={{ minWidth: 90 }}>Ativo</span>
              <span style={{ minWidth: 90 }}>Imagens</span>
              <span></span>
            </div>
          )}

          {variantsForm.map((variant, i) => (
            <div key={variant.id} className={styles.row}>
              {optionTypes.map((type) => (
                <input
                  key={type}
                  className={styles.field}
                  style={{ width: 90 }}
                  value={variant.options[type] || ""}
                  onChange={(e) => updateVariantOption(i, type, e.target.value)}
                  placeholder={type}
                  required
                />
              ))}
              <input
                className={styles.field}
                style={{ width: 90 }}
                type="number"
                value={variant.price_modifier}
                onChange={(e) => updateVariantField(i, "price_modifier", Number(e.target.value))}
                step="0.01"
                aria-label="Preço extra"
              />
              <input
                className={styles.field}
                style={{ width: 90 }}
                type="number"
                value={variant.stock_quantity ?? 0}
                onChange={(e) => updateVariantField(i, "stock_quantity", Number(e.target.value))}
                min="0"
                aria-label="Stock"
              />
              <input
                type="checkbox"
                checked={variant.active}
                onChange={(e) => updateVariantField(i, "active", e.target.checked)}
                style={{ width: 20, height: 20 }}
              />
              <span>
                <label className={styles.button} style={{ marginTop: 4 }}>
                  <FaUpload /> Imagem
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/*"
                    multiple
                    onChange={(e) => handleVariantImageUpload(e, i)}
                    style={{ display: "none" }}
                  />
                </label>
                <div className={styles.thumbList}>
                  {(variant.images || []).map((img, idx) => (
                    <span key={"img-" + idx} className={styles.thumbItem}>
                      <Image src={img} alt="" width={32} height={32} className={styles.thumb} />
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => removeVariantImage(i, idx)}>
                        <FaTrash />
                      </button>
                    </span>
                  ))}
                  {(variant.imageUploads || []).map((upload, idx) => (
                    <span key={"upload-" + idx} className={styles.thumbItem}>
                      <Image
                        src={`data:image/*;base64,${upload.imageBase64}`}
                        alt=""
                        width={32}
                        height={32}
                        className={styles.thumb}
                      />
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => removeVariantUpload(i, idx)}>
                        <FaTrash />
                      </button>
                    </span>
                  ))}
                </div>
              </span>
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
