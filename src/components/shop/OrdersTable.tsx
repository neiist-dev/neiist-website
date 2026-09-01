"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import styles from "@/styles/components/shop/OrdersTable.module.css";
import { Order } from "@/types/shop/order";
import { getStatusCssClass } from "@/utils/shop/orderStatusUtils";
import { OrderStatus, ORDER_STATUS_CONFIG } from "@/types/shop/orderStatus";
import { Product } from "@/types/shop/product";
import Search from "@/components/search/Search";
import { useSearch } from "@/hooks/useSearch";
import { FiSearch, FiCheck } from "react-icons/fi";
import { TbFilter, TbTableExport } from "react-icons/tb";
import { getCompactProductsSummary } from "@/utils/shop/shopUtils";
import { getFirstAndLastName } from "@/utils/userUtils";
import { getOrderKindFromItems, getLocalizedOrderStatusLabel } from "@/utils/shop/orderKindUtils";
import {
  buildProductCascadeList,
  matchesProductFilter,
  getProductFilterDisplayLabel,
} from "@/utils/shop/orderFilterUtils";
import { exportOrdersToExcel } from "@/utils/shop/orderExportUtils";
import NewOrderModal from "./NewOrderModal";
import PosPaymentOverlay from "@/components/shop/PosPaymentOverlay";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import InputDialog from "@/components/layout/InputDateDialog";
import MultiSelectFilter from "./MultiSelectFilter";
import DateFilter from "./DateFilter";
import ActiveFilters from "./ActiveFilters";
import MobileFiltersDrawer from "./MobileFiltersDrawer";
import ColorfulText from "@/components/ColorfulText";
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

interface OrdersTableProps {
  orders: Order[];
  products: Product[];
  dict: Dictionary["orders_table"];
  posPaymentDict: Dictionary["pos_payment"];
  basePath: string;
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
  posPaymentDict,
  basePath,
}: OrdersTableProps) {
  const router = useRouter();
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
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
  const [newOrderPosPayment, setNewOrderPosPayment] = useState<Order | null>(null);

  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [productsFilterOpen, setProductsFilterOpen] = useState(false);
  const [campusFilterOpen, setCampusFilterOpen] = useState(false);
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);

  const dateFilterRef = useRef<HTMLButtonElement>(null);
  const productsFilterRef = useRef<HTMLButtonElement>(null);
  const campusFilterRef = useRef<HTMLButtonElement>(null);
  const statusFilterRef = useRef<HTMLButtonElement>(null);

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
      if (field === "itemsText") {
        return order.items?.map((i) => `${i.product_name} ${i.variant_label || ""}`).join(" ");
      }
      return undefined;
    },
    returnAllWhenEmpty: true,
  });

  const productCascadeList = useMemo(
    () => buildProductCascadeList(orders, products),
    [orders, products]
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

  function toggleOrder(id: string): void {
    const s = new Set(selectedOrders);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelectedOrders(s);
  }

  function toggleAll(): void {
    if (selectedOrders.size === filtered.length) setSelectedOrders(new Set());
    else setSelectedOrders(new Set(filtered.map((order) => String(order.id))));
  }

  const isAllSelected = selectedOrders.size === filtered.length && filtered.length > 0;
  const isSomeSelected = selectedOrders.size > 0 && selectedOrders.size < filtered.length;

  const handleClearAll = useCallback((): void => {
    setFilters({
      dateRange: { start: null, end: null },
      products: [],
      campuses: [],
      statuses: [],
    });
  }, []);

  function handleRowClick(orderId: number): void {
    router.push(`${basePath}/orders?orderId=${orderId}`);
  }

  function handleNewOrderSubmit(order?: Order): void {
    setShowNewOrderModal(false);
    if (order?.id) {
      setNewOrderPosPayment(order);
      return;
    }
    router.refresh();
  }

  function handleBulkStatusChange(status: OrderStatus): void {
    if (selectedOrders.size === 0) return;
    setPendingBulkStatus(status);
  }

  function handleEmailSelected(): void {
    if (selectedOrders.size === 0) return;
    const emails = Array.from(selectedOrders)
      .map((id) => {
        return (
          orders.find((o) => String(o.id) === id) || filtered.find((o) => String(o.id) === id)
        )?.customer_email;
      })
      .filter(Boolean) as string[];
    const unique = [...new Set(emails)];
    if (unique.length === 0) return;
    const bcc = encodeURIComponent(unique.join(","));
    window.open(
      `https://accounts.google.com/AccountChooser?continue=${encodeURIComponent(
        `https://mail.google.com/mail/?view=cm&fs=1&bcc=${bcc}`
      )}`,
      "_blank"
    );
  }

  function handleSetPickupDeadline(): void {
    if (selectedOrders.size === 0) return;
    setPickupInput("");
    setShowPickupDialog(true);
  }

  async function confirmSetPickupDeadline(inputValue: string | null) {
    setShowPickupDialog(false);
    // convert local datetime-local value to ISO or null
    let isoString: string | null = null;
    if (inputValue && inputValue.trim() !== "") {
      const dt = new Date(inputValue);
      if (isNaN(dt.getTime())) {
        console.error("Invalid date.");
        return;
      }
      isoString = dt.toISOString();
    }

    setBulkLoading(true);
    const orderIds = Array.from(selectedOrders)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n));
    const concurrency = 5;
    const failures: number[] = [];

    const worker = async (chunk: number[]) => {
      await Promise.all(
        chunk.map(async (orderId) => {
          try {
            const body: Record<string, unknown> = { pickup_deadline: isoString };
            const res = await fetch(`/api/shop/orders/${orderId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            if (!res.ok) {
              failures.push(orderId);
              console.error(
                `Failed to set pickup deadline for ${orderId}`,
                await res.text().catch(() => null)
              );
            }
          } catch (err) {
            failures.push(orderId);
            console.error(`Error setting pickup deadline for ${orderId}:`, err);
          }
        })
      );
    };

    try {
      for (let i = 0; i < orderIds.length; i += concurrency) {
        await worker(orderIds.slice(i, i + concurrency));
      }
      setSelectedOrders(new Set());

      if (failures.length) {
        // TODO: (WARNING)
        console.error(`Falha ao atualizar ${failures.length} encomenda(s)`);
      } else {
        // TODO: (SUCCESS)
        router.refresh();
      }
    } finally {
      setBulkLoading(false);
    }
  }

  const doBulkStatusChange = async (status: OrderStatus) => {
    setBulkLoading(true);
    // TODO: (LOADING) show loading toast while bulk order status updates are running.
    const orderIds = Array.from(selectedOrders)
      .map((id) => Number(id))
      .filter((n) => Number.isFinite(n));
    const concurrency = 5;
    const failures: number[] = [];

    const worker = async (ids: number[]) => {
      await Promise.all(
        ids.map(async (orderId) => {
          try {
            const res = await fetch(`/api/shop/orders/${orderId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status }),
            });
            if (!res.ok) {
              failures.push(orderId);
              console.error(
                `Failed to update order ${orderId}`,
                await res.text().catch(() => null)
              );
            }
          } catch (err) {
            failures.push(orderId);
            console.error(`Error updating order ${orderId}:`, err);
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
      if (failures.length) {
        // TODO: (WARNING)
        console.warn("Some updates failed:", failures);
      } else {
        // TODO: (SUCCESS)
      }
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExport = useCallback(() => {
    exportOrdersToExcel(filtered);
  }, [filtered]);

  return (
    <>
      <div className={styles.container}>
        <ColorfulText as="h1" className={styles.title} text={dict.title} />

        <div className={styles.controlsRow}>
          <div className={styles.searchContainer}>
            <div className={styles.searchIcon}>
              <FiSearch size={18} />
            </div>
            <Search
              type="text"
              placeholder={dict.search_placeholder}
              value={searchQuery}
              onChange={setSearchQuery}
              className={styles.searchInput}
            />
            <button
              className={styles.mobileFilterBtn}
              onClick={() => setShowMobileFilters(true)}
              title={dict.filters_title}>
              <TbFilter size={20} />
            </button>
          </div>
          <div className={styles.rightControls}>
            <button className={styles.iconBtn} onClick={handleExport} title={dict.export_button}>
              <TbTableExport />
            </button>
            <button className={styles.newBtn} onClick={() => setShowNewOrderModal(true)}>
              {dict.new_order_button}
            </button>
          </div>
        </div>

        <div className={styles.desktopOnly}>
          <ActiveFilters
            dateRange={filters.dateRange}
            onRemoveDateRange={() =>
              setFilters((p) => ({ ...p, dateRange: { start: null, end: null } }))
            }
            filterGroups={[
              {
                id: "products",
                label: dict.filter_products,
                values: filters.products,
                getDisplayValue: getProductFilterDisplayLabel,
              },
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
            onRemoveValue={(groupId, value) => {
              setFilters((prev) => ({
                ...prev,
                [groupId]: (prev[groupId as keyof FilterState] as string[]).filter(
                  (x) => x !== value
                ),
              }));
            }}
            onClearAll={handleClearAll}
          />
        </div>

        {selectedOrders.size > 0 && (
          <div className={styles.bulkActions}>
            <span className={styles.bulkCount}>
              {selectedOrders.size}{" "}
              {selectedOrders.size !== 1 ? dict.order_plural : dict.order_singular}{" "}
              {selectedOrders.size !== 1 ? dict.selected_plural : dict.selected_singular}
            </span>
            <div className={styles.bulkButtons}>
              <button
                onClick={handleEmailSelected}
                disabled={bulkLoading}
                className={styles.bulkBtn}
                title={dict.send_email_selected}>
                {bulkLoading ? dict.processing : dict.send_email}
              </button>
              <button
                onClick={handleSetPickupDeadline}
                disabled={bulkLoading}
                className={styles.bulkBtn}
                title={dict.set_pickup_deadline_title}>
                {bulkLoading ? dict.processing : dict.set_pickup_deadline}
              </button>
              <InputDialog
                open={showPickupDialog}
                title={dict.pickup_dialog_title}
                initialValue={pickupInput ?? ""}
                onConfirm={(val) => confirmSetPickupDeadline(val)}
                onCancel={() => setShowPickupDialog(false)}
              />
              <button
                onClick={() => handleBulkStatusChange("paid")}
                disabled={bulkLoading}
                className={styles.bulkBtn}>
                {bulkLoading ? dict.processing : dict.mark_paid}
              </button>
              <button
                onClick={() => handleBulkStatusChange("ready")}
                disabled={bulkLoading}
                className={styles.bulkBtn}>
                {bulkLoading ? dict.processing : dict.mark_ready}
              </button>
              <button
                onClick={() => handleBulkStatusChange("delivered")}
                disabled={bulkLoading}
                className={styles.bulkBtn}>
                {bulkLoading ? dict.processing : dict.mark_delivered}
              </button>
              <button
                onClick={() => handleBulkStatusChange("cancelled")}
                disabled={bulkLoading}
                className={styles.bulkBtnDanger}>
                {bulkLoading ? dict.processing : dict.cancel_orders}
              </button>
            </div>
          </div>
        )}

        <div className={styles.card}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.checkboxCol}>
                    <div
                      className={`${styles.checkbox} ${isAllSelected ? styles.checked : ""} ${isSomeSelected ? styles.indeterminate : ""}`}
                      onClick={toggleAll}>
                      {isAllSelected && <FiCheck />}
                      {isSomeSelected && <span className={styles.indeterminateIcon}>−</span>}
                    </div>
                  </th>
                  <th>{dict.col_number}</th>
                  <th>
                    <div className={styles.headerWithFilter}>
                      {dict.col_date}
                      <button
                        ref={dateFilterRef}
                        className={`${styles.headerFilterBtn} ${styles.desktopOnly}`}
                        onClick={() => setDateFilterOpen(!dateFilterOpen)}>
                        <TbFilter size={16} />
                      </button>
                    </div>
                  </th>
                  <th>{dict.col_name}</th>
                  <th>
                    <div className={styles.headerWithFilter}>
                      {dict.col_campus}
                      <button
                        ref={campusFilterRef}
                        className={`${styles.headerFilterBtn} ${styles.desktopOnly}`}
                        onClick={() => setCampusFilterOpen(!campusFilterOpen)}>
                        <TbFilter size={16} />
                      </button>
                    </div>
                  </th>
                  <th>{dict.col_email}</th>
                  <th>
                    <div className={styles.headerWithFilter}>
                      {dict.col_products}
                      <button
                        ref={productsFilterRef}
                        className={`${styles.headerFilterBtn} ${styles.desktopOnly}`}
                        onClick={() => setProductsFilterOpen(!productsFilterOpen)}>
                        <TbFilter size={16} />
                      </button>
                    </div>
                  </th>
                  <th>{dict.col_total}</th>
                  <th>
                    <div className={styles.headerWithFilter}>
                      {dict.col_status}
                      <button
                        ref={statusFilterRef}
                        className={`${styles.headerFilterBtn} ${styles.desktopOnly}`}
                        onClick={() => setStatusFilterOpen(!statusFilterOpen)}>
                        <TbFilter size={16} />
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={String(order.id)}
                    onClick={() => handleRowClick(order.id)}
                    style={{ cursor: "pointer" }}>
                    <td className={styles.checkboxCell}>
                      <div
                        className={`${styles.checkbox} ${selectedOrders.has(String(order.id)) ? styles.checked : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOrder(String(order.id));
                        }}>
                        {selectedOrders.has(String(order.id)) && <FiCheck size={16} />}
                      </div>
                    </td>
                    <td>{order.order_number}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>{getFirstAndLastName(order.customer_name)}</td>
                    <td className={styles.campusCell}>
                      {order.campus ? displayCampus(normalizeCampus(order.campus)) : "-"}
                    </td>
                    <td>
                      <a
                        href={`mailto:${order.customer_email}`}
                        className={styles.emailCell}
                        onClick={(e) => e.stopPropagation()}>
                        {order.customer_email}
                      </a>
                    </td>
                    <td className={styles.productsCell}>
                      {getCompactProductsSummary(order.items).map((line) => (
                        <div key={line} className={styles.productLine}>
                          {line}
                        </div>
                      ))}
                    </td>
                    <td>{order.total_amount.toFixed(2)}€</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${styles[getStatusCssClass(order.status)]}`}>
                        {getLocalizedOrderStatusLabel(
                          getOrderKindFromItems(order.items).orderKind,
                          order,
                          {
                            status: dict.status,
                            special_status: dict.special_status,
                          }
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: 20, textAlign: "center" }}>
                      {dict.no_orders}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {dateFilterOpen && (
        <DateFilter
          isOpen={dateFilterOpen}
          onClose={() => setDateFilterOpen(false)}
          dateRange={filters.dateRange}
          onChange={(range) => setFilters((p) => ({ ...p, dateRange: range }))}
          buttonRef={dateFilterRef}
        />
      )}
      {productsFilterOpen && (
        <MultiSelectFilter
          isOpen={productsFilterOpen}
          onClose={() => setProductsFilterOpen(false)}
          cascadeOptions={productCascadeList}
          selected={filters.products}
          onChange={(products) => setFilters((p) => ({ ...p, products }))}
          buttonRef={productsFilterRef}
          title={dict.filter_products}
        />
      )}
      {campusFilterOpen && (
        <MultiSelectFilter
          isOpen={campusFilterOpen}
          onClose={() => setCampusFilterOpen(false)}
          options={uniqueCampuses}
          selected={filters.campuses}
          onChange={(campuses) => setFilters((p) => ({ ...p, campuses }))}
          buttonRef={campusFilterRef}
          title={dict.filter_campus}
        />
      )}
      {statusFilterOpen && (
        <MultiSelectFilter
          isOpen={statusFilterOpen}
          onClose={() => setStatusFilterOpen(false)}
          options={availableStatuses}
          selected={filters.statuses}
          onChange={(statuses) => setFilters((p) => ({ ...p, statuses }))}
          buttonRef={statusFilterRef}
          title={dict.filter_status}
          getLabel={(status) => dict.status[status as OrderStatus] ?? status}
        />
      )}

      <MobileFiltersDrawer
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        initialFilters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters as FilterState);
          setShowMobileFilters(false);
        }}
        filterGroups={[
          {
            id: "products",
            title: dict.filter_products,
            cascadeOptions: productCascadeList,
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
            options: availableStatuses,
            selected: filters.statuses,
            getLabel: (s) => dict.status[s as OrderStatus] ?? s,
          },
        ]}
      />

      {showNewOrderModal && (
        <NewOrderModal
          onClose={() => setShowNewOrderModal(false)}
          onSubmit={handleNewOrderSubmit}
          products={products}
        />
      )}

      {newOrderPosPayment && (
        <PosPaymentOverlay
          open={!!newOrderPosPayment}
          order={newOrderPosPayment}
          reopenOrderUrl={`${basePath}/orders?orderId=${newOrderPosPayment.id}`}
          dict={posPaymentDict}
          onCloseAction={() => setNewOrderPosPayment(null)}
          onOrderUpdatedAction={() => {
            setNewOrderPosPayment(null);
            router.refresh();
          }}
        />
      )}

      {pendingBulkStatus && (
        <ConfirmDialog
          open={!!pendingBulkStatus}
          message={`${dict.bulk_confirm_1} ${selectedOrders.size} ${selectedOrders.size !== 1 ? dict.order_plural : dict.order_singular} ${dict.bulk_confirm_3} ${dict.status[pendingBulkStatus]}?`}
          onConfirm={async () => {
            await doBulkStatusChange(pendingBulkStatus);
            setPendingBulkStatus(null);
          }}
          onCancel={() => setPendingBulkStatus(null)}
        />
      )}
    </>
  );
}
