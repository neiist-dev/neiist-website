"use client";
import { useState, useRef, useEffect } from "react";
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
  FaSave,
} from "react-icons/fa";
import { Product, Category } from "@/types/shop";
import styles from "@/styles/components/shop/ProductForm.module.css";
import { splitNameHex, joinNameHex, isColorKey } from "@/utils/shopUtils";
import ColourPicker from "@/components/ColourPicker";
import TagInput from "@/components/TagInput";

interface ProductFormProps {
  product?: Product | null;
  isEdit?: boolean;
  onBack: () => void;
  categories: Category[];
}

type VariantDefinition = {
  id: string;
  name: string;
  values: string[];
};

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

  const [variantDefinitions, setVariantDefinitions] = useState<VariantDefinition[]>(() => {
    if (product?.variants?.length) {
      const types = [...new Set(product.variants.flatMap((v) => Object.keys(v.options || {})))];
      return types.map((type) => {
        const values = [
          ...new Set(
            product.variants
              ?.map((v) => v.options[type])
              .filter((v): v is string => typeof v === "string")
          ),
        ];
        return { id: Math.random().toString(36).substr(2, 9), name: type, values };
      });
    }
    return [
      { id: "1", name: "Cor", values: [] },
      { id: "2", name: "Tamanho", values: [] },
    ];
  });

  // Calculate optionTypes derived from variantDefinitions for rendering the table
  const optionTypes = variantDefinitions.map((d) => d.name).filter((n) => n);

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

  const generateVariants = (currentDefinitions: VariantDefinition[]) => {
    const validDefs = currentDefinitions.filter((def) => def.name && def.values.length > 0);

    if (validDefs.length === 0) {
      // If no valid definitions, maybe clear variants?
      // Or keep them until explicitly deleted?
      // Usually if I delete all tags, I expect variants to go away.
      // Let's decide: if validDefs is empty but we have definitions, clear.
      if (currentDefinitions.length > 0 && variants.length > 0) {
        // Only if we actually have some definitions structures but no values
        // But maybe the user is just clearing to type new ones.
        // Let's be safe and do nothing or just return.
        // If the user deleted all values from a definition, we probably should remove those variants.
      }
      return;
    }

    // Cartesian product helper
    const cartesian = (sets: string[][]) =>
      sets.reduce<string[][]>((acc, set) => acc.flatMap((x) => set.map((y) => [...x, y])), [[]]);

    const names = validDefs.map((def) => def.name);
    const values = validDefs.map((def) => def.values);
    const combinations = cartesian(values);

    const newVariants = combinations.map((combination) => {
      const options = Object.fromEntries(names.map((name, i) => [name, combination[i]]));

      // Check if variant already exists to preserve data (stock, prices, images)
      const existing = variants.find((v) =>
        names.every((name) => {
          const existingVal = v.options[name] || "";
          const newVal = options[name];
          if (isColorKey(name)) {
            const { hex: existHex } = splitNameHex(existingVal);
            const { hex: newHex } = splitNameHex(newVal);
            if (existHex && newHex && existHex === newHex) return true;
          }
          return existingVal === newVal;
        })
      );

      if (existing) return existing;

      return {
        options,
        price_modifier: 0,
        stock_quantity: 0,
        active: true,
        images: [],
        newImages: [],
      };
    });

    setVariants(newVariants);
  };

  // Auto-generate variants when definitions change
  useEffect(() => {
    // Debounce to avoid rapid updates while typing
    const timer = setTimeout(() => {
      generateVariants(variantDefinitions);
    }, 500);
    return () => clearTimeout(timer);
  }, [variantDefinitions]);

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
        setError("Erro ao criar categoria: " + (errorData.message || errorData.error));
      }
    } catch (error) {
      console.error("Category creation error:", error);
      // TODO: (ERROR)
      setError("Erro ao criar categoria");
    }
  };

  const addVariantDefinition = () => {
    setVariantDefinitions((prev) => [
      ...prev,
      { id: Math.random().toString(36).substr(2, 9), name: "", values: [] },
    ]);
  };

  const updateVariantDefinitionName = (index: number, newName: string) => {
    const oldName = variantDefinitions[index].name;
    setVariantDefinitions((prev) =>
      prev.map((def, i) => (i === index ? { ...def, name: newName } : def))
    );

    // Update variants matrix to reflect name change
    setVariants((prev) =>
      prev.map((variant) => {
        const newOptions = { ...variant.options };
        if (oldName in newOptions && newName !== oldName) {
          newOptions[newName] = newOptions[oldName];
          delete newOptions[oldName];
        }
        return { ...variant, options: newOptions };
      })
    );
  };

  const updateVariantDefinitionValues = (index: number, newValues: string[]) => {
    setVariantDefinitions((prev) => {
      const next = prev.map((def, i) => (i === index ? { ...def, values: newValues } : def));

      // Auto-regenerate variants if all definitions have at least one value
      // We use a small timeout or useEffect, but here we can just call generation logic directly
      // However, we need the *updated* state. So we'll trigger a side effect or just use 'next'.
      // Better yet: useEffect to watch variantDefinitions? Or just call a helper here.
      // Calling helper here is safer to avoid infinite loops if helper sets state.

      // We will perform the regeneration logic immediately with the new definitions
      // But we need to be careful not to spam re-renders or lose work.
      // The request says "automatically as one adds/removes variants".
      // Let's create a throttled or direct cal to regenerate.

      return next;
    });
  };

  const removeVariantDefinition = (index: number) => {
    const removedName = variantDefinitions[index].name;
    setVariantDefinitions((prev) => prev.filter((_, i) => i !== index));

    // Remove this option from all variants
    setVariants((prev) =>
      prev.map((variant) => ({
        ...variant,
        options: Object.fromEntries(
          Object.entries(variant.options).filter(([key]) => key !== removedName)
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
      setError("Nome é obrigatório");
      return;
    }
    if (!category) {
      // TODO: (ERROR)
      setError("Categoria é obrigatória");
      return;
    }
    for (const variant of variants) {
      for (const optionType of optionTypes) {
        const val = (variant.options[optionType] || "").trim();
        if (!val) {
          // TODO: (ERROR)
          setError(`Variante deve ter "${optionType}" preenchido`);
          return;
        }
        if (isColorKey(optionType)) {
          const { hex } = splitNameHex(val);
          if (!hex) {
            // TODO: (ERROR)
            setError(
              `Opção de cor "${optionType}" precisa de um valor com hex (ex: Verde - #2C4A52)`
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
        setError("Erro: " + (errorData.message || errorData.error || "Erro desconhecido"));
      }
    } catch {
      // TODO: (ERROR)
      setError("Erro ao guardar produto");
    } finally {
      setUploading(false);
    }
  };

  const totalVariantStock = variants.reduce((sum, v) => sum + (v.active ? Number(v.stock_quantity) || 0 : 0), 0);

  const hasVariants = variants.length > 0;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className={styles.formHeader}>
          <button type="button" className={styles.backButton} onClick={onBack}>
            <FaArrowLeft /> Voltar
          </button>
          <h1 className={styles.title}>{isEdit ? `Editar Produto` : "Adicionar Novo Produto"}</h1>
          <button type="submit" className={styles.button} disabled={uploading}>
            {isEdit ? (
              <>
                <FaSave /> {uploading ? "A guardar..." : "Guardar Alterações"}
              </>
            ) : (
              <>
                <FaPlus /> {uploading ? "A guardar..." : "Criar Produto"}
              </>
            )}
          </button>
        </div>

        <div className={styles.formBody}>
          <div className={styles.section}>
            <div className={styles.card}>
              <label className={styles.label}>Basic Information</label>
              <input
                className={styles.field}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do produto"
                required
              />

              <textarea
                className={styles.field}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição"
                rows={3}
              />

              <select
                className={styles.field}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required>
                <option value="">Escolha categoria</option>
                {allCategories.map((cat) => (
                  <option key={cat.id || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {
                <div className={styles.row}>
                  <input
                    className={styles.field}
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    step="0.01"
                    min="0"
                    placeholder="Preço"
                    required
                  />
                  <span>€</span>
                </div>
              }
            </div>

            <div className={styles.card}>
              <label className={styles.label}>Stock Strategy</label>
              <div className={styles.row}>
                <select
                  className={styles.field}
                  value={stockType}
                  onChange={(e) => {
                    const value = e.target.value as "limited" | "on_demand";
                    setStockType(value);
                    if (value !== "limited" || variants.length !== 0) {
                      setStockQuantity(0);
                    }
                  }}>
                  <option value="limited">Stock Limitado</option>
                  <option value="on_demand">Sob Encomenda</option>
                </select>

                {stockType === "limited" ? (
                  <input
                    className={styles.field}
                    type="number"
                    value={hasVariants ? totalVariantStock : stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    disabled={hasVariants}
                  />
                ) : (
                  <div>
                    <input
                      className={styles.field}
                      ref={inputRef}
                      type="text"
                      value={orderDeadline ? orderDeadline.toLocaleDateString("pt-PT") : ""}
                      placeholder="Data limite encomenda"
                      readOnly
                      onClick={() => setShowDatePicker(true)}
                    />
                    {showDatePicker && (
                      <div
                        style={{
                          position: "absolute",
                          zIndex: 10,
                          background: "white",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                          borderRadius: 8,
                          padding: 8,
                        }}>
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
                )}
              </div>
              {hasVariants && (
                <div className="styles.row">
                  <label>Stock is managed by sum of variants.</label>
                </div>
              )}
            </div>

            <div className={styles.card}>
              <div>
                <label className={styles.label}>Variantes</label>

                <div className={styles.variantDefinitionsList}>
                  {variantDefinitions.map((def, idx) => (
                    <div key={def.id} className={styles.row}>
                      <input
                        className={`${styles.field} ${styles.variantNameInput}`}
                        value={def.name}
                        onChange={(e) => updateVariantDefinitionName(idx, e.target.value)}
                        placeholder="Nome (ex: Tamanho)"
                      />
                      <div className={styles.variantValuesInput}>
                        <TagInput
                          value={def.values}
                          onChange={(tags) => updateVariantDefinitionValues(idx, tags)}
                          placeholder={
                            isColorKey(def.name)
                              ? "Hex (ex: #FF0000) ou selecione"
                              : "Valores (ex: S, M, L)"
                          }
                          isColor={isColorKey(def.name)}
                        />
                      </div>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => removeVariantDefinition(idx)}>
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                  <div className={styles.addDefButtonWrapper}>
                    <button type="button" className={styles.button} onClick={addVariantDefinition}>
                      <FaPlus /> Adicionar Definição
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.matrixSection}>
                <div className={styles.row}>
                  <label className={styles.label}>Matriz de Variantes</label>
                </div>

                {variants.length === 0 && (
                  <div className={styles.noVarients}>
                    Preencha as variantes acima para gerar a tabela.
                  </div>
                )}

                {variants.length > 0 && (
                  <div className={styles.variantsTable}>
                    {/* Header Header */}
                    <div className={styles.variantsHeader}>
                      {optionTypes.map((type) => (
                        <div key={type} className={styles.headerCell}>
                          {type}
                        </div>
                      ))}
                      <div className={styles.headerCell}>Preço Extra</div>
                      <div className={styles.headerCell}>Stock</div>
                      <div className={styles.headerCell}>Ativo</div>
                      <div className={styles.headerCell}>Imagens</div>
                      <div className={`${styles.headerCell} ${styles.deleteColumn}`}></div>
                    </div>

                    {variants.map((variant, i) => (
                      <div key={variant.id ?? `new-${i}`} className={styles.variantRow}>
                        {optionTypes.map((type) => {
                          const raw = variant.options[type] || "";
                          if (isColorKey(type)) {
                            const { name: colorName, hex: colorHex } = splitNameHex(raw);
                            return (
                              <div key={type} className={styles.cell}>
                                <div className={styles.colorCellContent}>
                                  <div
                                    className={styles.colorCircle}
                                    style={{
                                      backgroundColor: colorHex,
                                    }}
                                  />
                                  <span>{colorHex}</span>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div key={type} className={styles.cell}>
                              {variant.options[type] || "-"}
                            </div>
                          );
                        })}

                        <div className={styles.cell}>
                          <div className={styles.priceCellContent}>
                            +
                            <input
                              className={styles.smallInput}
                              type="number"
                              value={variant.price_modifier}
                              onChange={(e) =>
                                updateVariant(i, { price_modifier: Number(e.target.value) })
                              }
                              step="0.01"
                            />
                            €
                          </div>
                        </div>

                        <div className={styles.cell}>
                          <input
                            className={styles.smallInput}
                            type="number"
                            value={variant.stock_quantity}
                            onChange={(e) =>
                              updateVariant(i, { stock_quantity: Number(e.target.value) })
                            }
                            min="0"
                          />
                        </div>

                        <div className={styles.cell}>
                          <input
                            type="checkbox"
                            checked={variant.active}
                            onChange={(e) => updateVariant(i, { active: e.target.checked })}
                            className={styles.activeCheckbox}
                          />
                        </div>

                        <div className={styles.cell}>
                          <div className={styles.imageCellContent}>
                            <label className={styles.iconButton} title="Upload imagem">
                              <FaUpload />
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleVariantImageUpload(e, i)}
                                hidden
                              />
                            </label>

                            {(variant.images.length > 0 || variant.newImages.length > 0) && (
                              <span className={styles.imageCount}>
                                {variant.images.length + variant.newImages.length} img
                              </span>
                            )}
                          </div>
                        </div>

                        <div className={styles.cell}>
                          <button
                            type="button"
                            className={styles.iconDeleteButton}
                            onClick={() => removeVariant(i)}>
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TODO: replace this inline error with a toast and remove this fallback once Sonner is implemented here. */}
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.section}>
            <div className={styles.card}>
              <label className={styles.label}>Imagens</label>
              <div className={styles.imageArea}>
                {allImages.length > 0 ? (
                  <div className={styles.imagePreview}>
                    <Image
                      src={allImages[selectedImageIndex]}
                      alt="Product"
                      fill
                      className={styles.productImageCover}
                    />
                    {allImages.length > 1 && (
                      <div className={styles.imageNav}>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))
                          }>
                          <FaChevronLeft />
                        </button>
                        <span>
                          {selectedImageIndex + 1}/{allImages.length}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedImageIndex(
                              Math.min(allImages.length - 1, selectedImageIndex + 1)
                            )
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
                <FaUpload /> Upload Imagem
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
          </div>
        </div>
      </form>
    </div>
  );
}
