"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import { FaPlus, FaEdit } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import { Product, Category } from "@/types/shop";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import ProductForm from "@/components/shop/ProductForm";
import Fuse from "fuse.js";
import styles from "@/styles/components/shop/ShopManagement.module.css";

interface ShopManagementProps {
  products: Product[];
  categories: Category[];
}

export default function ShopManagement({ products, categories }: ShopManagementProps) {
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showConfirm, setShowConfirm] = useState(false);
  const [removingProductId, setRemovingProductId] = useState<number | null>(null);
  const [imageIndex, setImageIndex] = useState<{ [productId: number]: number }>({});

  const fuse = useMemo(
    () =>
      new Fuse(products, {
        keys: ["name", "category", "description"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [products]
  );

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (categoryFilter !== "all") {
      filtered = filtered.filter((products) => products.category === categoryFilter);
    }
    if (search.trim()) {
      return fuse
        .search(search.trim())
        .map((r) => r.item)
        .filter((products) => categoryFilter === "all" || products.category === categoryFilter);
    }
    return filtered;
  }, [products, search, categoryFilter, fuse]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setView("edit");
  };

  const handleRemove = (productId: number) => {
    setRemovingProductId(productId);
    setShowConfirm(true);
  };

  const confirmRemove = async () => {
    if (removingProductId !== null) {
      try {
        const response = await fetch(`/api/shop/products/${removingProductId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          window.location.reload();
        } else {
          const error = await response.json();
          console.error("Error deleting product:", error);
          alert("Error deleting product: " + error.error);
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Error deleting product. Please try again.");
      }
      setShowConfirm(false);
      setRemovingProductId(null);
    }
  };

  const getStockDisplay = (product: Product) => {
    if (product.stock_type === "on_demand") {
      return "Sob Encomenda";
    }
    let totalStock = 0;
    if (product.variants && product.variants.length > 0) {
      totalStock = product.variants.reduce(
        (sum, variant) => sum + (variant.stock_quantity || 0),
        0
      );
    } else {
      totalStock = product.stock_quantity || 0;
    }

    return `${totalStock} em stock`;
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_type === "on_demand") {
      return "on-demand";
    }
    let totalStock = 0;
    if (product.variants && product.variants.length > 0) {
      totalStock = product.variants.reduce(
        (sum, variant) => sum + (variant.stock_quantity || 0),
        0
      );
    } else {
      totalStock = product.stock_quantity || 0;
    }
    if (totalStock === 0) return "out-of-stock";
    if (totalStock <= 5) return "low-stock";
    return "in-stock";
  };

  if (view === "add" || view === "edit") {
    return (
      <ProductForm
        product={editingProduct}
        isEdit={view === "edit"}
        onBack={() => {
          setView("list");
          setEditingProduct(null);
        }}
        categories={categories}
      />
    );
  }

  return (
    <>
      {showConfirm && (
        <ConfirmDialog
          open={showConfirm}
          message="Tem a certeza que deseja remover este produto?"
          onConfirm={confirmRemove}
          onCancel={() => {
            setShowConfirm(false);
            setRemovingProductId(null);
          }}
        />
      )}
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Gestão da Loja</h1>
          <button className={styles.addBtn} onClick={() => setView("add")}>
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
        </div>

        <div className={styles.grid}>
          {filteredProducts.map((product) => (
            <div key={product.id} className={styles.card}>
              <div className={styles.imageContainer}>
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[imageIndex[product.id] || 0] || "/placeholder.jpg"}
                    alt={product.name}
                    width={140}
                    height={140}
                  />
                ) : (
                  <div className={styles.placeholder}>Nenhuma imagem</div>
                )}
                <div className={`${styles.stockBadge} ${styles[getStockStatus(product)]}`}>
                  {getStockDisplay(product)}
                </div>
              </div>
              <div className={styles.thumbnails}>
                {product.images &&
                  product.images.length > 1 &&
                  product.images.map((img, idx) => (
                    <button
                      key={img + idx}
                      className={`${styles.thumbBtn} ${(imageIndex[product.id] || 0) === idx ? styles.activeThumb : ""}`}
                      onClick={() =>
                        setImageIndex((prev) => ({
                          ...prev,
                          [product.id]: idx,
                        }))
                      }
                      tabIndex={-1}
                      aria-label={`Ver imagem ${idx + 1}`}
                      type="button">
                      <Image
                        src={img}
                        alt=""
                        width={28}
                        height={28}
                        className={styles.thumbImg}
                        draggable={false}
                      />
                    </button>
                  ))}
              </div>
              <div className={styles.cardContent}>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className={styles.price}>{product.price}€</div>

                <div className={styles.productMeta}>
                  <span className={styles.category}>{product.category}</span>
                  <span className={styles.stockType}>
                    {product.stock_type === "limited" ? "Limitado" : "Sob Encomenda"}
                  </span>
                </div>

                <div className={styles.actions}>
                  <button onClick={() => handleEdit(product)}>
                    <FaEdit /> Editar
                  </button>
                  <button onClick={() => handleRemove(product.id)}>
                    <FiTrash2 /> Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
