"use client";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import { FiPackage, FiArchive } from "react-icons/fi";
import { Product } from "@/types/shop/product";
import { Category } from "@/types/shop/category";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import { PiContactlessPayment } from "react-icons/pi";
import { MdOutlineDiscount } from "react-icons/md";
import ProductManagementCard from "./ProductManagementCard";
import Fuse from "fuse.js";
import styles from "@/styles/components/shop/ShopManagement.module.css";
import ColorfulText from "../ColorfulText";
import type { ShopManagementDict, ConfirmDialogDict, ProductFormDict } from "@/types/i18n";

interface ShopManagementProps {
  products: Product[];
  categories: Category[];
  locale: string;
  dict: ShopManagementDict;
}

type ConfirmAction =
  | { type: "archive"; productId: number }
  | { type: "restore"; productId: number }
  | { type: "permanent"; productId: number };

export default function ShopManagement({ products, categories, dict, locale }: ShopManagementProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<ConfirmAction | null>(null);

  const activeProducts = useMemo(() => products.filter((p) => p.active !== false), [products]);
  const archivedProducts = useMemo(() => products.filter((p) => p.active === false), [products]);
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

  const handleEdit = (productId: number) => {
    router.push(`/shop/manage/${productId}/edit`);
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
    archive: dict.confirm_archive,
    restore: dict.confirm_restore,
    permanent: dict.confirm_permanent,
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
        window.location.reload();
      } else {
        const data = await response.json();
        toast.error(data?.error ?? dict.error_generic);
      }
    } catch {
      toast.error(dict.error_generic);
    }

    setShowConfirm(false);
    setPendingAction(null);
  };

  const isFiltering = search.trim() !== "" || categoryFilter !== "all";

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
          dict={dict.confirm_dialog}
        />
      )}
      <div className={styles.container}>
        <div className={styles.header}>
          <ColorfulText className={styles.title} text={dict.title} />
          <div className={styles.headerActions}>
            <button className={styles.addBtn} onClick={() => router.push("/shop/manage/new")}>
              <FaPlus /> {dict.add_product}
            </button>
          </div>
        </div>

        <div className={styles.filters}>
          <input
            type="text"
            placeholder={dict.search_placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">{dict.all_categories}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name in dict.categories ? dict.categories[cat.name] : cat.name}
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
              ? dict.view_active
              : ` ${dict.archived}${archivedProducts.length > 0 ? ` (${archivedProducts.length})` : ""}`}
          </button>
          <button className={styles.addBtn} onClick={() => router.push("/shop/pos")}>
            <PiContactlessPayment /> {dict.pos_link}
          </button>
          <button className={styles.addBtn} onClick={() => router.push("/shop/manage/discounts")}>
            <MdOutlineDiscount /> Descontos
          </button>
        </div>

        {filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <FiPackage size={64} />
            {isFiltering ? (
              <>
                <p>{dict.no_products_found}</p>
                <span>{dict.adjust_filters}</span>
              </>
            ) : showArchived ? (
              <>
                <p>{dict.no_archived_products}</p>
                <span>{dict.no_archived_products_hint}</span>
              </>
            ) : (
              <>
                <p>{dict.no_products}</p>
                <span>{dict.no_products_hint}</span>
              </>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredProducts.map((product) => (
              <ProductManagementCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onArchive={handleArchive}
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}