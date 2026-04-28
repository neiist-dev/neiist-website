"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
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
  locale: string;
  dict: {
    shop_management: {
      title: string;
      pos_link: string;
      add_product: string;
      search_placeholder: string;
      all_categories: string;
      no_image: string;
      view_image: string;
      limited: string;
      on_demand: string;
      in_stock: string;
      edit: string;
      remove: string;
      confirm_remove: string;
    };
    confirm_dialog: {
      confirm: string;
      cancel: string;
    };
    categories: {
      [key: string]: string;
    };
    shop: {
      product_form: {
        unknown_error: string;
        edit: string;
        add_product: string;
        back_button: string;
        images_label: string;
        no_image: string;
        upload_image_label: string;
        product_name_placeholder: string;
        product_price_placeholder: string;
        product_description_placeholder: string;
        choose_categories: string;
        new_category_placeholder: string;
        add_category_button: string;
        limited_stock: string;
        on_demand_stock: string;
        product_quantity_placeholder: string;
        limit_date_placeholder: string;
        option_types: string;
        option_placeholder: string;
        variants_label: string;
        no_variants: string;
        extra_price: string;
        stock_placeholder: string;
        upload: string;
        saving: string;
        save_changes: string;
        create_product: string;
        error_create_category: string;
        error_create_category2: string;
        error_name_missing: string;
        error_category_missing: string;
        error_variant1: string;
        error_variant2: string;
        error_color1: string;
        error_color2: string;
        error_saving_product: string;
        error: string;
        default_option_color: string;
        default_option_size: string;
      };
    };
  }
}

export default function ShopManagement({ products, categories, dict, locale }: ShopManagementProps) {
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
          // TODO: (SUCCESS) show success toast after the product is removed.
          window.location.reload();
        } else {
          const error = await response.json();
          // TODO: (ERROR)
          console.error("Error deleting product:", error);
        }
      } catch (error) {
        // TODO: (ERROR)
        console.error("Error deleting product:", error);
      }
      setShowConfirm(false);
      setRemovingProductId(null);
    }
  };

  const getStockDisplay = (product: Product) => {
    if (product.stock_type === "on_demand") {
      return dict.shop_management.on_demand;
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

    return dict.shop_management.in_stock.replace("{count}", String(totalStock));
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
        dict={dict.shop.product_form}
        locale={locale}
      />
    );
  }

  return (
    <>
      {showConfirm && (
        <ConfirmDialog
          open={showConfirm}
          message={dict.shop_management.confirm_remove}
          onConfirm={confirmRemove}
          onCancel={() => {
            setShowConfirm(false);
            setRemovingProductId(null);
          }}
          dict={dict.confirm_dialog}
        />
      )}
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>{dict.shop_management.title}</h1>
          <div className={styles.headerActions}>
            <Link href="/shop/pos" className={styles.posBtn}>
              {dict.shop_management.pos_link}
            </Link>
            <button className={styles.addBtn} onClick={() => setView("add")}>
              <FaPlus /> {dict.shop_management.add_product}
            </button>
          </div>
        </div>

        <div className={styles.filters}>
          <input
            type="text"
            placeholder={dict.shop_management.search_placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">{dict.shop_management.all_categories}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name in dict.categories ? dict.categories[cat.name] : cat.name}
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
                  <div className={styles.placeholder}>{dict.shop_management.no_image}</div>
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
                      aria-label={dict.shop_management.view_image.replace("{idx}", String(idx + 1))}
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
                  <span className={styles.category}>
                    {product.category && product.category in dict.categories ? dict.categories[product.category] : product.category}
                  </span>
                  <span className={styles.stockType}>
                    {product.stock_type === "limited" ? dict.shop_management.limited : dict.shop_management.on_demand}
                  </span>
                </div>

                <div className={styles.actions}>
                  <button onClick={() => handleEdit(product)}>
                    <FaEdit /> {dict.shop_management.edit}
                  </button>
                  <button onClick={() => handleRemove(product.id)}>
                    <FiTrash2 /> {dict.shop_management.remove}
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
