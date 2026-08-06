"use client";

import { useMemo, useRef, useState } from "react";
import styles from "@/styles/components/shop/OrdersTable.module.css";
import { Order } from "@/types/shop/order";
import { getStatusLabel, getStatusCssClass } from "@/utils/shop/orderStatusUtils";
import { OrderStatus, ORDER_STATUS_CONFIG } from "@/types/shop/orderStatus";
import { Product } from "@/types/shop/product";
import { FiSearch, FiCheck } from "react-icons/fi";
import { TbFilter, TbTableExport } from "react-icons/tb";
import * as XLSX from "xlsx";
import Fuse from "fuse.js";
import {
  getColorFromOptions,
  getCompactProductsSummary,
  formatVariantSimple,
} from "@/utils/shop/shopUtils";
import { getFirstAndLastName } from "@/utils/userUtils";
import { getOrderKindFromItems, getOrderStatusLabelForKind } from "@/utils/shop/orderKindUtils";
import NewOrderModal from "./NewOrderModal";
import PosPaymentOverlay from "@/components/shop/PosPaymentOverlay";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import InputDialog from "@/components/layout/InputDateDialog";
import MultiSelectFilter from "./MultiSelectFilter";
import DateFilter from "./DateFilter";
import ActiveFilters from "./ActiveFilters";
import MobileFiltersDrawer from "./MobileFiltersDrawer";
import type { OrdersTableDict } from "@/types/i18n";
import ColorfulText from "../ColorfulText";


function normalizeCampus(campus?: string): string {
  return campus ? campus.trim().toLowerCase() : "";
}

function displayCampus(campus: string): string {
  return campus
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

function sortByMultipleFields<T>(a: T, b: T, ...fields: (keyof T)[]): number {
  for (const field of fields) {
    const aValue = String(a[field]);
    const bValue = String(b[field]);
    const orderComparison = aValue.localeCompare(bValue);
    if (orderComparison !== 0) return orderComparison;
  }
  return 0;
}

interface OrdersTableProps {
  orders: Order[];
  products: Product[];
  locale: string;
  dict: OrdersTableDict;
}

interface FilterState {
  dateRange: { start: Date | null; end: Date | null };
  products: string[];
  campuses: string[];
  statuses: string[];
}

export default function OrdersTable({ orders, products, dict, locale }: OrdersTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { start: null, end: null },
    products: [],
    campuses: [],
    statuses: [],
  });
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
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

  const fuse = useMemo(
    () =>
      new Fuse(orders || [], {
        keys: [
          { name: "order_number", weight: 4 },
          { name: "user_istid", weight: 4 },
          { name: "customer_name", weight: 3 },
          { name: "customer_email", weight: 2 },
          { name: "items.product_name", weight: 1.5 },
          { name: "items.variant_label", weight: 0.8 },
          { name: "campus", weight: 0.3 },
        ],
        threshold: 0.2,
        ignoreLocation: true,
        minMatchCharLength: 2,
        shouldSort: true,
      }),
    [orders]
  );

  const uniqueProducts = useMemo(() => {
    const productNameSet = new Set<string>();
    orders.forEach((order) => order.items.forEach((item) => productNameSet.add(item.product_name)));
    return [...productNameSet].sort();
  }, [orders]);

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
    let list = orders || [];
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      const identifierMatches = orders.filter(
        (order) =>
          (order.customer_name?.toLowerCase().includes(query) ?? false) ||
          (order.user_istid?.toLowerCase().includes(query) ?? false) ||
          (order.customer_email?.toLowerCase().includes(query) ?? false) ||
          (order.payment_reference?.toLocaleLowerCase().includes(query) ?? false) ||
          order.order_number.toLowerCase().includes(query)
      );

      const fuseResults = fuse.search(searchQuery.trim()).map((result) => result.item);

      if (identifierMatches.length > 0) {
        const seen = new Set(identifierMatches.map((order) => order.id));
        list = [...identifierMatches, ...fuseResults.filter((o) => !seen.has(o.id))];
      } else {
        list = fuseResults;
      }
    }

    if (filters.statuses.length > 0) {
      list = list.filter((order) => filters.statuses.includes(order.status));
    }

    if (filters.products.length > 0) {
      list = list.filter((order) =>
        order.items.some((item) => filters.products.includes(item.product_name))
      );
    }

    if (filters.campuses.length > 0) {
      const selectedNormalized = filters.campuses.map((campus) => campus.trim().toLowerCase());
      list = list.filter((order) =>
        selectedNormalized.includes(normalizeCampus(order.campus || ""))
      );
    }

    const { start, end } = filters.dateRange;
    if (start) {
      list = list.filter((order) => new Date(order.created_at) >= new Date(start));
    }
    if (end) {
      list = list.filter((order) => new Date(order.created_at) <= new Date(end));
    }

    return list;
  }, [orders, searchQuery, fuse, filters]);

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

  function handleClearAll(): void {
    setFilters({
      dateRange: { start: null, end: null },
      products: [],
      campuses: [],
      statuses: [],
    });
  }

  function handleRowClick(orderId: number): void {
    router.push(`/orders?orderId=${orderId}`);
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

  const handleExport = () => {
    const ordersSheet = filtered.map((o) => ({
      [dict.orders_table.export_status]: getOrderStatusLabelForKind(getOrderKindFromItems(o.items).orderKind, o.status, o),
      [dict.orders_table.export_number]: o.order_number,
      [dict.orders_table.export_date]: new Date(o.created_at).toLocaleString(locale),
      [dict.orders_table.export_name]: o.customer_name,
      [dict.orders_table.export_email]: o.customer_email,
      [dict.orders_table.export_nif]: o.customer_nif || "",
      [dict.orders_table.export_ist_id]: o.user_istid,
      [dict.orders_table.export_campus]: o.campus,
      [dict.orders_table.export_phone]: o.customer_phone,
      [dict.orders_table.export_payment_method]: o.payment_method,
      [dict.orders_table.export_payment_reference]: o.payment_reference,
      [dict.orders_table.export_total]: o.total_amount,
      [dict.orders_table.export_notes]: o.notes || "",
      [dict.orders_table.export_updated_by || "Ultima modificação por"]: o.updated_by,
      [dict.orders_table.export_products]: o.items
        .map((it) => `${it.product_name} ${it.variant_label || ""} x${it.quantity}`)
        .join("; "),
    }));

    const statsMapDetalhes: Record<
      string,
      { modelo: string; cor: string; tamanho: string; quantidade: number }
    > = {};
    const statsMapCampusInventory: Record<
      string,
      {
        campus: string;
        modelo: string;
        cor: string;
        tamanho: string;
        quantidade: number;
      }
    > = {};
    const statsMapCampusDate: Record<
      string,
      {
        campus: string;
        modelo: string;
        data: string;
        cor: string;
        tamanho: string;
        quantidade: number;
      }
    > = {};

    filtered.forEach((order) =>
      order.items.forEach((item) => {
        const modelo = item.product_name;
        const colorInfo = getColorFromOptions(item.variant_options, item.variant_label);
        const cor = colorInfo.name || "";
        const tamanho =
          formatVariantSimple(item.variant_options ?? undefined, item.variant_label ?? undefined)
            .text || "";
        const key = `${modelo}|||${cor}|||${tamanho}`;
        if (!statsMapDetalhes[key]) {
          statsMapDetalhes[key] = { modelo, cor, tamanho, quantidade: 0 };
        }
        statsMapDetalhes[key].quantidade += item.quantity;
        const campus = order.campus || dict.orders_table.unknown_campus;
        const ciKey = `${campus}|||${modelo}|||${cor}|||${tamanho}`;
        if (!statsMapCampusInventory[ciKey]) {
          statsMapCampusInventory[ciKey] = {
            campus,
            modelo,
            cor,
            tamanho,
            quantidade: 0,
          };
        }
        statsMapCampusInventory[ciKey].quantidade += item.quantity;
        const dateStr = new Date(order.created_at).toISOString().slice(0, 10);
        const cdKey = `${campus}|||${modelo}|||${dateStr}|||${cor}|||${tamanho}`;
        if (!statsMapCampusDate[cdKey]) {
          statsMapCampusDate[cdKey] = {
            campus,
            modelo,
            data: dateStr,
            cor,
            tamanho,
            quantidade: 0,
          };
        }
        statsMapCampusDate[cdKey].quantidade += item.quantity;
      })
    );

    const statsSheet = Object.values(statsMapDetalhes)
      .sort((a, b) => sortByMultipleFields(a, b, "modelo", "cor", "tamanho"))
      .map((itemData) => ({
        [dict.orders_table.export_col_model]: itemData.modelo,
        [dict.orders_table.export_col_color]: itemData.cor,
        [dict.orders_table.export_col_size]: itemData.tamanho,
        [dict.orders_table.export_col_quantity]: itemData.quantidade,
      }));

    const statsCampusInventorySheet = Object.values(statsMapCampusInventory)
      .sort((a, b) => sortByMultipleFields(a, b, "campus", "modelo", "cor", "tamanho"))
      .map((itemData) => ({
        [dict.orders_table.export_campus]: itemData.campus,
        [dict.orders_table.export_col_model]: itemData.modelo,
        [dict.orders_table.export_col_color]: itemData.cor,
        [dict.orders_table.export_col_size]: itemData.tamanho,
        [dict.orders_table.export_col_quantity]: itemData.quantidade,
      }));

    const statsCampusDateSheet = Object.values(statsMapCampusDate)
      .sort((a, b) => sortByMultipleFields(a, b, "campus", "modelo", "data", "cor", "tamanho"))
      .map((itemData) => ({
        [dict.orders_table.export_campus]: itemData.campus,
        [dict.orders_table.export_col_model]: itemData.modelo,
        [dict.orders_table.export_date]: itemData.data,
        [dict.orders_table.export_col_color]: itemData.cor,
        [dict.orders_table.export_col_size]: itemData.tamanho,
        [dict.orders_table.export_col_quantity]: itemData.quantidade,
      }));

    const excelWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      excelWorkbook,
      XLSX.utils.json_to_sheet(ordersSheet),
      dict.orders_table.export_sheet_orders
    );
    XLSX.utils.book_append_sheet(excelWorkbook, XLSX.utils.json_to_sheet(statsSheet), dict.orders_table.export_sheet_details);
    XLSX.utils.book_append_sheet(
      excelWorkbook,
      XLSX.utils.json_to_sheet(statsCampusInventorySheet),
      dict.orders_table.export_sheet_campus_inventory
    );
    XLSX.utils.book_append_sheet(
      excelWorkbook,
      XLSX.utils.json_to_sheet(statsCampusDateSheet),
      dict.orders_table.export_sheet_campus_date
    );
    XLSX.writeFile(excelWorkbook, `${dict.orders_table.export_filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <>
      <div className={styles.container}>
        <ColorfulText as="h1" className={styles.title} text={dict.orders_table.title} />

        <div className={styles.controlsRow}>
          <div className={styles.searchContainer}>
            <div className={styles.searchIcon}>
              <FiSearch size={18} />
            </div>
            <input
              type="text"
              placeholder={dict.orders_table.search_placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button
              className={styles.mobileFilterBtn}
              onClick={() => setShowMobileFilters(true)}
              title={dict.orders_table.filters_title}>
              <TbFilter size={20} />
            </button>
          </div>
          <div className={styles.rightControls}>
            <button className={styles.iconBtn} onClick={handleExport} title={dict.orders_table.export_button}>

              <TbTableExport />
            </button>
            <button className={styles.newBtn} onClick={() => setShowNewOrderModal(true)}>
              {dict.orders_table.new_order_button}
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
                label: "Produtos",
                values: filters.products,
              },
              {
                id: "campuses",
                label: "Campus",
                values: filters.campuses,
              },
              {
                id: "statuses",
                label: "Estado",
                values: filters.statuses,
                getDisplayValue: (s) => getStatusLabel(s as OrderStatus),
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
            //getStatusLabel={getStatusLabel}
            dict={dict.active_filters}
            locale={locale}
          />
        </div>

        {selectedOrders.size > 0 && (
          <div className={styles.bulkActions}>
            <span className={styles.bulkCount}>
              {selectedOrders.size} {selectedOrders.size !== 1 ? dict.orders_table.order_plural : dict.orders_table.order_singular} 
              {selectedOrders.size !== 1 ? dict.orders_table.selected_plural : dict.orders_table.selected_singular}
            </span>
            <div className={styles.bulkButtons}>
              <button
                onClick={handleEmailSelected}
                disabled={bulkLoading}
                className={styles.bulkBtn}
                title={dict.orders_table.send_email_selected}>
                {bulkLoading ? dict.orders_table.processing : dict.orders_table.send_email}
              </button>
              <button
                onClick={handleSetPickupDeadline}
                disabled={bulkLoading}
                className={styles.bulkBtn}
                title={dict.orders_table.set_pickup_deadline_title}>
                {bulkLoading ? dict.orders_table.processing : dict.orders_table.set_pickup_deadline}
              </button>
              <InputDialog
                open={showPickupDialog}
                title={dict.orders_table.pickup_dialog_title}
                initialValue={pickupInput ?? ""}
                onConfirm={(val) => confirmSetPickupDeadline(val)}
                onCancel={() => setShowPickupDialog(false)}
                dict={dict.input_date_dialog}
              />
              <button
                onClick={() => handleBulkStatusChange("paid")}
                disabled={bulkLoading}
                className={styles.bulkBtn}>
                {bulkLoading ? dict.orders_table.processing : dict.orders_table.mark_paid}
              </button>
              <button
                onClick={() => handleBulkStatusChange("ready")}
                disabled={bulkLoading}
                className={styles.bulkBtn}>
                {bulkLoading ? dict.orders_table.processing : dict.orders_table.mark_ready}
              </button>
              <button
                onClick={() => handleBulkStatusChange("delivered")}
                disabled={bulkLoading}
                className={styles.bulkBtn}>
                {bulkLoading ? dict.orders_table.processing : dict.orders_table.mark_delivered}
              </button>
              <button
                onClick={() => handleBulkStatusChange("cancelled")}
                disabled={bulkLoading}
                className={styles.bulkBtnDanger}>
                {bulkLoading ? dict.orders_table.processing : dict.orders_table.cancel_orders}
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
                  <th>{dict.orders_table.col_number}</th>
                  <th>
                    <div className={styles.headerWithFilter}>
                      {dict.orders_table.col_date}
                      <button
                        ref={dateFilterRef}
                        className={`${styles.headerFilterBtn} ${styles.desktopOnly}`}
                        onClick={() => setDateFilterOpen(!dateFilterOpen)}>
                        <TbFilter size={16} />
                      </button>
                    </div>
                  </th>
                  <th>{dict.orders_table.col_name}</th>
                  <th>
                    <div className={styles.headerWithFilter}>
                      {dict.orders_table.col_campus}
                      <button
                        ref={campusFilterRef}
                        className={`${styles.headerFilterBtn} ${styles.desktopOnly}`}
                        onClick={() => setCampusFilterOpen(!campusFilterOpen)}>
                        <TbFilter size={16} />
                      </button>
                    </div>
                  </th>
                  <th>{dict.orders_table.col_email}</th>
                  <th>
                    <div className={styles.headerWithFilter}>
                      {dict.orders_table.col_products}
                      <button
                        ref={productsFilterRef}
                        className={`${styles.headerFilterBtn} ${styles.desktopOnly}`}
                        onClick={() => setProductsFilterOpen(!productsFilterOpen)}>
                        <TbFilter size={16} />
                      </button>
                    </div>
                  </th>
                  <th>{dict.orders_table.col_total}</th>
                  <th>
                    <div className={styles.headerWithFilter}>
                      {dict.orders_table.col_status}
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
                    <td>{new Date(order.created_at).toLocaleDateString(locale)}</td>
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
                      {getCompactProductsSummary(order.items).map((line, i) => (
                        <div key={i} className={styles.productLine}>
                          {line}
                        </div>
                      ))}
                    </td>
                    <td>{order.total_amount.toFixed(2)}€</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${styles[getStatusCssClass(order.status)]}`}>
                        {getOrderStatusLabelForKind(
                          getOrderKindFromItems(order.items).orderKind,
                          order.status,
                          order
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: 20, textAlign: "center" }}>
                      {dict.orders_table.no_orders}
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
          dict={dict.date_filter}
          locale={locale}
        />
      )}
      {productsFilterOpen && (
        <MultiSelectFilter
          isOpen={productsFilterOpen}
          onClose={() => setProductsFilterOpen(false)}
          options={uniqueProducts}
          selected={filters.products}
          onChange={(products) => setFilters((p) => ({ ...p, products }))}
          buttonRef={productsFilterRef}
          title={dict.orders_table.filter_products}
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
          title={dict.orders_table.filter_campus}
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
          title={dict.orders_table.filter_status}
          getLabel={(status) => getStatusLabel(status as OrderStatus)}
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
            title: dict.mobile_filters_drawer.products_section,
            options: uniqueProducts,
            selected: filters.products,
          },
          {
            id: "campuses",
            title: dict.mobile_filters_drawer.campus_section,
            options: uniqueCampuses,
            selected: filters.campuses,
          },
          {
            id: "statuses",
            title: dict.mobile_filters_drawer.status_section,
            options: availableStatuses,
            selected: filters.statuses,
            getLabel: (s) => getStatusLabel(s as OrderStatus),
          },
        ]}        
        dict={dict.mobile_filters_drawer}
        locale={locale}
      />
      {showNewOrderModal && (
        <NewOrderModal
          onClose={() => setShowNewOrderModal(false)}
          onSubmit={handleNewOrderSubmit}
          products={products}
          dict={{
            new_order_modal: dict.new_order_modal,
            create_user_modal: dict.create_user_modal,
            confirm_dialog: dict.confirm_dialog,
          }}
        />
      )}

      {newOrderPosPayment && (
        <PosPaymentOverlay
          open={!!newOrderPosPayment}
          order={newOrderPosPayment}
          reopenOrderUrl={`/orders?orderId=${newOrderPosPayment.id}`}
          onCloseAction={() => setNewOrderPosPayment(null)}
          onOrderUpdatedAction={() => {
            setNewOrderPosPayment(null);
            router.refresh();
          }}
          dict={{ pos_payment: dict.pos_payment, confirm_dialog: dict.confirm_dialog }}
        />
      )}

      {pendingBulkStatus && (
        <ConfirmDialog
          open={!!pendingBulkStatus}
          message={`${dict.orders_table.bulk_confirm_1} ${selectedOrders.size} ${dict.orders_table.bulk_confirm_2} ${dict.orders_table.bulk_confirm_3} ${getStatusLabel(pendingBulkStatus)} ${dict.orders_table.bulk_confirm_4}`}
          onConfirm={async () => {
            await doBulkStatusChange(pendingBulkStatus);
            setPendingBulkStatus(null);
          }}
          onCancel={() => setPendingBulkStatus(null)}
          dict={dict.confirm_dialog}
        />
      )}
    </>
  );
}
