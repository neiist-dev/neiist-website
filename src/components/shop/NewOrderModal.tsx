"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MdClose, MdSearch } from "react-icons/md";
import Fuse from "fuse.js";
import CreateNewUserModal from "./CreateNewUserModal";
import styles from "@/styles/components/shop/NewOrderModal.module.css";
import type { User } from "@/types/user";
import { Campus, type Product, type ProductVariant } from "@/types/shop";
import ConfirmDialog from "@/components/layout/ConfirmDialog";

interface Props {
  onClose: () => void;
  onSubmit?: () => void;
  products: Product[];
}

interface SelectedProduct {
  product: Product;
  variant: Pick<ProductVariant, "id" | "label">;
  quantity: number;
}

interface ProductWithVariant {
  product: Product;
  variant: ProductVariant;
  displayName: string;
  searchTerms: string[];
}

export default function NewOrderModal({ onClose, onSubmit, products }: Props) {
  const [userSearch, setUserSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [nif, setNif] = useState("");
  const [phone, setPhone] = useState("");
  const [campus, setCampus] = useState<Campus | "">("");
  const [notes, setNotes] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userHighlightIndex, setUserHighlightIndex] = useState(0);
  const [productHighlightIndex, setProductHighlightIndex] = useState(0);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const userInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  const formatVariantName = (productName: string, options: Record<string, string>) => {
    const values = Object.values(options);
    return values.length > 0 ? `${productName} - ${values.join(" | ")}` : productName;
  };

  const campusOptions = [
    { id: Campus._Alameda, label: "Alameda" },
    { id: Campus._Taguspark, label: "Taguspark" },
  ];

  const productVariants = useMemo(() => {
    const variants: ProductWithVariant[] = [];

    products.forEach((product) => {
      if (product.variants?.length > 0) {
        product.variants.forEach((v) => {
          const displayName = formatVariantName(product.name, v.options);
          const searchTerms = [
            product.name.toLowerCase(),
            ...Object.values(v.options).map((val) => val.toLowerCase()),
          ];

          variants.push({ product, variant: v, displayName, searchTerms });
        });
      } else {
        variants.push({
          product,
          variant: { id: 0, label: "", options: {}, price_modifier: 0, active: true },
          displayName: product.name,
          searchTerms: [product.name.toLowerCase()],
        });
      }
    });

    return variants;
  }, [products]);

  const userFuse = useMemo(() => {
    if (!allUsers.length) return null;
    return new Fuse(allUsers, {
      keys: ["istid", "name", "email"],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [allUsers]);

  const productFuse = useMemo(() => {
    return new Fuse(productVariants, {
      keys: [
        { name: "product.name", weight: 3 },
        { name: "displayName", weight: 2 },
        { name: "searchTerms", weight: 2 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
    });
  }, [productVariants]);

  const filteredUsers = useMemo(() => {
    if (!userSearch) return [];
    if (!userFuse) return [];

    const exactMatch = allUsers.filter((u) =>
      u.istid.toLowerCase().includes(userSearch.toLowerCase())
    );
    if (exactMatch.length) return exactMatch.slice(0, 10);

    return userFuse
      .search(userSearch)
      .map((r) => r.item)
      .slice(0, 10);
  }, [userFuse, userSearch, allUsers]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    return productFuse
      .search(productSearch)
      .map((r) => r.item)
      .slice(0, 15);
  }, [productFuse, productSearch]);

  const shouldShowCreateUser = useMemo(() => {
    if (userSearch.length < 3) return false;
    if (allUsers.some((u) => u.istid.toLowerCase() === userSearch.toLowerCase())) return false;
    return (
      /^ist\d+$/i.test(userSearch.trim()) || (filteredUsers.length === 0 && userSearch.length >= 5)
    );
  }, [userSearch, allUsers, filteredUsers]);

  useEffect(() => {
    if (usersLoaded) return;
    fetch("/api/admin/users")
      .then((res) => (res.ok ? res.json() : []))
      .then((users) => {
        setAllUsers(users);
        setUsersLoaded(true);
      })
      .catch(console.error);
  }, [usersLoaded]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showCreateUser) {
        setShowCreateUser(false);
      } else {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(target) &&
        userInputRef.current &&
        !userInputRef.current.contains(target)
      ) {
        setShowUserDropdown(false);
      }
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(target) &&
        productInputRef.current &&
        !productInputRef.current.contains(target)
      ) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, showCreateUser]);

  const handleKeyNav = <T,>(
    e: React.KeyboardEvent,
    items: T[],
    highlightIdx: number,
    setHighlight: (_i: number) => void,
    onSelect: (_item: T) => void
  ) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight(Math.min(highlightIdx + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight(Math.max(highlightIdx - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const item = items[highlightIdx];
      if (item !== undefined) onSelect(item);
    } else if (e.key === "Escape") {
      e.preventDefault();
    }
  };

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setUserSearch(`${user.istid} - ${user.name}`);
    setShowUserDropdown(false);
  };

  const selectProduct = (option: ProductWithVariant) => {
    const existingIdx = selectedProducts.findIndex(
      (p) => p.product.id === option.product.id && p.variant.id === option.variant.id
    );

    if (existingIdx >= 0) {
      const updated = [...selectedProducts];
      updated[existingIdx].quantity++;
      setSelectedProducts(updated);
    } else {
      setSelectedProducts([
        ...selectedProducts,
        {
          product: option.product,
          variant: { id: option.variant.id, label: option.displayName },
          quantity: 1,
        },
      ]);
    }

    setProductSearch("");
    setShowProductDropdown(false);
    productInputRef.current?.focus();
  };

  const removeProduct = (idx: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!selectedUser || !selectedProducts.length) {
      setError("Por favor, selecione um utilizador e pelo menos um produto.");
      return;
    }
    if (!campus) {
      setError("Por favor, selecione o campus.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_istid: selectedUser.istid,
          customer_name: selectedUser.name,
          customer_email: selectedUser.email,
          customer_phone: phone || undefined,
          customer_nif: nif || undefined,
          campus: campus || undefined,
          payment_method: "in-person",
          notes: notes || undefined,
          items: selectedProducts.map((item) => ({
            product_id: item.product.id,
            variant_id: item.variant.id || undefined,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create order");
      }

      onSubmit?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleUserCreated = (newUser: User) => {
    setAllUsers([...allUsers, newUser]);
    setSelectedUser(newUser);
    setUserSearch(`${newUser.istid} - ${newUser.name}`);
    setShowCreateUser(false);
  };

  if (showCreateUser) {
    return (
      <CreateNewUserModal
        onClose={() => setShowCreateUser(false)}
        onSubmit={handleUserCreated}
        initialIstId={userSearch}
      />
    );
  }

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose} type="button">
          <MdClose size={24} />
        </button>

        <h2>Nova Encomenda</h2>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleConfirm}>
          <div className={styles.formGroup}>
            <label>User</label>
            <div className={styles.searchWrapper}>
              <MdSearch className={styles.searchIcon} />
              <input
                ref={userInputRef}
                type="text"
                placeholder="Search by istid...."
                value={selectedUser ? `${selectedUser.istid} - ${selectedUser.name}` : userSearch}
                onChange={(e) => {
                  if (selectedUser) {
                    setSelectedUser(null);
                    setUserSearch("");
                  } else {
                    setUserSearch(e.target.value);
                    setShowUserDropdown(e.target.value.length > 0);
                    setUserHighlightIndex(0);
                  }
                }}
                onKeyDown={(e) =>
                  handleKeyNav(
                    e,
                    [...filteredUsers, ...(shouldShowCreateUser ? [null] : [])],
                    userHighlightIndex,
                    setUserHighlightIndex,
                    (item) => {
                      if (item) selectUser(item);
                      else setShowCreateUser(true);
                    }
                  )
                }
                className={styles.input}
                disabled={isSubmitting}
              />
              {selectedUser && (
                <button
                  className={styles.clearButton}
                  onClick={() => {
                    setSelectedUser(null);
                    setUserSearch("");
                    userInputRef.current?.focus();
                  }}
                  type="button">
                  <MdClose size={18} />
                </button>
              )}

              {showUserDropdown && !selectedUser && userSearch && (
                <div className={styles.dropdown} ref={userDropdownRef}>
                  {filteredUsers.map((user, idx) => (
                    <div
                      key={user.istid}
                      className={`${styles.dropdownItem} ${idx === userHighlightIndex ? styles.highlighted : ""}`}
                      onClick={() => selectUser(user)}
                      onMouseEnter={() => setUserHighlightIndex(idx)}>
                      <div className={styles.dropdownItemTitle}>
                        {user.istid} - {user.name}
                      </div>
                    </div>
                  ))}
                  {shouldShowCreateUser && (
                    <div
                      className={`${styles.dropdownItem} ${filteredUsers.length === userHighlightIndex ? styles.highlighted : ""}`}
                      onClick={() => setShowCreateUser(true)}
                      onMouseEnter={() => setUserHighlightIndex(filteredUsers.length)}>
                      <div className={styles.dropdownItemTitle}>Utilizador não encontrado</div>
                      <div className={styles.dropdownItemSubtitle}>
                        Clique para criar novo utilizador
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Produtos</label>
            <div className={styles.searchWrapper}>
              <MdSearch className={styles.searchIcon} />
              <input
                ref={productInputRef}
                type="text"
                placeholder="Adicionar produtos..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductDropdown(e.target.value.length > 0);
                  setProductHighlightIndex(0);
                }}
                onKeyDown={(e) =>
                  handleKeyNav(
                    e,
                    filteredProducts,
                    productHighlightIndex,
                    setProductHighlightIndex,
                    selectProduct
                  )
                }
                className={styles.productInput}
                disabled={isSubmitting}
              />

              {showProductDropdown && productSearch && filteredProducts.length > 0 && (
                <div className={styles.dropdown} ref={productDropdownRef}>
                  {filteredProducts.map((option, idx) => (
                    <div
                      key={`${option.product.id}-${option.variant.id}`}
                      className={`${styles.dropdownItem} ${idx === productHighlightIndex ? styles.highlighted : ""}`}
                      onClick={() => selectProduct(option)}
                      onMouseEnter={() => setProductHighlightIndex(idx)}>
                      <div className={styles.dropdownItemTitle}>{option.displayName}</div>
                      <div className={styles.dropdownItemSubtitle}>
                        {option.product.price.toFixed(2)}€
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedProducts.length > 0 && (
              <div className={styles.productsList}>
                {selectedProducts.map((item, idx) => (
                  <div key={`${item.product.id}-${item.variant.id}`} className={styles.productItem}>
                    <span className={styles.productText}>
                      {item.quantity}x {item.variant.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeProduct(idx)}
                      className={styles.productRemoveBtn}
                      disabled={isSubmitting}>
                      <MdClose size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Campus</label>
              <select
                value={campus}
                onChange={(e) => setCampus(e.target.value as Campus)}
                className={styles.input}
                disabled={isSubmitting}
                required>
                <option value="">Selecionar campus</option>
                {campusOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>NIF (opcional)</label>
              <input
                type="text"
                placeholder="123456789"
                value={nif}
                onChange={(e) => setNif(e.target.value)}
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Telemóvel (opcional)</label>
            <input
              type="text"
              placeholder="999333111"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={styles.input}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Notas</label>
            <input
              type="text"
              placeholder="Notas"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={styles.input}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.buttonCancel}
              onClick={onClose}
              disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={styles.buttonSubmit} disabled={isSubmitting}>
              {isSubmitting ? "A criar..." : "Criar Encomenda"}
            </button>
          </div>
        </form>
        {showConfirm && (
          <ConfirmDialog
            open={showConfirm}
            message="Tem a certeza que deseja criar esta encomenda?"
            onConfirm={async () => {
              setShowConfirm(false);
              await handleSubmit();
            }}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </div>
    </div>
  );
}
