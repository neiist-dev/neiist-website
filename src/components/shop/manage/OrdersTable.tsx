"use client";

import { useMemo, useRef, useState, useCallback, useTransition } from "react";
import styles from "@/styles/components/shop/manage/OrdersTable.module.css";
import { Order } from "@/types/shop/order";
import { OrderStatus, ORDER_STATUS_CONFIG } from "@/types/shop/orderStatus";
import { Product } from "@/types/shop/product";
import { useSearch } from "@/hooks/useSearch";
import {
  FiArchive,
  FiMail,
  FiClock,
  FiEye,
  FiCheckCircle,
  FiPackage,
  FiTruck,
  FiXCircle,
  FiChevronDown,
} from "react-icons/fi";
import { TbFilter, TbTableExport } from "react-icons/tb";
import { getCompactProductsSummary } from "@/utils/shop/shopUtils";
import { getFirstAndLastName } from "@/utils/userUtils";
import { getLocalizedOrderStatusLabel, isTicketOrder } from "@/utils/shop/orderStatusUtils";
import {
  buildCascadeFilterTree,
  matchesProductFilter,
  summarizeProductFilterTags,
} from "@/utils/shop/orderFilterUtils";
import { useRouter } from "next/navigation";
import { setOrderStatusAction, updateOrderAction } from "@/actions/shop/orders";
import {
  Alert,
  DataTable,
  ColumnDef,
  TableFilterDate,
  TableFilterMultiSelect,
  TableFilterCascade,
  TableActiveFilters,
  TableFiltersDrawer,
  TableSelectionBar,
  Badge,
  Button,
  SearchInput,
  DropdownMenu,
  ConfirmDialog,
  InputDateDialog,
  ColorfulText,
} from "@neiist/ui";
import { pt } from "date-fns/locale";
import EmailComposerModal from "@/components/general/EmailComposerModal";
import { sendCustomOrderEmailAction } from "@/actions/shop/orders";
import type { Dictionary } from "@/i18n/dictionaries";

function normalizeCampus(campus?: string): string {
  return campus ? campus.trim().toLowerCase() : "";
}

function displayCampus(campus: string): string {
  return campus
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

function getStatusBadgeVariant(
  status: string
): "primary" | "secondary" | "tertiary" | "quaternary" | "outline" | "danger" {
  switch (status) {
    case "paid":
    case "completed":
    case "delivered":
      return "primary";
    case "ready":
      return "secondary";
    case "pending":
    case "processing":
      return "tertiary";
    case "cancelled":
    case "failed":
      return "danger";
    default:
      return "outline";
  }
}

interface OrdersTableProps {
  orders: Order[];
  products: Product[];
  dict: Dictionary["orders_table"];
  basePath: string;
  isArchive?: boolean;
  canOverride?: boolean;
}

interface FilterState {
  dateRange: { start: Date | null; end: Date | null };
  products: string[];
  campuses: string[];
  statuses: string[];
}

export default function OrdersTable({
  orders,
  products,
  dict,
  basePath,
  isArchive = false,
  canOverride = false,
}: OrdersTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { start: null, end: null },
    products: [],
    campuses: [],
    statuses: [],
  });
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(() => new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [pendingBulkStatus, setPendingBulkStatus] = useState<OrderStatus | null>(null);
  const [showPickupDialog, setShowPickupDialog] = useState(false);
  const [pickupInput, setPickupInput] = useState<string | null>(null);

  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [productsFilterOpen, setProductsFilterOpen] = useState(false);
  const [campusFilterOpen, setCampusFilterOpen] = useState(false);
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);

  const dateFilterRef = useRef<HTMLButtonElement | null>(null);
  const productsFilterRef = useRef<HTMLButtonElement | null>(null);
  const campusFilterRef = useRef<HTMLButtonElement | null>(null);
  const statusFilterRef = useRef<HTMLButtonElement | null>(null);

  const {
    results: searchedOrders,
    query: searchQuery,
    setQuery: setSearchQuery,
  } = useSearch<Order>({
    data: orders || [],
    fields: [
      { field: "order_number", boost: 4 },
      { field: "user_istid", boost: 4 },
      { field: "customer_name", boost: 3 },
      { field: "customer_email", boost: 2 },
      "campus",
      "payment_reference",
      "itemsText",
    ],
    extractField: (order, field) => {
      if (field === "itemsText")
        return order.items?.map((i) => `${i.product_name} ${i.variant_label || ""}`).join(" ");

      return undefined;
    },
    returnAllWhenEmpty: true,
  });

  const cascadeFilterOptions = useMemo(
    () => buildCascadeFilterTree(orders, products),
    [orders, products]
  );

  const productFilterSummaries = useMemo(
    () => summarizeProductFilterTags(filters.products, cascadeFilterOptions),
    [filters.products, cascadeFilterOptions]
  );

  const availableStatuses = useMemo(() => {
    const statusSet = new Set<string>();
    orders.forEach((order) => statusSet.add(order.status));
    return [...statusSet]
      .filter((status) => ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG])
      .map((status) => status)
      .sort();
  }, [orders]);

  const uniqueCampuses = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach((order) => {
      const raw = order.campus || "";
      const key = normalizeCampus(raw);
      if (key) map.set(key, displayCampus(key));
    });
    return [...map.values()].sort();
  }, [orders]);

  const filtered = useMemo(() => {
    let list = searchedOrders;

    if (filters.statuses.length > 0)
      list = list.filter((order) => filters.statuses.includes(order.status));

    if (filters.products.length > 0)
      list = list.filter((order) => matchesProductFilter(order, filters.products));

    if (filters.campuses.length > 0) {
      const selectedNormalized = filters.campuses.map((campus) => campus.trim().toLowerCase());
      list = list.filter((order) =>
        selectedNormalized.includes(normalizeCampus(order.campus || ""))
      );
    }

    const { start, end } = filters.dateRange;
    if (start) list = list.filter((order) => new Date(order.created_at) >= new Date(start));

    if (end) list = list.filter((order) => new Date(order.created_at) <= new Date(end));

    return list;
  }, [searchedOrders, filters]);

  const handleClearAll = useCallback((): void => {
    setFilters({
      dateRange: { start: null, end: null },
      products: [],
      campuses: [],
      statuses: [],
    });
  }, []);

  const handleArchiveToggle = () => {
    startTransition(() => {
      const url = isArchive ? `${basePath}/orders` : `${basePath}/orders?archive=true`;
      router.push(url);
    });
  };

  const handleRowClick = useCallback(
    (orderId: number | string): void => {
      const archiveParam = isArchive ? "&archive=true" : "";
      router.push(
        `${basePath}/orders?orderId=${encodeURIComponent(String(orderId))}${archiveParam}`,
        { scroll: false }
      );
    },
    [isArchive, basePath, router]
  );

  const [emailModalOrders, setEmailModalOrders] = useState<Order[] | null>(null);

  function handleBulkStatusChange(status: OrderStatus): void {
    if (selectedOrders.size === 0) return;
    setPendingBulkStatus(status);
  }

  function handleSingleStatusChange(orderNumber: string, status: OrderStatus): void {
    setSelectedOrders(new Set([orderNumber]));
    setPendingBulkStatus(status);
  }

  function handleOpenSinglePickupDeadline(order: Order): void {
    setSelectedOrders(new Set([order.order_number]));
    setPickupInput(
      order.pickup_deadline ? new Date(order.pickup_deadline).toISOString().slice(0, 10) : ""
    );
    setShowPickupDialog(true);
  }

  const handleClearSinglePickupDeadline = useCallback(
    async (order: Order): Promise<void> => {
      try {
        await updateOrderAction(order.order_number, { pickup_deadline: null });
        Alert.success(dict.order_success);
        router.refresh();
      } catch {
        Alert.error(dict.error_update_order);
      }
    },
    [dict, router]
  );

  function handleOpenEmailModal(targetOrders: Order[]): void {
    if (targetOrders.length === 0) return;
    setEmailModalOrders(targetOrders);
  }

  function handleBulkEmail(): void {
    if (selectedOrders.size === 0) return;
    const list = Array.from(selectedOrders)
      .map(
        (id) =>
          orders.find((o) => o.order_number === id) || filtered.find((o) => o.order_number === id)
      )
      .filter((o): o is Order => Boolean(o));
    handleOpenEmailModal(list);
  }

  const renderOrderMenuItems = useCallback(
    (order: Order) => (
      <>
        <DropdownMenu.Item
          icon={<FiEye size={14} />}
          onClick={() => handleRowClick(order.order_number)}>
          Ver Detalhes
        </DropdownMenu.Item>
        <DropdownMenu.Item
          icon={<FiMail size={14} />}
          onClick={() => handleOpenEmailModal([order])}>
          Enviar Email
        </DropdownMenu.Item>
        {order.pickup_deadline ? (
          <>
            <DropdownMenu.Item
              icon={<FiClock size={14} />}
              onClick={() => handleOpenSinglePickupDeadline(order)}>
              {dict.edit_pickup_deadline || "Alterar Prazo"}
            </DropdownMenu.Item>
            <DropdownMenu.Item
              icon={<FiClock size={14} />}
              onClick={() => void handleClearSinglePickupDeadline(order)}>
              {dict.clear_pickup_deadline || "Limpar Prazo"}
            </DropdownMenu.Item>
          </>
        ) : (
          <DropdownMenu.Item
            icon={<FiClock size={14} />}
            onClick={() => handleOpenSinglePickupDeadline(order)}>
            {dict.set_pickup_deadline || "Definir Prazo"}
          </DropdownMenu.Item>
        )}
        <DropdownMenu.Divider />
        {order.status === "pending" && (
          <DropdownMenu.Item
            icon={<FiCheckCircle size={14} />}
            onClick={() => handleSingleStatusChange(order.order_number, "paid")}>
            {dict.mark_paid}
          </DropdownMenu.Item>
        )}
        {order.status === "paid" && !isTicketOrder(order) && (
          <DropdownMenu.Item
            icon={<FiPackage size={14} />}
            onClick={() => handleSingleStatusChange(order.order_number, "ready")}>
            {dict.mark_ready}
          </DropdownMenu.Item>
        )}
        {order.status === "ready" && !isTicketOrder(order) && (
          <DropdownMenu.Item
            icon={<FiTruck size={14} />}
            onClick={() => handleSingleStatusChange(order.order_number, "delivered")}>
            {dict.mark_delivered}
          </DropdownMenu.Item>
        )}
        {(order.status === "pending" || canOverride) && order.status !== "cancelled" && (
          <>
            <DropdownMenu.Divider />
            <DropdownMenu.Item
              icon={<FiXCircle size={14} />}
              destructive
              onClick={() => handleSingleStatusChange(order.order_number, "cancelled")}>
              {dict.cancel_orders}
            </DropdownMenu.Item>
          </>
        )}
      </>
    ),
    [dict, handleRowClick, canOverride, handleClearSinglePickupDeadline]
  );

  function handleSetPickupDeadline(): void {
    if (selectedOrders.size === 0) return;
    setPickupInput("");
    setShowPickupDialog(true);
  }

  async function confirmSetPickupDeadline(value: string | null): Promise<void> {
    setShowPickupDialog(false);
    if (value === null) return;

    let iso: string | null = null;
    if (value.trim()) {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        Alert.error(dict.error_update_order);
        return;
      }
      iso = parsed.toISOString();
    }

    setBulkLoading(true);
    try {
      const orderIds = Array.from(selectedOrders);
      const concurrency = 5;
      const failures: string[] = [];

      const worker = async (ids: string[]) => {
        await Promise.all(
          ids.map(async (orderId) => {
            try {
              await updateOrderAction(orderId, { pickup_deadline: iso });
            } catch {
              failures.push(orderId);
            }
          })
        );
      };

      for (let i = 0; i < orderIds.length; i += concurrency) {
        await worker(orderIds.slice(i, i + concurrency));
      }

      if (failures.length) {
        Alert.warning(dict.error_update_order);
      } else {
        Alert.success(dict.order_success);
        router.refresh();
      }
    } finally {
      setBulkLoading(false);
    }
  }

  const doBulkStatusChange = async (status: OrderStatus) => {
    setBulkLoading(true);
    const toastId = Alert.info(dict.status_update_bulk);
    const orderIds = Array.from(selectedOrders);
    const concurrency = 5;
    const failures: string[] = [];

    const worker = async (ids: string[]) => {
      await Promise.all(
        ids.map(async (orderId) => {
          try {
            await setOrderStatusAction(orderId, status);
          } catch {
            failures.push(orderId);
          }
        })
      );
    };

    try {
      for (let i = 0; i < orderIds.length; i += concurrency) {
        await worker(orderIds.slice(i, i + concurrency));
      }
      setSelectedOrders(new Set());
      router.refresh();
      Alert.dismiss(toastId);
      if (failures.length) {
        Alert.warning(dict.error_update_order);
      } else {
        Alert.success(dict.status_update_success);
      }
    } finally {
      setBulkLoading(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/shop/orders/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumbers: filtered.map((o) => o.order_number),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          err.error ||
          "Erro ao comunicar com a SumUp. O ficheiro Excel não foi gerado para evitar inconsistências financeiras.";
        Alert.error(msg);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `encomendas_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      Alert.success("Ficheiro Excel exportado com sucesso!");
    } catch (error) {
      console.error("Export error:", error);
      Alert.error("Erro ao descarregar ficheiro Excel de encomendas");
    } finally {
      setIsExporting(false);
    }
  }, [filtered]);

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        id: "order_number",
        header: dict.col_number,
        isCardHeader: true,
        dataLabel: dict.col_number,
        cell: (order) => (
          <span className={styles.orderNumberCell}>
            <strong>{order.order_number}</strong>
          </span>
        ),
      },
      {
        id: "date",
        header: dict.col_date,
        dataLabel: dict.col_date,
        hasFilter: true,
        onFilterClick: (_e, ref) => {
          dateFilterRef.current = ref.current;
          setDateFilterOpen((prev) => !prev);
        },
        cell: (order) => new Date(order.created_at).toLocaleDateString(),
      },
      {
        id: "customer_name",
        header: dict.col_name,
        dataLabel: dict.col_name,
        cell: (order) => getFirstAndLastName(order.customer_name),
      },
      {
        id: "campus",
        header: dict.col_campus,
        dataLabel: dict.col_campus,
        hasFilter: true,
        onFilterClick: (_e, ref) => {
          campusFilterRef.current = ref.current;
          setCampusFilterOpen((prev) => !prev);
        },
        cell: (order) => (order.campus ? displayCampus(normalizeCampus(order.campus)) : "-"),
      },
      {
        id: "customer_email",
        header: dict.col_email,
        dataLabel: dict.col_email,
        cell: (order) => (
          <a
            href={`mailto:${order.customer_email}`}
            className={styles.emailCell}
            onClick={(e) => e.stopPropagation()}>
            {order.customer_email}
          </a>
        ),
      },
      {
        id: "products",
        header: dict.col_products,
        dataLabel: dict.col_products,
        hasFilter: true,
        onFilterClick: (_e, ref) => {
          productsFilterRef.current = ref.current;
          setProductsFilterOpen((prev) => !prev);
        },
        cell: (order) => (
          <div className={styles.productsCell}>
            {getCompactProductsSummary(order.items).map((line) => (
              <div key={line} className={styles.productLine}>
                {line}
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "total_amount",
        header: dict.col_total,
        dataLabel: dict.col_total,
        cell: (order) => `${order.total_amount.toFixed(2)}€`,
      },
      {
        id: "status",
        header: dict.col_status,
        dataLabel: dict.col_status,
        hasFilter: true,
        onFilterClick: (_e, ref) => {
          statusFilterRef.current = ref.current;
          setStatusFilterOpen((prev) => !prev);
        },
        cell: (order) => (
          <Badge variant={getStatusBadgeVariant(order.status)}>
            {getLocalizedOrderStatusLabel(order, {
              status: dict.status,
              ticket_confirmed: dict.ticket_confirmed,
            })}
          </Badge>
        ),
      },
    ],
    [dict]
  );

  return (
    <>
      <div className={styles.container}>
        <ColorfulText
          as="h1"
          className={styles.title}
          text={isArchive ? dict.archive_title : dict.title}
        />

        <div className={styles.controlsRow}>
          <div className={styles.searchContainer}>
            <SearchInput
              placeholder={dict.search_placeholder}
              value={searchQuery}
              onChange={setSearchQuery}
              action={
                <button
                  type="button"
                  className={styles.mobileFilterBtn}
                  onClick={() => setShowMobileFilters(true)}
                  title={dict.filters_title}
                  aria-label={dict.filters_title}>
                  <TbFilter size={18} />
                </button>
              }
            />
          </div>
          <div className={styles.rightControls}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`${basePath || ""}/shop/pos`)}>
              Balcão POS
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`${basePath || ""}/shop/pos/live`)}>
              Balcão Rápido
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              title={dict.export_button}
              aria-label={dict.export_button}>
              <TbTableExport size={16} />
              {dict.export_button}
            </Button>

            <Button
              variant={isArchive ? "primary" : "outline"}
              size="sm"
              onClick={handleArchiveToggle}
              disabled={isPending}>
              <FiArchive />
              {isArchive ? dict.view_active : dict.archive}
            </Button>
          </div>
        </div>

        <div className={styles.desktopOnly}>
          <TableActiveFilters
            dateRange={filters.dateRange}
            onRemoveDateRange={() =>
              setFilters((p) => ({
                ...p,
                dateRange: { start: null, end: null },
              }))
            }
            filterGroups={[
              {
                id: "campuses",
                label: dict.filter_campus,
                values: filters.campuses,
              },
              {
                id: "statuses",
                label: dict.filter_status,
                values: filters.statuses,
                getDisplayValue: (s) => dict.status[s as OrderStatus] ?? s,
              },
            ]}
            customTags={productFilterSummaries.map((item) => ({
              id: item.id,
              label: item.label,
              onRemove: () =>
                setFilters((p) => ({
                  ...p,
                  products: p.products.filter((id) => !item.leafIds.includes(id)),
                })),
            }))}
            onRemoveValue={(groupId, value) => {
              setFilters((prev) => ({
                ...prev,
                [groupId]: (prev[groupId as keyof FilterState] as string[]).filter(
                  (x) => x !== value
                ),
              }));
            }}
            onClearAll={handleClearAll}
            clearLabel="Limpar filtros"
          />
        </div>

        {selectedOrders.size > 0 && (
          <TableSelectionBar
            count={selectedOrders.size}
            label={`${selectedOrders.size !== 1 ? dict.order_plural : dict.order_singular} ${
              selectedOrders.size !== 1 ? dict.selected_plural : dict.selected_singular
            }`}
            onClear={() => setSelectedOrders(new Set())}
            clearLabel="Limpar">
            <Button
              size="sm"
              variant="solid"
              color="primary"
              onClick={handleBulkEmail}
              disabled={bulkLoading}
              title={dict.send_email_selected}>
              <FiMail /> {dict.send_email}
            </Button>
            <Button
              size="sm"
              variant="solid"
              color="primary"
              onClick={handleSetPickupDeadline}
              disabled={bulkLoading}
              title={dict.set_pickup_deadline_title}>
              <FiClock /> {dict.set_pickup_deadline}
            </Button>
            <InputDateDialog
              open={showPickupDialog}
              title={dict.pickup_dialog_title}
              initialValue={pickupInput ?? ""}
              onConfirm={(val) => confirmSetPickupDeadline(val)}
              onCancel={() => setShowPickupDialog(false)}
            />
            <DropdownMenu align="end">
              <DropdownMenu.Trigger>
                <Button size="sm" variant="solid" color="primary" disabled={bulkLoading}>
                  {bulkLoading ? dict.processing : "Alterar Estado..."} <FiChevronDown />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end" mobileTitle="Alterar Estado">
                <DropdownMenu.Item
                  icon={<FiCheckCircle size={14} />}
                  onClick={() => handleBulkStatusChange("paid")}>
                  {dict.mark_paid}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  icon={<FiPackage size={14} />}
                  onClick={() => handleBulkStatusChange("ready")}>
                  {dict.mark_ready}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  icon={<FiTruck size={14} />}
                  onClick={() => handleBulkStatusChange("delivered")}>
                  {dict.mark_delivered}
                </DropdownMenu.Item>
                {Array.from(selectedOrders).some(
                  (num) => orders.find((o) => o.order_number === num)?.status !== "cancelled"
                ) &&
                  (canOverride ||
                    Array.from(selectedOrders).every(
                      (num) => orders.find((o) => o.order_number === num)?.status === "pending"
                    )) && (
                    <>
                      <DropdownMenu.Divider />
                      <DropdownMenu.Item
                        destructive
                        icon={<FiXCircle size={14} />}
                        onClick={() => handleBulkStatusChange("cancelled")}>
                        {dict.cancel_orders}
                      </DropdownMenu.Item>
                    </>
                  )}
              </DropdownMenu.Content>
            </DropdownMenu>
          </TableSelectionBar>
        )}

        <DataTable
          data={filtered}
          columns={columns}
          enableRowSelection={true}
          selectedRowIds={selectedOrders}
          onSelectionChange={setSelectedOrders}
          getRowId={(order) => order.order_number}
          onRowClick={(order) => handleRowClick(order.order_number)}
          rowActions={renderOrderMenuItems}
          actionsTitle={dict.actions_title}
          emptyMessage={isArchive ? dict.no_archived_orders : dict.no_orders}
          responsive="cards"
        />
      </div>

      <TableFilterDate
        isOpen={dateFilterOpen}
        onClose={() => setDateFilterOpen(false)}
        dateRange={filters.dateRange}
        onChange={(range) => setFilters((p) => ({ ...p, dateRange: range }))}
        buttonRef={dateFilterRef}
        titleLabel={dict.col_date}
        untilDateLabel="Até"
        rangeLabel="Intervalo"
        clearLabel="Limpar"
        applyLabel="Aplicar"
        drawerTitle={dict.col_date}
        locale={pt}
      />
      {productsFilterOpen && (
        <TableFilterCascade
          isOpen={productsFilterOpen}
          onClose={() => setProductsFilterOpen(false)}
          title={dict.filter_products}
          options={cascadeFilterOptions}
          selected={filters.products}
          onChange={(products) => setFilters((p) => ({ ...p, products }))}
          buttonRef={productsFilterRef}
        />
      )}
      <TableFilterMultiSelect
        isOpen={campusFilterOpen}
        onClose={() => setCampusFilterOpen(false)}
        options={uniqueCampuses}
        selected={filters.campuses}
        onChange={(campuses) => setFilters((p) => ({ ...p, campuses }))}
        buttonRef={campusFilterRef}
        title={dict.filter_campus}
        clearLabel="Limpar"
        applyLabel="Aplicar"
      />
      <TableFilterMultiSelect
        isOpen={statusFilterOpen}
        onClose={() => setStatusFilterOpen(false)}
        options={availableStatuses}
        selected={filters.statuses}
        onChange={(statuses) => setFilters((p) => ({ ...p, statuses }))}
        buttonRef={statusFilterRef}
        title={dict.filter_status}
        getLabel={(status) => dict.status[status as OrderStatus] ?? status}
        clearLabel="Limpar"
        applyLabel="Aplicar"
      />

      <TableFiltersDrawer
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        title={dict.filters_title || "Filtros"}
        closeAriaLabel="Fechar filtros"
        dateRange={filters.dateRange}
        dateFilterTitle={dict.col_date}
        untilDateLabel="Até"
        rangeLabel="Intervalo"
        clearLabel="Limpar"
        applyLabel="Aplicar"
        locale={pt}
        categories={[
          {
            id: "products",
            title: dict.filter_products,
            cascadeOptions: cascadeFilterOptions,
            selected: filters.products,
          },
          {
            id: "campuses",
            title: dict.filter_campus,
            options: uniqueCampuses,
            selected: filters.campuses,
          },
          {
            id: "statuses",
            title: dict.filter_status,
            options: availableStatuses.map((s) => ({
              value: s,
              label: dict.status[s as OrderStatus] ?? s,
            })),
            selected: filters.statuses,
          },
        ]}
        onApply={({ dateRange, categories }) => {
          setFilters({
            dateRange,
            products: categories["products"] || [],
            campuses: categories["campuses"] || [],
            statuses: categories["statuses"] || [],
          });
          setShowMobileFilters(false);
        }}
      />

      {pendingBulkStatus && (
        <ConfirmDialog
          open={!!pendingBulkStatus}
          message={`${dict.bulk_confirm_1} ${selectedOrders.size} ${selectedOrders.size !== 1 ? dict.order_plural : dict.order_singular} ${dict.bulk_confirm_3} ${dict.status[pendingBulkStatus]}?`}
          confirmLabel={dict.confirm}
          cancelLabel={dict.cancel}
          isDestructive={pendingBulkStatus === "cancelled"}
          onConfirm={async () => {
            await doBulkStatusChange(pendingBulkStatus);
            setPendingBulkStatus(null);
          }}
          onCancel={() => setPendingBulkStatus(null)}
        />
      )}

      {emailModalOrders && (
        <EmailComposerModal
          open={Boolean(emailModalOrders)}
          onClose={() => setEmailModalOrders(null)}
          title={
            emailModalOrders.length === 1
              ? `Enviar Email: Encomenda ${emailModalOrders[0].order_number}`
              : `Enviar Email para ${emailModalOrders.length} Encomendas`
          }
          recipientCount={emailModalOrders.length}
          initialSubject="Atualização da tua encomenda NEIIST"
          initialBody={`Olá {{name}},\n\nRelativamente à tua encomenda **{{order_number}}** no valor de {{total}}...\n\nCom os melhores cumprimentos,\nNEIIST`}
          variables={[
            {
              key: "name",
              label: "Nome do Cliente",
              sampleValue: emailModalOrders[0]?.customer_name || "Maria Silva",
            },
            {
              key: "order_number",
              label: "Número da Encomenda",
              sampleValue: emailModalOrders[0]?.order_number || "20261008480",
            },
            {
              key: "total",
              label: "Total da Encomenda",
              sampleValue: `${Number(emailModalOrders[0]?.total_amount || 25).toFixed(2)}€`,
            },
            {
              key: "status",
              label: "Estado",
              sampleValue: emailModalOrders[0]?.status || "paid",
            },
            {
              key: "campus",
              label: "Campus de Levantamento",
              sampleValue: emailModalOrders[0]?.campus || "Alameda",
            },
          ]}
          sampleData={{
            name: emailModalOrders[0]?.customer_name || "Maria Silva",
            order_number: emailModalOrders[0]?.order_number || "20261008480",
            total: `${Number(emailModalOrders[0]?.total_amount || 25).toFixed(2)}€`,
            status: emailModalOrders[0]?.status || "paid",
            campus: emailModalOrders[0]?.campus || "Alameda",
          }}
          onSend={async ({ subject, body }) => {
            const orderNumbers = emailModalOrders.map((o) => o.order_number);
            const res = await sendCustomOrderEmailAction({
              orderNumbers,
              subject,
              body,
            });
            Alert.success(`Email enviado com sucesso para ${res.sentCount} encomenda(s)!`);
          }}
        />
      )}
    </>
  );
}
