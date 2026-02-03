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
import FilterDropdown, { FilterState } from "@/components/shop/OrdersFilters";
import NewOrderModal from "./NewOrderModal";
import { useRouter } from "next/navigation";
import { IoIosAdd } from "react-icons/io";
import ConfirmDialog from "@/components/layout/ConfirmDialog";

interface OrdersTableProps {
  orders: Order[];
  products: Product[];
}

export default function OrdersTable({ orders, products }: OrdersTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    dateStart: "",
    dateEnd: "",
    products: [],
    campus: "",
    status: "",
  });
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [pendingBulkStatus, setPendingBulkStatus] = useState<OrderStatus | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

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
    const s = new Set<string>();
    orders.forEach((o) => o.items.forEach((i) => s.add(i.product_name)));
    return [...s].sort();
  }, [orders]);

  const availableStatuses = useMemo(() => {
    const statusSet = new Set<string>();
    orders.forEach((o) => statusSet.add(o.status));
    return [...statusSet]
      .filter((status) => ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG])
      .map((status) => ({
        value: status,
        label: ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG].label,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [orders]);

  const filtered = useMemo(() => {
    let list = orders || [];
    if (searchQuery.trim()) {
      list = fuse.search(searchQuery.trim()).map((r) => r.item);
    }
    if (appliedFilters.status) {
      list = list.filter((o) => o.status === appliedFilters.status);
    }
    if (appliedFilters.products.length > 0) {
      list = list.filter((o) =>
        o.items.some((it) => appliedFilters.products.includes(it.product_name))
      );
    }
    if (appliedFilters.campus) {
      list = list.filter((o) => o.campus === appliedFilters.campus);
    }
    if (appliedFilters.dateStart) {
      list = list.filter((o) => new Date(o.created_at) >= new Date(appliedFilters.dateStart));
    }
    if (appliedFilters.dateEnd) {
      list = list.filter((o) => new Date(o.created_at) <= new Date(appliedFilters.dateEnd));
    }
    return list;
  }, [orders, searchQuery, fuse, appliedFilters]);

  const toggleOrder = (id: string) => {
    const s = new Set(selectedOrders);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelectedOrders(s);
  };

  const toggleAll = () => {
    if (selectedOrders.size === filtered.length) setSelectedOrders(new Set());
    else setSelectedOrders(new Set(filtered.map((o) => String(o.id))));
  };

  const isAllSelected = selectedOrders.size === filtered.length && filtered.length > 0;
  const isSomeSelected = selectedOrders.size > 0 && selectedOrders.size < filtered.length;

  const handleApplyFilters = (filters: FilterState) => {
    setAppliedFilters(filters);
  };

  const handleRowClick = (orderId: number) => {
    router.push(`/orders?orderId=${orderId}`);
  };

  const handleNewOrderSubmit = () => {
    setShowNewOrderModal(false);
    router.refresh();
  };

  const handleBulkStatusChange = (status: OrderStatus) => {
    if (selectedOrders.size === 0) return;
    setPendingBulkStatus(status);
  };

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

    filtered.forEach((o) =>
      o.items.forEach((it) => {
        const modelo = it.product_name;
        const colorInfo = getColorFromOptions(it.variant_options, it.variant_label);
        const cor = colorInfo.name || "";
        const tamanho =
          it.variant_options?.Tamanho || it.variant_options?.Size || it.variant_label || "";
        const key = `${modelo}|||${cor}|||${tamanho}`;
        if (!statsMapDetalhes[key]) {
          statsMapDetalhes[key] = { modelo, cor, tamanho, quantidade: 0 };
        }
        statsMapDetalhes[key].quantidade += it.quantity;
        const campus = o.campus || "Unknown";
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
        statsMapCampusInventory[ciKey].quantidade += it.quantity;
        const dateStr = new Date(o.created_at).toISOString().slice(0, 10);
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
        statsMapCampusDate[cdKey].quantidade += it.quantity;
      })
    );

    const statsSheet = Object.values(statsMapDetalhes)
      .sort((a, b) => {
        if (a.modelo !== b.modelo) return a.modelo.localeCompare(b.modelo);
        if (a.cor !== b.cor) return a.cor.localeCompare(b.cor);
        return a.tamanho.localeCompare(b.tamanho);
      })
      .map((r) => ({
        Modelo: r.modelo,
        Cor: r.cor,
        Tamanho: r.tamanho,
        Quantidade: r.quantidade,
      }));

    const statsCampusInventorySheet = Object.values(statsMapCampusInventory)
      .sort((a, b) => {
        if (a.campus !== b.campus) return a.campus.localeCompare(b.campus);
        if (a.modelo !== b.modelo) return a.modelo.localeCompare(b.modelo);
        if (a.cor !== b.cor) return a.cor.localeCompare(b.cor);
        return a.tamanho.localeCompare(b.tamanho);
      })
      .map((r) => ({
        Campus: r.campus,
        Modelo: r.modelo,
        Cor: r.cor,
        Tamanho: r.tamanho,
        Quantidade: r.quantidade,
      }));

    const statsCampusDateSheet = Object.values(statsMapCampusDate)
      .sort((a, b) => {
        if (a.campus !== b.campus) return a.campus.localeCompare(b.campus);
        if (a.modelo !== b.modelo) return a.modelo.localeCompare(b.modelo);
        if (a.data !== b.data) return a.data.localeCompare(b.data);
        if (a.cor !== b.cor) return a.cor.localeCompare(b.cor);
        return a.tamanho.localeCompare(b.tamanho);
      })
      .map((r) => ({
        Campus: r.campus,
        Modelo: r.modelo,
        Data: r.data,
        Cor: r.cor,
        Tamanho: r.tamanho,
        Quantidade: r.quantidade,
      }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ordersSheet), "Encomendas");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(statsSheet), "Detalhes");
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(statsCampusInventorySheet),
      "InventarioPorCampus"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(statsCampusDateSheet),
      "InventarioPorCampusPorDia"
    );
    XLSX.writeFile(wb, `encomendas_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
          </div>
          <div className={styles.rightControls}>
            <button
              ref={filterButtonRef}
              className={styles.iconBtn}
              onClick={() => setShowFilters(!showFilters)}
              title="Filtros"
              aria-haspopup="true"
              aria-expanded={showFilters}>
              <TbFilter />
            </button>
            <button className={styles.iconBtn} onClick={handleExport} title="Exportar">
              <TbTableExport />
            </button>
            <button className={styles.newBtn} onClick={() => setShowNewOrderModal(true)}>
              <IoIosAdd />
              Nova Encomenda
            </button>
          </div>
        </div>

        {showFilters && (
          <FilterDropdown
            onClose={() => setShowFilters(false)}
            onApplyFilters={handleApplyFilters}
            buttonRef={filterButtonRef}
            availableProducts={uniqueProducts}
            availableStatuses={availableStatuses}
          />
        )}

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
                  <th>Data</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Produtos</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={String(o.id)}
                    onClick={() => handleRowClick(o.id)}
                    style={{ cursor: "pointer" }}>
                    <td className={styles.checkboxCell}>
                      <div
                        className={`${styles.checkbox} ${selectedOrders.has(String(o.id)) ? styles.checked : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOrder(String(o.id));
                        }}>
                        {selectedOrders.has(String(o.id)) && <FiCheck size={16} />}
                      </div>
                    </td>
                    <td>{o.order_number}</td>
                    <td>{new Date(o.created_at).toLocaleDateString("pt-PT")}</td>
                    <td>{getFirstAndLastName(o.customer_name)}</td>
                    <td>
                      <a
                        href={`mailto:${o.customer_email}`}
                        className={styles.emailCell}
                        onClick={(e) => e.stopPropagation()}>
                        {o.customer_email}
                      </a>
                    </td>
                    <td className={styles.productsCell}>
                      {getCompactProductsSummary(o.items).map((line, i) => (
                        <div key={i} className={styles.productLine}>
                          {line}
                        </div>
                      ))}
                    </td>
                    <td>{o.total_amount.toFixed(2)}€</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${styles[getStatusCssClass(o.status)]}`}>
                        {getStatusLabel(o.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: 20, textAlign: "center" }}>
                      Nenhuma encomenda encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
