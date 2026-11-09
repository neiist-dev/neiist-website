"use client";

import { useState, useMemo, useOptimistic } from "react";
import { Alert } from "@neiist/ui";
import { useRouter } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import { FiPackage, FiArchive, FiClock } from "react-icons/fi";
import { Product } from "@/types/shop/product";
import { Category } from "@/types/shop/category";
import { MdOutlineDiscount } from "react-icons/md";
import { Button, SearchInput, Select, ConfirmDialog, ColorfulText } from "@neiist/ui";
import ProductManagementCard from "./ProductManagementCard";
import { useSearch } from "@/hooks/useSearch";
import { deleteProductAction, toggleProductActiveAction } from "@/actions/shop/products";
import styles from "@/styles/components/shop/manage/ShopManagement.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface ShopManagementProps {
  products: Product[];
  categories: Category[];
  dict: Dictionary["shop_management"];
  basePath?: string;
}

type ConfirmAction =
  | { type: "archive"; productId: number }
  | { type: "restore"; productId: number }
  | { type: "permanent"; productId: number };

export default function ShopManagement({
  products,
  categories,
  dict,
  basePath,
}: ShopManagementProps) {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<ConfirmAction | null>(null);

  const [optimisticProducts, setOptimisticProducts] = useOptimistic(
    products,
    (state, action: ConfirmAction) => {
      if (action.type === "archive") {
        return state.map((product) =>
          product.id === action.productId ? { ...product, active: false } : product
        );
      }
      if (action.type === "restore") {
        return state.map((product) =>
          product.id === action.productId ? { ...product, active: true } : product
        );
      }
      if (action.type === "permanent") {
        return state.filter((product) => product.id !== action.productId);
      }
      return state;
    }
  );

  const activeProducts = useMemo(
    () => optimisticProducts.filter((product) => product.active !== false),
    [optimisticProducts]
  );
  const archivedProducts = useMemo(
    () => optimisticProducts.filter((product) => product.active === false),
    [optimisticProducts]
  );
  const visibleProducts = showArchived ? archivedProducts : activeProducts;

  const categoryOptions = useMemo(
    () => [
      { label: dict.all_categories, value: "all" },
      ...categories.map((cat) => ({ label: cat.name, value: cat.name })),
    ],
    [categories, dict.all_categories]
  );

  const baseProducts = useMemo(() => {
    let list = visibleProducts;
    if (categoryFilter !== "all") list = list.filter((p) => p.category === categoryFilter);

    return list;
  }, [visibleProducts, categoryFilter]);

  const {
    results: filteredProducts,
    query: search,
    setQuery: setSearch,
  } = useSearch<Product>({
    data: baseProducts,
    fields: [{ field: "name", boost: 3 }, { field: "category", boost: 2 }, "description"],
    returnAllWhenEmpty: true,
  });

  const handleEdit = (productId: number) => {
    router.push(`${basePath || ""}/shop/manage/${productId}/edit`);
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

    setOptimisticProducts({ type, productId });
    setShowConfirm(false);
    setPendingAction(null);

    try {
      if (type === "archive") {
        await toggleProductActiveAction(productId, false);
      } else if (type === "restore") {
        await toggleProductActiveAction(productId, true);
      } else {
        await deleteProductAction(productId, true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : dict.error_generic;
      Alert.error(msg);
    }
  };

  const isFiltering = search.trim() !== "" || categoryFilter !== "all";

  return (
    <>
      {showConfirm && pendingAction && (
        <ConfirmDialog
          open={showConfirm}
          message={confirmMessages[pendingAction.type]}
          confirmLabel={dict.confirm_dialog.confirm}
          cancelLabel={dict.confirm_dialog.cancel}
          isDestructive={pendingAction.type === "permanent" || pendingAction.type === "archive"}
          onConfirm={confirmAction}
          onCancel={() => {
            setShowConfirm(false);
            setPendingAction(null);
          }}
        />
      )}
      <div className={styles.container}>
        <div className={styles.header}>
          <ColorfulText className={styles.title} text={dict.title} />
          <div className={styles.headerActions}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push(`${basePath || ""}/shop/manage/new`)}>
              <FaPlus /> {dict.add_product}
            </Button>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <SearchInput
              placeholder={dict.search_placeholder}
              value={search}
              onChange={setSearch}
            />
          </div>
          <div className={styles.selectWrapper}>
            <Select value={categoryFilter} onChange={setCategoryFilter} options={categoryOptions} />
          </div>
          <Button
            variant={showArchived ? "primary" : "outline"}
            size="sm"
            onClick={() => {
              setShowArchived((v) => !v);
              setCategoryFilter("all");
              setSearch("");
            }}>
            <FiArchive />
            {showArchived
              ? dict.view_active
              : `${dict.archived}${archivedProducts.length > 0 ? ` (${archivedProducts.length})` : ""}`}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`${basePath || ""}/shop/pos/manage`)}>
            Gestão POS
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`${basePath || ""}/shop/manage/discounts`)}>
            <MdOutlineDiscount /> {dict.discounts_link}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`${basePath || ""}/shop/manage/schedules`)}>
            <FiClock /> {dict.schedules_link || "Horários dos Campi"}
          </Button>
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
                dict={dict}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
