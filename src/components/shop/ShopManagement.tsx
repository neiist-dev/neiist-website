"use client";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaPlus, FaEdit } from "react-icons/fa";
import { FiTrash2, FiPackage, FiArchive } from "react-icons/fi";
import { MdOutlineUnarchive } from "react-icons/md";
import { Product, Category } from "@/types/shop";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import ProductForm from "@/components/shop/ProductForm";
import Fuse from "fuse.js";
import styles from "@/styles/components/shop/ShopManagement.module.css";
import ColorfulText from "../ColorfulText";

interface ShopManagementProps {
  products: Product[];
  categories: Category[];
}

type ConfirmAction =
  | { type: "archive"; productId: number }
  | { type: "restore"; productId: number }
  | { type: "permanent"; productId: number };

export default function ShopManagement({ products, categories }: ShopManagementProps) {
  const searchParams = useSearchParams();
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId) {
      const product = products.find((p) => p.id === Number(editId));
      if (product) {
        setEditingProduct(product);
        setView("edit");
      }
    }
  }, [searchParams, products]);
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<ConfirmAction | null>(null);
  const [imageIndex, setImageIndex] = useState<{ [productId: number]: number }>({});

  const activeProducts = useMemo(
    () => localProducts.filter((p) => p.active !== false),
    [localProducts]
  );
  const archivedProducts = useMemo(
    () => localProducts.filter((p) => p.active === false),
    [localProducts]
  );
  const visibleProducts = showArchived ? archivedProducts : activeProducts;

  const fuse = useMemo(
    () =>
      new Fuse(visibleProducts, {
        keys: ["name", "category", "description"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [visibleProducts]
  );

  const filteredProducts = useMemo(() => {
    let filtered = visibleProducts;
    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }
    if (search.trim()) {
      return fuse
        .search(search.trim())
        .map((r) => r.item)
        .filter((p) => categoryFilter === "all" || p.category === categoryFilter);
    }
    return filtered;
  }, [visibleProducts, search, categoryFilter, fuse]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setView("edit");
  };

  const handleArchive = (productId: number) => {
    setPendingAction({ type: "archive", productId });
    setShowConfirm(true);
  };

  const handleRestore = (productId: number) => {
    setPendingAction({ type: "restore", productId });
    setShowConfirm(true);
  };

  const handlePermanentDelete = (productId: number) => {
    setPendingAction({ type: "permanent", productId });
    setShowConfirm(true);
  };

  const confirmMessages: Record<ConfirmAction["type"], string> = {
    archive: "Tem a certeza que deseja arquivar este produto?",
    restore: "Tem a certeza que deseja restaurar este produto?",
    permanent:
      "Tem a certeza que deseja eliminar definitivamente este produto? Esta ação não pode ser desfeita.",
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    const { type, productId } = pendingAction;

    try {
      let response: Response;

      if (type === "archive") {
        response = await fetch(`/api/shop/products/${productId}`, { method: "DELETE" });
      } else if (type === "restore") {
        response = await fetch(`/api/shop/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: true }),
        });
      } else {
        response = await fetch(`/api/shop/products/${productId}?permanent=true`, {
          method: "DELETE",
        });
      }

      if (response.ok) {
        if (type === "permanent") {
          setLocalProducts((prev) => prev.filter((p) => p.id !== productId));
        } else if (type === "archive") {
          setLocalProducts((prev) =>
            prev.map((p) => (p.id === productId ? { ...p, active: false } : p))
          );
        } else if (type === "restore") {
          setLocalProducts((prev) =>
            prev.map((p) => (p.id === productId ? { ...p, active: true } : p))
          );
        }
      } else {
        const error = await response.json();
        console.error("Error performing action:", error);
      }
    } catch (error) {
      console.error("Error performing action:", error);
    }

    setShowConfirm(false);
    setPendingAction(null);
  };

  const getStockDisplay = (product: Product) => {
    if (product.stock_type === "on_demand") return "Sob Encomenda";
    const totalStock =
      product.variants?.length > 0
        ? product.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
        : product.stock_quantity || 0;
    return `${totalStock} em stock`;
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_type === "on_demand") return "on-demand";
    const totalStock =
      product.variants?.length > 0
        ? product.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
        : product.stock_quantity || 0;
    if (totalStock === 0) return "out-of-stock";
    if (totalStock <= 5) return "low-stock";
    return "in-stock";
  };

  const isFiltering = search.trim() !== "" || categoryFilter !== "all";

  if (view === "add" || view === "edit") {
    return (
      <ProductForm
        product={editingProduct}
        isEdit={view === "edit"}
        onBack={() => {
          setView("list");
          setEditingProduct(null);
        }}
        categories={categories}
      />
    );
  }

  return (
    <>
      {showConfirm && pendingAction && (
        <ConfirmDialog
          open={showConfirm}
          message={confirmMessages[pendingAction.type]}
          onConfirm={confirmAction}
          onCancel={() => {
            setShowConfirm(false);
            setPendingAction(null);
          }}
        />
      )}
      <div className={styles.container}>
        <div className={styles.header}>
          <ColorfulText className={styles.title} text="Gestão da Loja" />
          <div className={styles.headerActions}>
            <Link href="/shop/pos" className={styles.posBtn}>
              Gestão POS
            </Link>
            <button className={styles.addBtn} onClick={() => setView("add")}>
              <FaPlus /> Adicionar Produto
            </button>
          </div>
        </div>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Pesquisar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">Todas categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`${styles.archiveToggle} ${showArchived ? styles.archiveToggleActive : ""}`}
            onClick={() => {
              setShowArchived((v) => !v);
              setCategoryFilter("all");
              setSearch("");
            }}>
            <FiArchive />
            {showArchived
              ? "Ver ativos"
              : `Arquivados${archivedProducts.length > 0 ? ` (${archivedProducts.length})` : ""}`}
          </button>
        </div>

        {filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <FiPackage size={64} />
            {isFiltering ? (
              <>
                <p>Nenhum produto encontrado</p>
                <span>Tenta ajustar os filtros ou a pesquisa</span>
              </>
            ) : showArchived ? (
              <>
                <p>Sem produtos arquivados</p>
                <span>Produtos arquivados aparecerão aqui</span>
              </>
            ) : (
              <>
                <p>Ainda não há produtos</p>
                <span>Clica em "Adicionar Produto" para começar</span>
              </>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`${styles.card} ${product.active === false ? styles.cardArchived : ""}`}>
                <div className={styles.imageContainer}>
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[imageIndex[product.id] || 0] || "/placeholder.jpg"}
                      alt={product.name}
                      width={140}
                      height={140}
                    />
                  ) : (
                    <div className={styles.placeholder}>Nenhuma imagem</div>
                  )}
                  <div className={`${styles.stockBadge} ${styles[getStockStatus(product)]}`}>
                    {getStockDisplay(product)}
                  </div>
                  {product.active === false && (
                    <div className={styles.archivedBadge}>Arquivado</div>
                  )}
                </div>
                <div className={styles.thumbnails}>
                  {product.images &&
                    product.images.length > 1 &&
                    product.images.map((img, idx) => (
                      <button
                        key={img + idx}
                        className={`${styles.thumbBtn} ${(imageIndex[product.id] || 0) === idx ? styles.activeThumb : ""}`}
                        onClick={() => setImageIndex((prev) => ({ ...prev, [product.id]: idx }))}
                        tabIndex={-1}
                        aria-label={`Ver imagem ${idx + 1}`}
                        type="button">
                        <Image
                          src={img}
                          alt=""
                          width={28}
                          height={28}
                          className={styles.thumbImg}
                          draggable={false}
                        />
                      </button>
                    ))}
                </div>
                <div className={styles.cardContent}>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className={styles.price}>{product.price}€</div>
                  <div className={styles.productMeta}>
                    <span className={styles.category}>{product.category}</span>
                    <span className={styles.stockType}>
                      {product.stock_type === "limited" ? "Limitado" : "Sob Encomenda"}
                    </span>
                  </div>
                  <div className={styles.actions}>
                    {product.active !== false ? (
                      <>
                        <button type="button" onClick={() => handleEdit(product)}>
                          <FaEdit /> Editar
                        </button>
                        <button
                          type="button"
                          className={styles.archiveBtn}
                          onClick={() => handleArchive(product.id)}>
                          <FiArchive /> Arquivar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={styles.restoreBtn}
                          onClick={() => handleRestore(product.id)}>
                          <MdOutlineUnarchive /> Restaurar
                        </button>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => handlePermanentDelete(product.id)}>
                          <FiTrash2 /> Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
