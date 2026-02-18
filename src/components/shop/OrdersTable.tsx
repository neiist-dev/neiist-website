"use client";

import { useMemo, useRef, useState } from "react";
import styles from "@/styles/components/shop/OrdersTable.module.css";
import {
  Order,
  getStatusLabel,
  getStatusCssClass,
  ORDER_STATUS_CONFIG,
  Product,
  OrderStatus,
} from "@/types/shop";
import { FiSearch, FiCheck } from "react-icons/fi";
import { TbFilter, TbTableExport } from "react-icons/tb";
import * as XLSX from "xlsx";
import Fuse from "fuse.js";
import { getColorFromOptions, getCompactProductsSummary } from "@/utils/shopUtils";
import { getFirstAndLastName } from "@/utils/userUtils";
import NewOrderModal from "./NewOrderModal";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import MultiSelectFilter from "./MultiSelectFilter";
import DateFilter from "./DateFilter";
import ActiveFilters from "./ActiveFilters";
import MobileFiltersDrawer from "./MobileFiltersDrawer";

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
}

interface FilterState {
  dateRange: { start: Date | null; end: Date | null };
  products: string[];
  campuses: string[];
  statuses: string[];
}

export default function OrdersTable({ orders, products }: OrdersTableProps) {
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
          "order_number",
          "created_at",
          "customer_name",
          "customer_email",
          "user_istid",
          "campus",
          "items.product_name",
          "items.variant_label",
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [orders]
  );

  const uniqueProducts = useMemo(() => {
    const orderIdSet = new Set<string>();
    orders.forEach((order) => order.items.forEach((item) => orderIdSet.add(item.product_name)));
    return [...orderIdSet].sort();
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
      list = fuse.search(searchQuery.trim()).map((searchResult) => searchResult.item);
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

  function handleNewOrderSubmit(): void {
    setShowNewOrderModal(false);
    router.refresh();
  }

  function handleBulkStatusChange(status: OrderStatus): void {
    if (selectedOrders.size === 0) return;
    setPendingBulkStatus(status);
  }

  const doBulkStatusChange = async (status: OrderStatus) => {
    setBulkLoading(true);
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
        console.warn("Some updates failed:", failures);
      }
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExport = () => {
    const ordersSheet = filtered.map((o) => ({
      Número: o.order_number,
      Data: new Date(o.created_at).toLocaleString("pt-PT"),
      Nome: o.customer_name,
      Email: o.customer_email,
      NIF: o.customer_nif || "",
      "Payment Method": o.payment_method,
      "IST ID": o.user_istid,
      Campus: o.campus,
      Telefone: o.customer_phone,
      Estado: getStatusLabel(o.status),
      "Total (€)": o.total_amount,
      Notas: o.notes || "",
      Produtos: o.items
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
          item.variant_options?.Tamanho || item.variant_options?.Size || item.variant_label || "";
        const key = `${modelo}|||${cor}|||${tamanho}`;
        if (!statsMapDetalhes[key]) {
          statsMapDetalhes[key] = { modelo, cor, tamanho, quantidade: 0 };
        }
        statsMapDetalhes[key].quantidade += item.quantity;
        const campus = order.campus || "Unknown";
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
        Modelo: itemData.modelo,
        Cor: itemData.cor,
        Tamanho: itemData.tamanho,
        Quantidade: itemData.quantidade,
      }));

    const statsCampusInventorySheet = Object.values(statsMapCampusInventory)
      .sort((a, b) => sortByMultipleFields(a, b, "campus", "modelo", "cor", "tamanho"))
      .map((itemData) => ({
        Campus: itemData.campus,
        Modelo: itemData.modelo,
        Cor: itemData.cor,
        Tamanho: itemData.tamanho,
        Quantidade: itemData.quantidade,
      }));

    const statsCampusDateSheet = Object.values(statsMapCampusDate)
      .sort((a, b) => sortByMultipleFields(a, b, "campus", "modelo", "data", "cor", "tamanho"))
      .map((itemData) => ({
        Campus: itemData.campus,
        Modelo: itemData.modelo,
        Data: itemData.data,
        Cor: itemData.cor,
        Tamanho: itemData.tamanho,
        Quantidade: itemData.quantidade,
      }));

    const excelWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      excelWorkbook,
      XLSX.utils.json_to_sheet(ordersSheet),
      "Encomendas"
    );
    XLSX.utils.book_append_sheet(excelWorkbook, XLSX.utils.json_to_sheet(statsSheet), "Detalhes");
    XLSX.utils.book_append_sheet(
      excelWorkbook,
      XLSX.utils.json_to_sheet(statsCampusInventorySheet),
      "InventarioPorCampus"
    );
    XLSX.utils.book_append_sheet(
      excelWorkbook,
      XLSX.utils.json_to_sheet(statsCampusDateSheet),
      "InventarioPorCampusPorDia"
    );
    XLSX.writeFile(excelWorkbook, `encomendas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <>
      <div className={styles.container}>
        <h1 className={styles.title}>
          <span className={styles.primary}>En</span>
          <span className={styles.secondary}>com</span>
          <span className={styles.tertiary}>end</span>
          <span className={styles.quaternary}>as</span>
        </h1>

        <div className={styles.controlsRow}>
          <div className={styles.searchContainer}>
            <div className={styles.searchIcon}>
              <FiSearch size={18} />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button
              className={styles.mobileFilterBtn}
              onClick={() => setShowMobileFilters(true)}
              title="Filtros">
              <TbFilter size={20} />
            </button>
          </div>
          <div className={styles.rightControls}>
            <button className={styles.iconBtn} onClick={handleExport} title="Exportar">
              <TbTableExport />
            </button>
            <button className={styles.newBtn} onClick={() => setShowNewOrderModal(true)}>
              Nova Encomenda
            </button>
          </div>
        </div>

        <div className={styles.desktopOnly}>
          <ActiveFilters
            dateRange={filters.dateRange}
            products={filters.products}
            campuses={filters.campuses}
            statuses={filters.statuses}
            onRemoveDateRange={() =>
              setFilters((p) => ({ ...p, dateRange: { start: null, end: null } }))
            }
            onRemoveProduct={(p) =>
              setFilters((prev) => ({ ...prev, products: prev.products.filter((x) => x !== p) }))
            }
            onRemoveCampus={(c) =>
              setFilters((prev) => ({ ...prev, campuses: prev.campuses.filter((x) => x !== c) }))
            }
            onRemoveStatus={(s) =>
              setFilters((prev) => ({ ...prev, statuses: prev.statuses.filter((x) => x !== s) }))
            }
            onClearAll={handleClearAll}
            getStatusLabel={getStatusLabel}
          />
        </div>

        {selectedOrders.size > 0 && (
          <div className={styles.bulkActions}>
            <span className={styles.bulkCount}>
              {selectedOrders.size} encomenda{selectedOrders.size !== 1 ? "s" : ""} selecionada
              {selectedOrders.size !== 1 ? "s" : ""}
            </span>
            <div className={styles.bulkButtons}>
              <button
                onClick={() => handleBulkStatusChange("paid")}
                disabled={bulkLoading}
                className={styles.bulkBtn}>
                {bulkLoading ? "A processar..." : "Marcar como Pago"}
              </button>
              <button
                onClick={() => handleBulkStatusChange("ready")}
                disabled={bulkLoading}
                className={styles.bulkBtn}>
                {bulkLoading ? "A processar..." : "Marcar como Pronto"}
              </button>
              <button
                onClick={() => handleBulkStatusChange("delivered")}
                disabled={bulkLoading}
                className={styles.bulkBtn}>
                {bulkLoading ? "A processar..." : "Marcar como Entregue"}
              </button>
              <button
                onClick={() => handleBulkStatusChange("cancelled")}
                disabled={bulkLoading}
                className={styles.bulkBtnDanger}>
                {bulkLoading ? "A processar..." : "Cancelar Encomendas"}
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
                  <th>Número</th>
                  <th>
                    <div className={styles.headerWithFilter}>
                      Data
                      <button
                        ref={dateFilterRef}
                        className={`${styles.headerFilterBtn} ${styles.desktopOnly}`}
                        onClick={() => setDateFilterOpen(!dateFilterOpen)}>
                        <TbFilter size={16} />
                      </button>
                    </div>
                  </th>
                  <th>Nome</th>
                  <th>
                    <div className={styles.headerWithFilter}>
                      Campus
                      <button
                        ref={campusFilterRef}
                        className={`${styles.headerFilterBtn} ${styles.desktopOnly}`}
                        onClick={() => setCampusFilterOpen(!campusFilterOpen)}>
                        <TbFilter size={16} />
                      </button>
                    </div>
                  </th>
                  <th>Email</th>
                  <th>
                    <div className={styles.headerWithFilter}>
                      Produtos
                      <button
                        ref={productsFilterRef}
                        className={`${styles.headerFilterBtn} ${styles.desktopOnly}`}
                        onClick={() => setProductsFilterOpen(!productsFilterOpen)}>
                        <TbFilter size={16} />
                      </button>
                    </div>
                  </th>
                  <th>Total</th>
                  <th>
                    <div className={styles.headerWithFilter}>
                      Estado
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
                    <td>{new Date(order.created_at).toLocaleDateString("pt-PT")}</td>
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
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: 20, textAlign: "center" }}>
                      Nenhuma encomenda encontrada.
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
          options={uniqueProducts}
          selected={filters.products}
          onChange={(products) => setFilters((p) => ({ ...p, products }))}
          buttonRef={productsFilterRef}
          title="Produtos"
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
          title="Campus"
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
          title="Estado"
          getLabel={(status) => getStatusLabel(status as OrderStatus)}
        />
      )}

      <MobileFiltersDrawer
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        filters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          setShowMobileFilters(false);
        }}
        availableProducts={uniqueProducts}
        availableCampuses={uniqueCampuses}
        availableStatuses={availableStatuses}
        getStatusLabel={getStatusLabel}
      />

      {showNewOrderModal && (
        <NewOrderModal
          onClose={() => setShowNewOrderModal(false)}
          onSubmit={handleNewOrderSubmit}
          products={products}
        />
      )}

      {pendingBulkStatus && (
        <ConfirmDialog
          open={!!pendingBulkStatus}
          message={`Tem a certeza que deseja alterar o estado de ${selectedOrders.size} encomenda${selectedOrders.size !== 1 ? "s" : ""} para ${getStatusLabel(pendingBulkStatus)}?`}
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
