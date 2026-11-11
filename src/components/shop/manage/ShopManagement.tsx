"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { pt } from "date-fns/locale";
import { FaEdit, FaPlus } from "react-icons/fa";
import { FiClock, FiEye, FiEyeOff, FiPackage, FiSliders, FiTrash2 } from "react-icons/fi";
import { MdOutlineDiscount } from "react-icons/md";
import { TbFilter } from "react-icons/tb";
import {
  Alert,
  Badge,
  Button,
  ColorfulText,
  ColumnDef,
  ConfirmDialog,
  DataTable,
  DropdownMenu,
  EmptyState,
  SearchInput,
  Stack,
  TableActiveFilters,
  TableFilterMultiSelect,
  TableFiltersDrawer,
} from "@neiist/ui";
import {
  changeProductStockAction,
  deleteProductAction,
  setProductSalesEnabledAction,
} from "@/actions/shop/products";
import ProductImage from "@/components/shop/catalog/ProductImage";
import InventoryStockDrawer from "@/components/shop/manage/InventoryStockDrawer";
import { useSearch } from "@/hooks/useSearch";
import type { Dictionary } from "@/i18n/dictionaries";
import styles from "@/styles/components/shop/manage/ShopManagement.module.css";
import type { Category } from "@/types/shop/category";
import type { Product, ProductInventoryStatus, StockChangeInput } from "@/types/shop/product";
import { formatMoney } from "@/utils/shop/moneyUtils";
import { getInventoryStatus, getProductStock } from "@/utils/shop/shopUtils";

const STATUS_BADGE_VARIANT: Record<
  ProductInventoryStatus,
  "primary" | "secondary" | "tertiary" | "danger" | "outline"
> = {
  on_sale: "primary",
  sold_out: "danger",
  scheduled: "secondary",
  closed: "tertiary",
  sales_disabled: "outline",
};

interface ShopManagementProps {
  products: Product[];
  categories: Category[];
  dict: Dictionary["shop_management"];
  basePath?: string;
}

type FilterKey = "category" | "productType" | "channels" | "stock" | "status";
type StockFilterKey = "in_stock" | "out_of_stock" | "on_demand" | "untracked";
type SortField = "name" | "price" | "stock";

type FilterState = Record<FilterKey, string[]>;

const EMPTY_FILTERS: FilterState = {
  category: [],
  productType: [],
  channels: [],
  stock: [],
  status: [],
};

type ConfirmAction =
  | { type: "disable_sales"; productId: number }
  | { type: "enable_sales"; productId: number }
  | { type: "delete"; productId: number };

function getStockFilterKey(product: Product): StockFilterKey {
  if (product.stock_type === "on_demand") return "on_demand";
  if (product.stock_type === "untracked") return "untracked";
  return (getProductStock(product) ?? 0) > 0 ? "in_stock" : "out_of_stock";
}

function getStockSortValue(product: Product): number {
  const stock = getProductStock(product);
  if (stock !== null) return stock;
  return product.stock_type === "untracked" ? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER - 1;
}

export default function ShopManagement({
  products,
  categories,
  dict,
  basePath,
}: ShopManagementProps) {
  const router = useRouter();
  const [productList, setProductList] = useState(products);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [pendingAction, setPendingAction] = useState<ConfirmAction | null>(null);
  const [stockDrawerProductId, setStockDrawerProductId] = useState<number | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setProductList(products);
  }, [products]);

  const [optimisticProducts, addOptimistic] = useOptimistic(
    productList,
    (state, action: ConfirmAction) => {
      if (action.type === "disable_sales")
        return state.map((p) => (p.id === action.productId ? { ...p, active: false } : p));

      if (action.type === "enable_sales")
        return state.map((p) => (p.id === action.productId ? { ...p, active: true } : p));

      return state.filter((p) => p.id !== action.productId);
    }
  );

  const {
    results: searchedProducts,
    query: search,
    setQuery: setSearch,
  } = useSearch<Product>({
    data: optimisticProducts,
    fields: [{ field: "name", boost: 3 }, { field: "category", boost: 2 }, "description"],
    returnAllWhenEmpty: true,
  });

  const statusLabels: Record<ProductInventoryStatus, string> = useMemo(
    () => ({
      on_sale: dict.status_on_sale,
      sold_out: dict.status_sold_out,
      scheduled: dict.status_scheduled,
      closed: dict.status_closed,
      sales_disabled: dict.status_sales_disabled,
    }),
    [dict]
  );

  const stockLabels: Record<StockFilterKey, string> = useMemo(
    () => ({
      in_stock: dict.stock_filter_in_stock,
      out_of_stock: dict.out_of_stock,
      on_demand: dict.on_demand,
      untracked: dict.untracked_stock,
    }),
    [dict]
  );

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...categories.map((c) => c.name),
          ...optimisticProducts.map((p) => p.category).filter((c): c is string => Boolean(c)),
        ])
      ),
    [categories, optimisticProducts]
  );

  const filterConfigs = useMemo<
    Record<
      FilterKey,
      {
        title: string;
        options: string[];
        getLabel?: (_value: string) => string;
      }
    >
  >(
    () => ({
      category: {
        title: dict.col_category,
        options: categoryOptions,
      },
      productType: {
        title: dict.col_type,
        options: ["merchandise", "event_ticket", "food_drink"],
        getLabel: (v) => dict.types[v as keyof typeof dict.types] ?? v,
      },
      channels: {
        title: dict.col_channels,
        options: ["web", "pos", "fast-pos"],
        getLabel: (v) => dict.channels[v as keyof typeof dict.channels] ?? v,
      },
      stock: {
        title: dict.col_stock,
        options: ["in_stock", "out_of_stock", "on_demand", "untracked"],
        getLabel: (v) => stockLabels[v as StockFilterKey] ?? v,
      },
      status: {
        title: dict.col_status,
        options: ["on_sale", "sold_out", "scheduled", "closed", "sales_disabled"],
        getLabel: (v) => statusLabels[v as ProductInventoryStatus] ?? v,
      },
    }),
    [categoryOptions, dict, statusLabels, stockLabels]
  );

  const filteredProducts = useMemo(() => {
    const filtered = searchedProducts.filter((p) => {
      if (filters.category.length > 0 && !filters.category.includes(p.category || "")) return false;

      if (filters.productType.length > 0 && !filters.productType.includes(p.product_type))
        return false;

      if (
        filters.channels.length > 0 &&
        !p.channels.some((channel) => filters.channels.includes(channel))
      ) {
        return false;
      }
      if (filters.stock.length > 0 && !filters.stock.includes(getStockFilterKey(p))) return false;

      return !(filters.status.length > 0 && !filters.status.includes(getInventoryStatus(p)));
    });

    if (!sortField) return filtered;

    const dir = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortField === "name") return a.name.localeCompare(b.name) * dir;
      if (sortField === "price") return (a.price - b.price) * dir;
      return (getStockSortValue(a) - getStockSortValue(b)) * dir;
    });
  }, [searchedProducts, filters, sortField, sortDirection]);

  const stockDrawerProduct = useMemo(
    () => optimisticProducts.find((p) => p.id === stockDrawerProductId) ?? null,
    [optimisticProducts, stockDrawerProductId]
  );

  const openColumnFilter = useCallback(
    (key: FilterKey, ref: React.RefObject<HTMLButtonElement | null>) => {
      filterButtonRef.current = ref.current;
      setOpenFilter((prev) => (prev === key ? null : key));
    },
    []
  );

  const handleSortChange = useCallback((field: string, direction: "asc" | "desc") => {
    setSortField(field as SortField);
    setSortDirection(direction);
  }, []);

  const confirmMessages: Record<ConfirmAction["type"], string> = {
    disable_sales: dict.confirm_disable_sales,
    enable_sales: dict.confirm_enable_sales,
    delete: dict.confirm_permanent,
  };

  const runConfirmAction = () => {
    if (!pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);

    startTransition(async () => {
      addOptimistic(action);
      try {
        if (action.type === "delete") {
          await deleteProductAction(action.productId);
          setProductList((prev) => prev.filter((p) => p.id !== action.productId));
        } else {
          const updated = await setProductSalesEnabledAction(
            action.productId,
            action.type === "enable_sales"
          );
          setProductList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }
      } catch (err: unknown) {
        Alert.error(err instanceof Error ? err.message : dict.error_generic);
      }
    });
  };

  const handleStockSave = useCallback(
    async (productId: number, changes: StockChangeInput[]) => {
      try {
        const updated = await changeProductStockAction(productId, changes);
        setProductList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        Alert.success(dict.stock_drawer.saved_toast);
      } catch (err: unknown) {
        Alert.error(err instanceof Error ? err.message : dict.error_generic);
        throw err;
      }
    },
    [dict.error_generic, dict.stock_drawer.saved_toast]
  );

  const columns: ColumnDef<Product>[] = useMemo(
    () => [
      {
        id: "name",
        header: dict.col_product,
        isCardHeader: true,
        sortable: true,
        cell: (product) => (
          <Stack
            direction="row"
            gap="sm"
            align="center"
            className={product.active === false ? styles.rowDisabled : undefined}>
            <ProductImage
              product={product}
              alt={product.name}
              width={44}
              height={44}
              wrapperClassName={styles.productImageWrapper}
              imageClassName={styles.productImage}
              placeholderClassName={styles.productImagePlaceholder}
              placeholderLabel=""
            />
            <Stack direction="column" gap="none" className={styles.truncate}>
              <strong>{product.name}</strong>
              {product.description && (
                <span className={styles.descriptionCell}>{product.description}</span>
              )}
            </Stack>
          </Stack>
        ),
      },
      {
        id: "category",
        header: dict.col_category,
        hasFilter: true,
        onFilterClick: (_e, ref) => openColumnFilter("category", ref),
        cell: (product) => (
          <span className={product.active === false ? styles.rowDisabled : undefined}>
            {product.category || "—"}
          </span>
        ),
      },
      {
        id: "productType",
        header: dict.col_type,
        hasFilter: true,
        onFilterClick: (_e, ref) => openColumnFilter("productType", ref),
        cell: (product) => (
          <span className={product.active === false ? styles.rowDisabled : undefined}>
            {dict.types[product.product_type] ?? product.product_type}
          </span>
        ),
      },
      {
        id: "channels",
        header: dict.col_channels,
        hasFilter: true,
        onFilterClick: (_e, ref) => openColumnFilter("channels", ref),
        cell: (product) => (
          <Stack
            direction="row"
            gap="sm"
            wrap
            className={product.active === false ? styles.rowDisabled : undefined}>
            {product.channels.map((channel) => (
              <Badge key={channel} variant="outline" size="sm">
                {dict.channels[channel] ?? channel}
              </Badge>
            ))}
          </Stack>
        ),
      },
      {
        id: "price",
        header: dict.col_price,
        sortable: true,
        align: "end",
        cell: (product) => (
          <strong className={product.active === false ? styles.rowDisabled : undefined}>
            {formatMoney(product.price)}
          </strong>
        ),
      },
      {
        id: "stock",
        header: dict.col_stock,
        sortable: true,
        hasFilter: true,
        onFilterClick: (_e, ref) => openColumnFilter("stock", ref),
        cell: (product) => {
          const stock = getProductStock(product);
          if (stock === null) {
            return (
              <Badge variant="outline" size="sm">
                {product.stock_type === "on_demand" ? dict.on_demand : dict.untracked_stock}
              </Badge>
            );
          }
          if (stock <= 0) {
            return (
              <Badge variant="danger" size="sm">
                {dict.out_of_stock}
              </Badge>
            );
          }
          return <strong>{stock}</strong>;
        },
      },
      {
        id: "status",
        header: dict.col_status,
        hasFilter: true,
        onFilterClick: (_e, ref) => openColumnFilter("status", ref),
        cell: (product) => {
          const status = getInventoryStatus(product);
          return (
            <Badge
              variant={STATUS_BADGE_VARIANT[status]}
              size="sm"
              title={dict.status_hints[status]}>
              {statusLabels[status]}
            </Badge>
          );
        },
      },
    ],
    [dict, openColumnFilter, statusLabels]
  );

  const renderRowActions = useCallback(
    (product: Product) => {
      const salesEnabled = product.active !== false;
      return (
        <>
          <DropdownMenu.Item
            icon={<FaEdit size={14} />}
            onClick={() => router.push(`${basePath || ""}/shop/manage/${product.id}/edit`)}>
            {dict.edit}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            icon={<FiSliders size={14} />}
            onClick={() => setStockDrawerProductId(product.id)}>
            {dict.manage_stock}
          </DropdownMenu.Item>
          <DropdownMenu.Divider />
          {salesEnabled ? (
            <DropdownMenu.Item
              icon={<FiEyeOff size={14} />}
              onClick={() => setPendingAction({ type: "disable_sales", productId: product.id })}>
              {dict.disable_sales}
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item
              icon={<FiEye size={14} />}
              onClick={() => setPendingAction({ type: "enable_sales", productId: product.id })}>
              {dict.enable_sales}
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item
            icon={<FiTrash2 size={14} />}
            destructive
            disabled={salesEnabled}
            title={salesEnabled ? dict.delete_requires_disabled : dict.delete}
            onClick={() => setPendingAction({ type: "delete", productId: product.id })}>
            {dict.delete}
          </DropdownMenu.Item>
        </>
      );
    },
    [basePath, dict, router]
  );

  const activeFilterConfig = openFilter ? filterConfigs[openFilter] : null;

  return (
    <>
      <ConfirmDialog
        open={Boolean(pendingAction)}
        message={pendingAction ? confirmMessages[pendingAction.type] : ""}
        confirmLabel={dict.confirm_dialog.confirm}
        cancelLabel={dict.confirm_dialog.cancel}
        isDestructive={pendingAction?.type === "delete" || pendingAction?.type === "disable_sales"}
        onConfirm={runConfirmAction}
        onCancel={() => setPendingAction(null)}
      />

      <InventoryStockDrawer
        key={stockDrawerProduct?.id ?? "closed"}
        product={stockDrawerProduct}
        onClose={() => setStockDrawerProductId(null)}
        onSave={handleStockSave}
        onEdit={(productId) => router.push(`${basePath || ""}/shop/manage/${productId}/edit`)}
        dict={dict}
      />

      <main className={styles.container}>
        <ColorfulText as="h1" className={styles.title} text={dict.title} />

        {optimisticProducts.length === 0 ? (
          <EmptyState
            icon={<FiPackage size={64} />}
            title={dict.no_products}
            description={dict.no_products_hint}
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push(`${basePath || ""}/shop/manage/new`)}>
                <FaPlus /> {dict.add_product}
              </Button>
            }
          />
        ) : (
          <>
            <div className={styles.controlsRow}>
              <div className={styles.searchContainer}>
                <SearchInput
                  placeholder={dict.search_placeholder}
                  value={search}
                  onChange={setSearch}
                  action={
                    <button
                      type="button"
                      className={styles.mobileFilterBtn}
                      onClick={() => setShowMobileFilters(true)}
                      title={dict.filters_button}
                      aria-label={dict.filters_button}>
                      <TbFilter size={18} />
                    </button>
                  }
                />
              </div>

              <div className={styles.rightControls}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`${basePath || ""}/shop/pos/manage`)}>
                  {dict.pos_management_link}
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
                  <FiClock /> {dict.schedules_link}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push(`${basePath || ""}/shop/manage/new`)}>
                  <FaPlus /> {dict.add_product}
                </Button>
              </div>
            </div>

            <div className={styles.desktopOnly}>
              <TableActiveFilters
                filterGroups={(Object.keys(filterConfigs) as FilterKey[]).map((key) => ({
                  id: key,
                  label: filterConfigs[key].title,
                  values: filters[key],
                  getDisplayValue: filterConfigs[key].getLabel,
                }))}
                onRemoveValue={(groupId, value) => {
                  const key = groupId as FilterKey;
                  setFilters((prev) => ({
                    ...prev,
                    [key]: prev[key].filter((item) => item !== value),
                  }));
                }}
                onClearAll={() => setFilters(EMPTY_FILTERS)}
                clearLabel={dict.clear_filters}
              />
            </div>

            <DataTable
              data={filteredProducts}
              columns={columns}
              getRowId={(product) => String(product.id)}
              onRowClick={(product) => setStockDrawerProductId(product.id)}
              rowActions={renderRowActions}
              actionsTitle={dict.actions_title}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              emptyMessage={dict.no_products_found}
              responsive="cards"
            />
          </>
        )}
      </main>

      {openFilter && activeFilterConfig && (
        <TableFilterMultiSelect
          isOpen={true}
          onClose={() => setOpenFilter(null)}
          options={activeFilterConfig.options}
          selected={filters[openFilter]}
          onChange={(values) => setFilters((prev) => ({ ...prev, [openFilter]: values }))}
          buttonRef={filterButtonRef}
          title={activeFilterConfig.title}
          getLabel={activeFilterConfig.getLabel}
          clearLabel={dict.clear}
          applyLabel={dict.apply}
        />
      )}

      <TableFiltersDrawer
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        title={dict.filters_button}
        closeAriaLabel={dict.close_filters}
        clearLabel={dict.clear}
        applyLabel={dict.apply}
        locale={pt}
        categories={(Object.keys(filterConfigs) as FilterKey[]).map((key) => ({
          id: key,
          title: filterConfigs[key].title,
          options: filterConfigs[key].options.map((opt) => ({
            value: opt,
            label: filterConfigs[key].getLabel ? filterConfigs[key].getLabel(opt) : opt,
          })),
          selected: filters[key],
        }))}
        onApply={({ categories: nextCategories }) => {
          setFilters({ ...EMPTY_FILTERS, ...nextCategories });
        }}
      />
    </>
  );
}
