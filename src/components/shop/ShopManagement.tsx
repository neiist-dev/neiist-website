"use client";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import { FiPackage, FiArchive } from "react-icons/fi";
import { Product, Category } from "@/types/shop";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import { PiContactlessPayment } from "react-icons/pi";
import ProductManagementCard from "./ProductManagementCard";
import Fuse from "fuse.js";
import styles from "@/styles/components/shop/ShopManagement.module.css";
import ColorfulText from "../ColorfulText";

interface ShopManagementProps {
  products: Product[];
  categories: Category[];
}

type ConfirmAction =
  | { type: "archive"; productId: number }
  | { type: "restore"; productId: number }
  | { type: "permanent"; productId: number };

export default function ShopManagement({ products, categories }: ShopManagementProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<ConfirmAction | null>(null);

  const activeProducts = useMemo(() => products.filter((p) => p.active !== false), [products]);
  const archivedProducts = useMemo(() => products.filter((p) => p.active === false), [products]);
  const visibleProducts = showArchived ? archivedProducts : activeProducts;

  const fuse = useMemo(
    () =>
      new Fuse(visibleProducts, {
        keys: ["name", "category", "description"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [visibleProducts]
  );

  const filteredProducts = useMemo(() => {
    let filtered = visibleProducts;
    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }
    if (search.trim()) {
      return fuse
        .search(search.trim())
        .map((r) => r.item)
        .filter((p) => categoryFilter === "all" || p.category === categoryFilter);
    }
    return filtered;
  }, [visibleProducts, search, categoryFilter, fuse]);

  const handleEdit = (productId: number) => {
    router.push(`/shop/manage/${productId}/edit`);
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
    archive: "Tem a certeza que deseja arquivar este produto?",
    restore: "Tem a certeza que deseja restaurar este produto?",
    permanent:
      "Tem a certeza que deseja eliminar definitivamente este produto? Esta ação não pode ser desfeita.",
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    const { type, productId } = pendingAction;

    try {
      let response: Response;

      if (type === "archive") {
        response = await fetch(`/api/shop/products/${productId}`, { method: "DELETE" });
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

      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        toast.error(data?.error ?? "Ocorreu um erro. Tenta novamente.");
      }
    } catch {
      toast.error("Ocorreu um erro. Tenta novamente.");
    }

    setShowConfirm(false);
    setPendingAction(null);
  };

  const isFiltering = search.trim() !== "" || categoryFilter !== "all";

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
          <ColorfulText className={styles.title} text="Gestão da Loja" />
          <button className={styles.addBtn} onClick={() => router.push("/shop/manage/new")}>
            <FaPlus /> Adicionar Produto
          </button>
        </div>

        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Pesquisar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">Todas categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`${styles.archiveToggle} ${showArchived ? styles.archiveToggleActive : ""}`}
            onClick={() => {
              setShowArchived((v) => !v);
              setCategoryFilter("all");
              setSearch("");
            }}>
            <FiArchive />
            {showArchived
              ? "Ver ativos"
              : `Arquivados${archivedProducts.length > 0 ? ` (${archivedProducts.length})` : ""}`}
          </button>
          <button className={styles.addBtn} onClick={() => router.push("/shop/pos")}>
            <PiContactlessPayment /> Gestão POS
          </button>
        </div>

        {filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <FiPackage size={64} />
            {isFiltering ? (
              <>
                <p>Nenhum produto encontrado</p>
                <span>Tenta ajustar os filtros ou a pesquisa</span>
              </>
            ) : showArchived ? (
              <>
                <p>Sem produtos arquivados</p>
                <span>Produtos arquivados aparecerão aqui</span>
              </>
            ) : (
              <>
                <p>Ainda não há produtos</p>
                <span>Clica em "Adicionar Produto" para começar</span>
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
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
