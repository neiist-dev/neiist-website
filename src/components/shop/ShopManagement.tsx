"use client";

import { useState, useMemo, useOptimistic, useCallback } from "react";
import Image from "next/image";
import { Alert, Badge, ColumnDef, DataTable } from "@neiist/ui";
import { useRouter } from "next/navigation";
import { FaEdit, FaPlus } from "react-icons/fa";
import { FiImage, FiPackage, FiTrash2 } from "react-icons/fi";
import { Product } from "@/types/shop/product";
import { Category } from "@/types/shop/category";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import { PiContactlessPayment } from "react-icons/pi";
import { MdOutlineDiscount } from "react-icons/md";
import Search from "@/components/search/Search";
import { useSearch } from "@/hooks/useSearch";
import styles from "@/styles/components/shop/ShopManagement.module.css";
import ColorfulText from "../ColorfulText";
import type { Dictionary } from "@/i18n/dictionaries";

interface ShopManagementProps {
  products: Product[];
  categories: Category[];
  dict: Dictionary["shop_management"];
  basePath?: string;
}

type ConfirmAction = { type: "delete"; productId: number };

export default function ShopManagement({
  products,
  categories,
  dict,
  basePath,
}: ShopManagementProps) {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<ConfirmAction | null>(null);

  const [optimisticProducts, setOptimisticProducts] = useOptimistic(
    products,
    (state, action: ConfirmAction) => {
      if (action.type === "delete") {
        return state.filter((product) => product.id !== action.productId);
      }
      return state;
    }
  );

  const baseProducts = useMemo(() => {
    let list = optimisticProducts;
    if (categoryFilter !== "all") {
      list = list.filter((p) => p.category === categoryFilter);
    }
    return list;
  }, [optimisticProducts, categoryFilter]);

  const {
    results: filteredProducts,
    query: search,
    setQuery: setSearch,
  } = useSearch<Product>({
    data: baseProducts,
    fields: [{ field: "name", boost: 3 }, { field: "category", boost: 2 }, "description"],
    returnAllWhenEmpty: true,
  });

  const handleEdit = useCallback(
    (productId: number) => {
      router.push(`${basePath || ""}/shop/manage/${productId}/edit`);
    },
    [basePath, router]
  );

  const handleDelete = useCallback((productId: number) => {
    setPendingAction({ type: "delete", productId });
    setShowConfirm(true);
  }, []);

  const confirmMessages: Record<ConfirmAction["type"], string> = {
    delete: dict.confirm_permanent,
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    const { type, productId } = pendingAction;

    setOptimisticProducts({ type, productId });
    setShowConfirm(false);
    setPendingAction(null);

    try {
      const response = await fetch(`/api/shop/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        Alert.error(data?.error ?? dict.error_generic);
      }
    } catch {
      Alert.error(dict.error_generic);
    }
  };

  const isFiltering = search.trim() !== "" || categoryFilter !== "all";

  const columns: ColumnDef<Product>[] = useMemo(
    () => [
      {
        id: "product",
        header: dict.col_product,
        isCardHeader: true,
        minWidth: 240,
        cell: (product) => {
          const image = product.images?.[0];
          return (
            <div className={styles.productCell}>
              {image ? (
                <Image src={image} alt="" width={56} height={56} className={styles.productImage} />
              ) : (
                <div className={styles.productImagePlaceholder} aria-label={dict.no_image}>
                  <FiImage />
                </div>
              )}
              <div>
                <strong>{product.name}</strong>
                {product.description && (
                  <span className={styles.descriptionCell}>{product.description}</span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "category",
        header: dict.col_category,
        minWidth: 130,
        cell: (product) => product.category || "—",
      },
      {
        id: "price",
        header: dict.col_price,
        minWidth: 100,
        cell: (product) => <strong>{product.price.toFixed(2)} €</strong>,
      },
      {
        id: "stock",
        header: dict.col_stock,
        minWidth: 140,
        cell: (product) => {
          if (product.stock_type === "on_demand") {
            return <Badge variant="secondary">{dict.on_demand}</Badge>;
          }

          const stock =
            product.variants?.length > 0
              ? product.variants.reduce((sum, variant) => sum + (variant.stock_quantity || 0), 0)
              : product.stock_quantity || 0;

          if (stock === 0) {
            return <Badge variant="danger">{dict.out_of_stock}</Badge>;
          }

          return <Badge variant="primary">{dict.in_stock.replace("{count}", String(stock))}</Badge>;
        },
      },
      {
        id: "status",
        header: dict.col_status,
        minWidth: 130,
        cell: (product) => {
          const hasDateExpired = product.order_deadline
            ? new Date(product.order_deadline) < new Date()
            : false;

          if (hasDateExpired) {
            return <Badge variant="tertiary">{dict.status_inactive || "Inativo"}</Badge>;
          }

          const stock =
            product.variants?.length > 0
              ? product.variants.reduce((sum, variant) => sum + (variant.stock_quantity || 0), 0)
              : product.stock_quantity || 0;

          if (product.stock_type !== "on_demand" && stock === 0) {
            return <Badge variant="secondary">{dict.status_sold_out || "Esgotado"}</Badge>;
          }

          return <Badge variant="primary">{dict.status_for_sale || "À venda"}</Badge>;
        },
      },
      {
        id: "actions",
        header: dict.col_actions,
        minWidth: 140,
        cell: (product) => (
          <div className={styles.tableActions}>
            <button
              type="button"
              className={styles.tableEditButton}
              onClick={() => handleEdit(product.id)}>
              <FaEdit />
            </button>
            <button
              type="button"
              className={styles.tableDeleteButton}
              onClick={() => handleDelete(product.id)}>
              <FiTrash2 />
            </button>
          </div>
        ),
      },
    ],
    [dict, handleDelete, handleEdit]
  );

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
          <ColorfulText className={styles.title} text={dict.title} />
          <div className={styles.headerActions}>
            <button
              className={styles.addBtn}
              onClick={() => router.push(`${basePath || ""}/shop/manage/new`)}>
              <FaPlus /> {dict.add_product}
            </button>
          </div>
        </div>

        <div className={styles.filters}>
          <Search placeholder={dict.search_placeholder} value={search} onChange={setSearch} />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">{dict.all_categories}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            className={styles.addBtn}
            onClick={() => router.push(`${basePath || ""}/shop/pos`)}>
            <PiContactlessPayment /> {dict.pos_link}
          </button>
          <button
            className={styles.addBtn}
            onClick={() => router.push(`${basePath || ""}/shop/manage/discounts`)}>
            <MdOutlineDiscount /> {dict.discounts_link}
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
            ) : (
              <>
                <p>{dict.no_products}</p>
                <span>{dict.no_products_hint}</span>
              </>
            )}
          </div>
        ) : (
          <DataTable
            data={filteredProducts}
            columns={columns}
            getRowId={(product) => String(product.id)}
            responsive="scroll"
            wrapperClassName={styles.tableWrapper}
          />
        )}
      </div>
    </>
  );
}
