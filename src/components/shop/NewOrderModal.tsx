"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MdClose, MdSearch, MdChevronRight, MdChevronLeft } from "react-icons/md";
import Fuse from "fuse.js";
import CreateNewUserModal from "@/components/shop/CreateNewUserModal";
import styles from "@/styles/components/shop/NewOrderModal.module.css";
import type { User } from "@/types/user";
import { Campus, type Product, type ProductVariant } from "@/types/shop";
import { isColorKey, splitNameHex } from "@/utils/shopUtils";
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

interface CascadeState {
  product: Product;
  optionKeys: string[];
  selections: Record<string, string>;
}

const CAMPUS_OPTIONS = [
  { id: Campus._Alameda, label: "Alameda" },
  { id: Campus._Taguspark, label: "Taguspark" },
];

const displayValue = (key: string, val: string) => {
  if (!isColorKey(key)) return val;
  const { name, hex } = splitNameHex(val);
  return name || hex || val;
};

const variantLabel = (name: string, options: Record<string, string>) => {
  const values = Object.entries(options).map(([k, v]) => displayValue(k, v));
  return values.length ? `${name} - ${values.join(" | ")}` : name;
};

const getOptionKeys = (product: Product) =>
  product.variants?.length ? Object.keys(product.variants[0].options) : [];

const getValuesForKey = (product: Product, selections: Record<string, string>): string[] => {
  const keys = getOptionKeys(product);
  const nextKey = keys[Object.keys(selections).length];
  if (!nextKey) return [];
  return Array.from(
    new Set(
      product.variants
        .filter((v) => Object.entries(selections).every(([k, val]) => v.options[k] === val))
        .map((v) => v.options[nextKey])
    )
  );
};

const resolveVariant = (
  product: Product,
  selections: Record<string, string>
): ProductVariant | null => {
  const keys = getOptionKeys(product);
  if (Object.keys(selections).length < keys.length) return null;
  return (
    product.variants.find((v) =>
      Object.entries(selections).every(([k, val]) => v.options[k] === val)
    ) ?? null
  );
};

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
  const [userHighlight, setUserHighlight] = useState(0);
  const [productHighlight, setProductHighlight] = useState(0);
  const [cascade, setCascade] = useState<CascadeState | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const userInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  const uniqueProducts = useMemo(
    () => Array.from(new Map(products.map((p) => [p.id, p])).values()),
    [products]
  );

  const productFuse = useMemo(
    () =>
      new Fuse(uniqueProducts, {
        keys: ["name", "category"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [uniqueProducts]
  );

  const filteredProducts = useMemo(
    () =>
      (productSearch ? productFuse.search(productSearch).map((r) => r.item) : uniqueProducts).slice(
        0,
        15
      ),
    [productFuse, productSearch, uniqueProducts]
  );

  const userFuse = useMemo(
    () =>
      allUsers.length
        ? new Fuse(allUsers, {
            keys: ["istid", "name", "email"],
            threshold: 0.3,
            ignoreLocation: true,
          })
        : null,
    [allUsers]
  );

  const filteredUsers = useMemo(() => {
    if (!userSearch || !userFuse) return [];
    const exact = allUsers.filter((u) => u.istid.toLowerCase().includes(userSearch.toLowerCase()));
    return (exact.length ? exact : userFuse.search(userSearch).map((r) => r.item)).slice(0, 10);
  }, [userFuse, userSearch, allUsers]);

  const showCreateUserOption = useMemo(
    () =>
      userSearch.length >= 3 &&
      !allUsers.some((u) => u.istid.toLowerCase() === userSearch.toLowerCase()) &&
      (/^ist\d+$/i.test(userSearch.trim()) ||
        (filteredUsers.length === 0 && userSearch.length >= 5)),
    [userSearch, allUsers, filteredUsers]
  );

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
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showCreateUser) setShowCreateUser(false);
      else onClose();
    };
    const onClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        userDropdownRef.current?.contains(t) === false &&
        userInputRef.current?.contains(t) === false
      )
        setShowUserDropdown(false);
      if (
        productDropdownRef.current?.contains(t) === false &&
        productInputRef.current?.contains(t) === false
      )
        setShowProductDropdown(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [onClose, showCreateUser]);

  const navigate = <T,>(
    e: React.KeyboardEvent,
    items: T[],
    highlight: number,
    setHighlight: (_i: number) => void,
    onSelect: (_item: T) => void
  ) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight(Math.min(highlight + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight(Math.max(highlight - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const item = items[highlight];
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

  const addProduct = (product: Product, variant: ProductVariant) => {
    const label = variantLabel(product.name, variant.options);
    setSelectedProducts((prev) => {
      const idx = prev.findIndex((p) => p.product.id === product.id && p.variant.id === variant.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product, variant: { id: variant.id, label }, quantity: 1 }];
    });
    setProductSearch("");
    setShowProductDropdown(false);
    productInputRef.current?.focus();
  };

  const openCascade = (product: Product) => {
    const keys = getOptionKeys(product);
    if (!keys.length) {
      addProduct(product, { id: 0, label: "", options: {}, price_modifier: 0, active: true });
      return;
    }
    setCascade({ product, optionKeys: keys, selections: {} });
    setProductHighlight(0);
  };

  const selectCascadeValue = (value: string) => {
    if (!cascade) return;
    const { product, optionKeys, selections } = cascade;
    const key = optionKeys[Object.keys(selections).length];
    const newSelections = { ...selections, [key]: value };
    const variant = resolveVariant(product, newSelections);
    if (variant) {
      addProduct(product, variant);
      setCascade(null);
    } else {
      setCascade({ product, optionKeys, selections: newSelections });
      setProductHighlight(0);
    }
  };

  const cascadeBack = () => {
    if (!cascade) return;
    const selectionKeys = Object.keys(cascade.selections);
    if (!selectionKeys.length) {
      setCascade(null);
      return;
    }
    const next = { ...cascade.selections };
    delete next[selectionKeys[selectionKeys.length - 1]];
    setCascade({ ...cascade, selections: next });
    setProductHighlight(0);
  };

  const removeProduct = (idx: number) =>
    setSelectedProducts((prev) => prev.filter((_, i) => i !== idx));

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
      const res = await fetch("/api/shop/orders", {
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
          items: selectedProducts.map(({ product, variant, quantity }) => ({
            product_id: product.id,
            variant_id: variant.id || undefined,
            quantity,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
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

  const handleUserCreated = (user: User) => {
    setAllUsers((prev) => [...prev, user]);
    setSelectedUser(user);
    setUserSearch(`${user.istid} - ${user.name}`);
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setShowConfirm(true);
          }}>
          <div className={styles.formGroup}>
            <label>User</label>
            <div className={styles.searchWrapper}>
              <MdSearch className={styles.searchIcon} />
              <input
                ref={userInputRef}
                type="text"
                placeholder="Search by istid..."
                value={selectedUser ? `${selectedUser.istid} - ${selectedUser.name}` : userSearch}
                onChange={(e) => {
                  if (selectedUser) {
                    setSelectedUser(null);
                    setUserSearch("");
                  } else {
                    setUserSearch(e.target.value);
                    setShowUserDropdown(e.target.value.length > 0);
                    setUserHighlight(0);
                  }
                }}
                onKeyDown={(e) =>
                  navigate(
                    e,
                    [...filteredUsers, ...(showCreateUserOption ? [null] : [])],
                    userHighlight,
                    setUserHighlight,
                    (item) => (item ? selectUser(item) : setShowCreateUser(true))
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
                      className={`${styles.dropdownItem} ${idx === userHighlight ? styles.highlighted : ""}`}
                      onClick={() => selectUser(user)}
                      onMouseEnter={() => setUserHighlight(idx)}>
                      <div className={styles.dropdownItemTitle}>
                        {user.istid} - {user.name}
                      </div>
                    </div>
                  ))}
                  {showCreateUserOption && (
                    <div
                      className={`${styles.dropdownItem} ${filteredUsers.length === userHighlight ? styles.highlighted : ""}`}
                      onClick={() => setShowCreateUser(true)}
                      onMouseEnter={() => setUserHighlight(filteredUsers.length)}>
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
                  setCascade(null);
                  setShowProductDropdown(true);
                  setProductHighlight(0);
                }}
                onFocus={() => {
                  setShowProductDropdown(true);
                  setProductHighlight(0);
                }}
                onKeyDown={(e) =>
                  cascade
                    ? navigate(
                        e,
                        getValuesForKey(cascade.product, cascade.selections),
                        productHighlight,
                        setProductHighlight,
                        selectCascadeValue
                      )
                    : navigate(
                        e,
                        filteredProducts,
                        productHighlight,
                        setProductHighlight,
                        openCascade
                      )
                }
                className={styles.productInput}
                disabled={isSubmitting}
              />

              {showProductDropdown && !cascade && filteredProducts.length > 0 && (
                <div className={styles.dropdown} ref={productDropdownRef}>
                  {filteredProducts.map((product, idx) => (
                    <div
                      key={product.id}
                      className={`${styles.dropdownItem} ${idx === productHighlight ? styles.highlighted : ""}`}
                      onClick={() => openCascade(product)}
                      onMouseEnter={() => setProductHighlight(idx)}>
                      <div className={styles.dropdownItemTitle}>
                        {product.name}
                        {product.variants?.length > 0 && (
                          <MdChevronRight className={styles.cascadeArrow} />
                        )}
                      </div>
                      <div className={styles.dropdownItemSubtitle}>{product.price.toFixed(2)}€</div>
                    </div>
                  ))}
                </div>
              )}

              {cascade &&
                (() => {
                  const currentKeyIdx = Object.keys(cascade.selections).length;
                  const currentKey = cascade.optionKeys[currentKeyIdx];
                  const values = getValuesForKey(cascade.product, cascade.selections);
                  return (
                    <div className={styles.dropdown} ref={productDropdownRef}>
                      <div className={styles.cascadeHeader} onClick={cascadeBack}>
                        <MdChevronLeft size={18} />
                        <span className={styles.cascadeHeaderText}>
                          {cascade.product.name}
                          {Object.entries(cascade.selections).map(([key, val]) => (
                            <span key={key} className={styles.cascadeCrumb}>
                              {" "}
                              › {displayValue(key, val)}
                            </span>
                          ))}
                        </span>
                      </div>
                      <div className={styles.cascadeLevelLabel}>{currentKey}</div>
                      {values.map((val, idx) => {
                        const isColor = isColorKey(currentKey);
                        const { name: colorName, hex } = isColor
                          ? splitNameHex(val)
                          : { name: val, hex: "" };
                        return (
                          <div
                            key={val}
                            className={`${styles.dropdownItem} ${idx === productHighlight ? styles.highlighted : ""}`}
                            onClick={() => selectCascadeValue(val)}
                            onMouseEnter={() => setProductHighlight(idx)}>
                            <div className={styles.dropdownItemTitle}>
                              <span className={styles.dropdownItemTitleContent}>
                                {isColor && hex && (
                                  <span
                                    className={styles.colorSwatch}
                                    style={{ background: hex }}
                                  />
                                )}
                                {colorName || val}
                              </span>
                              {currentKeyIdx < cascade.optionKeys.length - 1 && (
                                <MdChevronRight className={styles.cascadeArrow} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
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
                {CAMPUS_OPTIONS.map((opt) => (
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
