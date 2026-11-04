"use client";

import { useState, useMemo, useOptimistic } from "react";
import Image from "next/image";
import {
  Alert,
  Badge,
  Button,
  ColumnDef,
  DataTable,
  DropdownMenu,
  Input,
  Select,
  Stack,
} from "@neiist/ui";
import { useRouter } from "next/navigation";
import { FaEdit, FaPlus } from "react-icons/fa";
import {
  FiArchive,
  FiImage,
  FiMoreVertical,
  FiPackage,
  FiRotateCcw,
  FiTrash2,
} from "react-icons/fi";
import { Product } from "@/types/shop/product";
import { Category } from "@/types/shop/category";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import { PiContactlessPayment } from "react-icons/pi";
import { MdOutlineDiscount } from "react-icons/md";
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
      let response: Response;

      if (type === "archive") {
        response = await fetch(`/api/shop/products/${productId}`, {
          method: "DELETE",
        });
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
        minWidth: 250,
        cell: (product) => {
          const image = product.images?.[0];
          return (
            <Stack direction="row" gap="md" align="center">
              {image ? (
                <Image src={image} alt="" width={64} height={64} className={styles.productImage} />
              ) : (
                <div className={styles.productImagePlaceholder} aria-label={dict.no_image}>
                  <FiImage />
                </div>
              )}
              <Stack gap="none">
                <strong>{product.name}</strong>
                {product.description && (
                  <span className={styles.descriptionCell}>{product.description}</span>
                )}
              </Stack>
            </Stack>
          );
        },
      },
      {
        id: "category",
        header: dict.col_category,
        minWidth: 150,
        cell: (product) => product.category || "—",
      },
      {
        id: "price",
        header: dict.col_price,
        minWidth: 110,
        cell: (product) => <strong>{product.price.toFixed(2)} €</strong>,
      },
      {
        id: "stock",
        header: dict.col_stock,
        minWidth: 150,
        cell: (product) => {
          if (product.stock_type === "on_demand") {
            return <Badge variant="primary">{dict.on_demand}</Badge>;
          }

          const stock =
            product.variants?.length > 0
              ? product.variants.reduce((sum, variant) => sum + (variant.stock_quantity || 0), 0)
              : product.stock_quantity || 0;

          return stock === 0 ? (
            <Badge variant="danger">{dict.out_of_stock}</Badge>
          ) : (
            <Badge variant="primary">{dict.in_stock.replace("{count}", String(stock))}</Badge>
          );
        },
      },
      {
        id: "status",
        header: dict.col_status,
        minWidth: 140,
        cell: (product) => {
          if (product.active === false) {
            return <Badge variant="tertiary">{dict.status_archived}</Badge>;
          }

          const hasDateExpired = product.order_deadline
            ? new Date(product.order_deadline) < new Date()
            : false;
          if (hasDateExpired) return <Badge variant="tertiary">{dict.status_inactive}</Badge>;

          const stock =
            product.variants?.length > 0
              ? product.variants.reduce((sum, variant) => sum + (variant.stock_quantity || 0), 0)
              : product.stock_quantity || 0;

          return product.stock_type !== "on_demand" && stock === 0 ? (
            <Badge variant="primary">{dict.status_sold_out}</Badge>
          ) : (
            <Badge variant="primary">{dict.status_for_sale}</Badge>
          );
        },
      },
      {
        id: "actions",
        header: dict.col_actions,
        minWidth: 140,
        cell: (product) => (
          <DropdownMenu>
            <DropdownMenu.Trigger>
              <Button
                variant="ghost"
                size="icon"
                aria-label={dict.actions_menu}
                title={dict.actions_menu}>
                <FiMoreVertical />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" mobileTitle={dict.actions_menu}>
              <DropdownMenu.Item icon={<FaEdit />} onClick={() => handleEdit(product.id)}>
                {dict.edit}
              </DropdownMenu.Item>
              {product.active === false ? (
                <>
                  <DropdownMenu.Item
                    icon={<FiRotateCcw />}
                    onClick={() => handleRestore(product.id)}>
                    {dict.restore}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    icon={<FiTrash2 />}
                    destructive
                    onClick={() => handlePermanentDelete(product.id)}>
                    {dict.delete}
                  </DropdownMenu.Item>
                </>
              ) : (
                <>
                  <DropdownMenu.Divider />
                  <DropdownMenu.Item
                    icon={<FiArchive />}
                    destructive // Opcional, caso queiras dar destaque visual de ação sensível
                    onClick={() => handleArchive(product.id)}>
                    {dict.archive}
                  </DropdownMenu.Item>
                </>
              )}
            </DropdownMenu.Content>
          </DropdownMenu>
        ),
      },
    ],
    [dict, handleArchive, handleEdit, handlePermanentDelete, handleRestore]
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
            <Button onClick={() => router.push(`${basePath || ""}/shop/manage/new`)}>
              <FaPlus /> {dict.add_product}
            </Button>
          </div>
        </div>

        <div className={styles.filters}>
          <Input
            aria-label={dict.search_placeholder}
            placeholder={dict.search_placeholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            aria-label={dict.all_categories}
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: "all", label: dict.all_categories },
              ...categories.map((category) => ({
                value: category.name,
                label: category.name,
              })),
            ]}
          />
          <Button onClick={() => router.push(`${basePath || ""}/shop/pos`)}>
            <PiContactlessPayment /> {dict.pos_link}
          </Button>
          <Button onClick={() => router.push(`${basePath || ""}/shop/manage/discounts`)}>
            <MdOutlineDiscount /> {dict.discounts_link}
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
