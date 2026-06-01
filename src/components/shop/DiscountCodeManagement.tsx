"use client";

import { useState } from "react";
import { FaPlus, FaTag } from "react-icons/fa";
import { FiCheck } from "react-icons/fi";
import ColorfulText from "@/components/ColorfulText";
import { DiscountCode } from "@/types/shop/discountCode";
import { Product } from "@/types/shop/product";
import { User } from "@/types/user";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import styles from "@/styles/components/shop/DiscountCodeManagement.module.css";

interface DiscountCodesDashboardProps {
  users: User[];
  products: Product[];
  discountCodes: DiscountCode[];
}

function getStatus(code: DiscountCode): { label: string; tone: "active" | "warning" | "muted" } {
  const now = Date.now();
  const expiresAt = code.expires_at ? new Date(code.expires_at).getTime() : null;
  if (!code.active) return { label: "Inativo", tone: "muted" };
  if (expiresAt != null && !Number.isNaN(expiresAt) && expiresAt < now) {
    return { label: "Expirado", tone: "warning" };
  }
  if (code.max_uses != null && code.current_uses >= code.max_uses) {
    return { label: "Esgotado", tone: "warning" };
  }
  return { label: "Ativo", tone: "active" };
}

function formatUsers(code: DiscountCode, usersByIstid: Map<string, User>): string {
  return code.valid_istids.length === 0
    ? "Todos"
    : code.valid_istids
        .map((istid) => {
          const u = usersByIstid.get(istid);
          return u ? `${u.name} (${u.istid})` : istid;
        })
        .join(", ");
}

function formatProducts(code: DiscountCode, productNamesById: Map<number, string>): string {
  return code.valid_product_ids.length === 0
    ? "Todos"
    : code.valid_product_ids.map((id) => productNamesById.get(id) ?? String(id)).join(", ");
}

export default function DiscountCodeManagement({
  users,
  products,
  discountCodes,
}: DiscountCodesDashboardProps) {
  const router = useRouter();
  const [codes, setCodes] = useState(discountCodes);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const usersByIstid = new Map(users.map((u) => [u.istid, u]));
  const productNamesById = new Map(products.map((p) => [p.id, p.name]));

  const filteredCodes = codes.filter((code) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [
      code.code,
      code.discount_type,
      formatUsers(code, usersByIstid),
      formatProducts(code, productNamesById),
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  const toggleCode = (id: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(
      selected.size === filteredCodes.length && filteredCodes.length > 0
        ? new Set()
        : new Set(filteredCodes.map((c) => c.id))
    );
  };

  const isAllSelected = selected.size === filteredCodes.length && filteredCodes.length > 0;
  const isSomeSelected = selected.size > 0 && selected.size < filteredCodes.length;
  const allSelectedActive = Array.from(selected).every(
    (id) => codes.find((c) => c.id === id)?.active
  );

  const bulkUpdate = async (active: boolean) => {
    let failures = 0;
    await Promise.all(
      Array.from(selected).map(async (id) => {
        try {
          const res = await fetch("/api/shop/discounts", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, active }),
          });
          const data = await res.json().catch(() => null);
          if (res.ok && data) setCodes((c) => c.map((x) => (x.id === id ? data : x)));
          else failures++;
        } catch {
          failures++;
        }
      })
    );
    if (failures === 0) {
      toast.success(`Códigos ${active ? "ativados" : "desativados"}.`, { closeButton: true });
    } else {
      toast.error(`Falha em ${failures} código(s)`, { closeButton: true });
    }
    setSelected(new Set());
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Eliminar ${selected.size} código(s)? Tem a certeza?`)) return;
    let failures = 0;
    await Promise.all(
      Array.from(selected).map(async (id) => {
        try {
          const res = await fetch("/api/shop/discounts", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
          if (res.ok) setCodes((c) => c.filter((x) => x.id !== id));
          else failures++;
        } catch {
          failures++;
        }
      })
    );
    if (failures === 0) {
      toast.success("Códigos eliminados.", { closeButton: true });
    } else {
      toast.error(`Falha em ${failures} código(s)`, { closeButton: true });
    }
    setSelected(new Set());
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <ColorfulText className={styles.title} text="Códigos de Desconto" />
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => router.push("/shop/manage/discounts/new")}>
            <FaPlus /> Novo código
          </button>
        </div>
      </div>

      <div className={styles.listControls}>
        <div className={styles.searchWrapper}>
          <FaTag className={styles.searchIcon} />
          <input
            className={`${styles.field} ${styles.searchInput}`}
            placeholder="Pesquisar código, ISTID, email ou produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {selected.size > 0 && (
        <div className={styles.bulkActions}>
          <span className={styles.bulkCount}>
            {selected.size} código{selected.size !== 1 ? "s" : ""} selecionado
            {selected.size !== 1 ? "s" : ""}
          </span>
          <div className={styles.bulkButtons}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => bulkUpdate(!allSelectedActive)}>
              {allSelectedActive ? "Desativar" : "Ativar"}
            </button>
            <button type="button" className={styles.btnDanger} onClick={bulkDelete}>
              Eliminar
            </button>
          </div>
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkboxCol}>
                <div
                  className={`${styles.checkbox} ${isAllSelected ? styles.checked : ""} ${isSomeSelected ? styles.indeterminate : ""}`}
                  onClick={toggleAll}>
                  {isAllSelected && <FiCheck size={14} />}
                  {isSomeSelected && <span className={styles.indeterminateIcon}>−</span>}
                </div>
              </th>
              <th>Código</th>
              <th>Utilizador</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Usos</th>
              <th>Restrições</th>
              <th>Expira</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredCodes.map((code) => {
              const status = getStatus(code);
              return (
                <tr key={code.id} onClick={() => toggleCode(code.id)} style={{ cursor: "pointer" }}>
                  <td className={styles.checkboxCell}>
                    <div
                      className={`${styles.checkbox} ${selected.has(code.id) ? styles.checked : ""}`}>
                      {selected.has(code.id) && <FiCheck size={14} />}
                    </div>
                  </td>
                  <td>
                    <strong>{code.code}</strong>
                  </td>
                  <td>{formatUsers(code, usersByIstid)}</td>
                  <td>{code.discount_type === "percentage" ? "Percentagem" : "Valor fixo"}</td>
                  <td>
                    {code.discount_type === "percentage"
                      ? `${code.discount_value}%`
                      : `€${code.discount_value.toFixed(2)}`}
                  </td>
                  <td>
                    {code.current_uses}
                    {code.max_uses != null ? ` / ${code.max_uses}` : ""}
                  </td>
                  <td>{formatProducts(code, productNamesById)}</td>
                  <td>
                    {code.expires_at
                      ? new Date(code.expires_at).toLocaleString("pt-PT")
                      : "Sem limite"}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[status.tone]}`}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filteredCodes.length === 0 && (
              <tr>
                <td colSpan={9} className={styles.emptyCell}>
                  Nenhum código encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
