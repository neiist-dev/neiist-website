"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MdClose, MdSearch, MdChevronRight, MdChevronLeft } from "react-icons/md";
import Fuse from "fuse.js";
import CreateNewUserModal from "@/components/shop/CreateNewUserModal";
import styles from "@/styles/components/shop/NewOrderModal.module.css";
import { checkRoles, UserRole, type User } from "@/types/user";
import { Order, Campus } from "@/types/shop/order";
import { Product, ProductVariant } from "@/types/shop/product";
import {
  getOrderKindFromItems,
  getOrderKindFromCategory,
  getOrderKindRules,
} from "@/utils/shop/orderKindUtils";
import { isColorKey, splitNameHex } from "@/utils/shop/shopUtils";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import InputTextDialog from "@/components/layout/InputTextDialog";
import { useUser } from "@/context/UserContext";

interface Props {
  onClose: () => void;
  onSubmit?: (_order?: Order) => void;
  products: Product[];
  mode?: "create" | "edit";
  orderToEdit?: Order | null;
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

const normalizeOptionValue = (value?: string) => (value ? value.replace(/["'\\]/g, "").trim() : "");

const variantLabel = (name: string, options: Record<string, string>) => {
  const values = Object.entries(options).map(([k, v]) => displayValue(k, v));
  return values.length ? `${name} - ${values.join(" | ")}` : name;
};

const getOptionKeys = (product: Product) => {
  const keys: string[] = [];
  const seen = new Set<string>();

  product.variants.forEach((variant) => {
    Object.keys(variant.options ?? {}).forEach((key) => {
      if (seen.has(key)) return;
      seen.add(key);
      keys.push(key);
    });
  });

  return keys;
};

const matchesSelections = (variant: ProductVariant, selections: Record<string, string>) =>
  Object.entries(selections).every(
    ([key, value]) => normalizeOptionValue(variant.options?.[key]) === normalizeOptionValue(value)
  );

const getValuesForKey = (product: Product, selections: Record<string, string>): string[] => {
  const keys = getOptionKeys(product);
  const nextKey = keys[Object.keys(selections).length];
  if (!nextKey) return [];
  return Array.from(
    new Set(
      product.variants
        .filter((variant) => matchesSelections(variant, selections))
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

  return product.variants.find((variant) => matchesSelections(variant, selections)) ?? null;
};

const buildFallbackUser = (order: Order): User => ({
  istid: order.user_istid ?? "",
  name: order.customer_name || "",
  email: order.customer_email || "",
  alternativeEmail: null,
  alternativeEmailVerified: true,
  phone: order.customer_phone ?? null,
  photo: "",
  courses: [],
  roles: [],
});

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export default function NewOrderModal({
  onClose,
  onSubmit,
  products,
  mode = "create",
  orderToEdit = null,
}: Props) {
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
  const [showGuestConfirm, setShowGuestConfirm] = useState(false);
  const [showGuestNameInput, setShowGuestNameInput] = useState(false);
  const [showGuestEmailInput, setShowGuestEmailInput] = useState(false);
  const [showGuestPhoneInput, setShowGuestPhoneInput] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const { user } = useUser();
  const isAdmin = checkRoles(user, [UserRole._ADMIN]);
  const STOCK_OVERRIDE_ERRORS = [
    "O prazo de encomenda do produto ja terminou",
    "Stock insuficiente para a variante selecionada",
    "Stock insuficiente para o produto selecionado",
  ];
  const [showStockOverrideConfirm, setShowStockOverrideConfirm] = useState(false);
  const [stockOverrideMessage, setStockOverrideMessage] = useState<string | null>(null);

  const userInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  const uniqueProducts = useMemo(
    () =>
      Array.from(
        new Map(
          products
            .filter((product) =>
              getOrderKindRules(
                getOrderKindFromCategory(product.category),
                "pos"
              ).allowedSources.includes("pos")
            )
            .map((p) => [p.id, p])
        ).values()
      ),
    [products]
  );

  const selectedOrderClassification = useMemo(
    () => getOrderKindFromItems(selectedProducts.map((item) => item.product)),
    [selectedProducts]
  );

  const isUserRequiredForSelectedOrder = getOrderKindRules(
    selectedOrderClassification.orderKind,
    "pos"
  ).requiresUserAssignment;

  const productFuse = useMemo(
    () =>
      new Fuse(uniqueProducts, {
        keys: [
          { name: "name", weight: 3 },
          { name: "category", weight: 1 },
        ],
        threshold: 0.25,
        ignoreLocation: true,
        minMatchCharLength: 2,
        shouldSort: true,
      }),
    [uniqueProducts]
  );

  const filteredProducts = useMemo(
    () =>
      (productSearch
        ? productFuse.search(productSearch).map((result) => result.item)
        : uniqueProducts
      ).slice(0, 15),
    [productFuse, productSearch, uniqueProducts]
  );

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return [];

    const rawQuery = userSearch.trim();
    const normalizedQuery = normalizeText(rawQuery);
    const istWithPrefix = /^ist\d+$/i.test(rawQuery);
    const digitsOnly = /^\d{5,10}$/.test(rawQuery);

    if (istWithPrefix || digitsOnly) {
      const digits = digitsOnly ? rawQuery : rawQuery.replace(/[^0-9]/g, "");
      return allUsers
        .filter((user) => (user.istid || "").replace(/[^0-9]/g, "") === digits)
        .slice(0, 10);
    }

    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

    const matches = allUsers
      .map((user) => {
        const name = normalizeText(user.name || "");
        const nameTokens = name.split(/\s+/).filter(Boolean);
        for (const qtok of queryTokens) {
          const found = nameTokens.some((nameToken) => nameToken.startsWith(qtok));
          if (!found) return null;
        }
        return user;
      })
      .filter(Boolean) as User[];

    return matches.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 10);
  }, [userSearch, allUsers]);

  const showCreateUserOption = useMemo(
    () =>
      userSearch.length >= 3 &&
      (/^ist\d+$/i.test(userSearch.trim()) ||
        /^\d{5,10}$/.test(userSearch.trim()) ||
        (filteredUsers.length === 0 && userSearch.length >= 5)) &&
      filteredUsers.length === 0,
    [userSearch, filteredUsers]
  );

  const isEditMode = mode === "edit" && !!orderToEdit;

  useEffect(() => {
    if (!isEditMode || !orderToEdit) return;

    const fallbackUser = buildFallbackUser(orderToEdit);
    setSelectedUser(fallbackUser);
    setUserSearch(
      fallbackUser.istid ? `${fallbackUser.istid} - ${fallbackUser.name}` : fallbackUser.name
    );

    setNif(orderToEdit.customer_nif ?? "");
    setPhone(orderToEdit.customer_phone ?? "");
    setCampus((orderToEdit.campus as Campus) ?? "");
    setNotes(orderToEdit.notes ?? "");

    const mapped = orderToEdit.items
      .map((item) => {
        const product = uniqueProducts.find((p) => p.id === item.product_id);
        if (!product) return null;

        const existingVariant = product.variants.find((v) => v.id === item.variant_id);
        const fallbackOptions = item.variant_options ?? {};
        const variant = existingVariant ?? {
          id: item.variant_id ?? 0,
          label: item.variant_label ?? "",
          options: fallbackOptions,
          price_modifier: Number((item.unit_price - product.price).toFixed(2)),
          active: true,
        };

        const label = variantLabel(product.name, variant.options ?? {});
        return {
          product,
          variant: { id: variant.id, label: label || product.name },
          quantity: item.quantity,
        };
      })
      .filter(Boolean) as SelectedProduct[];

    setSelectedProducts(mapped);
  }, [isEditMode, orderToEdit, uniqueProducts]);

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

  const closeProductPicker = () => {
    setProductSearch("");
    setShowProductDropdown(false);
    setCascade(null);
    setProductHighlight(0);
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
    closeProductPicker();
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

  type SubmitResult =
    | { status: "success"; order: Order | null }
    | { status: "stock_override"; message: string }
    | { status: "error"; message: string };

  const submitOrder = async (stockOverride = false): Promise<SubmitResult> => {
    const guestCheckout = !selectedUser;
    const customerName = selectedUser?.name ?? guestName.trim();
    const customerEmail = selectedUser?.email ?? guestEmail.trim();

    const payload = {
      user_istid: !isEditMode ? selectedUser?.istid : undefined,
      customer_name: !isEditMode ? customerName || undefined : undefined,
      customer_email: !isEditMode ? customerEmail || undefined : undefined,
      customer_phone: !isEditMode ? phone || undefined : undefined,
      customer_nif: nif || undefined,
      campus: campus || undefined,
      notes: notes || undefined,
      stock_override: stockOverride,
      payment_method: !isEditMode ? "cash" : undefined,
      guest_checkout: !isEditMode ? guestCheckout : undefined,
      items: selectedProducts.map(({ product, variant, quantity }) => ({
        product_id: product.id,
        variant_id: variant.id || undefined,
        quantity,
      })),
      order_source: "pos",
    };

    const endpoint =
      isEditMode && orderToEdit ? `/api/shop/orders/${orderToEdit.id}` : "/api/shop/orders";
    const method = isEditMode ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const errorMessage =
        data?.error || (isEditMode ? "Failed to update order" : "Failed to create order");

      if (!stockOverride && isAdmin && STOCK_OVERRIDE_ERRORS.includes(errorMessage)) {
        return { status: "stock_override", message: errorMessage };
      }

      return { status: "error", message: errorMessage };
    }

    const order = (await res.json().catch(() => null)) as Order | null;
    return { status: "success", order };
  };

  const handleSubmit = async (stockOverride = false) => {
    if (!selectedProducts.length) {
      // TODO: (ERROR)
      setError("Por favor, selecione pelo menos um produto.");
      return;
    }
    if (!isEditMode && !campus) {
      // TODO: (ERROR)
      setError("Por favor, selecione o campus.");
      return;
    }
    if (selectedOrderClassification.isMixedInvalid) {
      setError("Este pedido nao pode misturar categorias especiais com outras categorias.");
      return;
    }

    const guestCheckout = !selectedUser;
    if (guestCheckout) {
      if (isUserRequiredForSelectedOrder && !guestName.trim()) {
        setError("Por favor, indique o nome do cliente.");
        return;
      }
      if (isUserRequiredForSelectedOrder && !guestEmail.trim()) {
        setError("Por favor, indique o email do cliente.");
        return;
      }
      if (isUserRequiredForSelectedOrder && !phone.trim()) {
        setError("Por favor, indique o telemóvel do cliente.");
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const orderResponse = await submitOrder(stockOverride);

      if (orderResponse.status === "stock_override") {
        setStockOverrideMessage(orderResponse.message);
        setShowStockOverrideConfirm(true);
        return;
      }

      if (orderResponse.status === "error") {
        // TODO: (ERROR)
        setError(orderResponse.message);
        return;
      }

      const nextOrder = orderResponse.order ?? undefined;
      onSubmit?.(nextOrder);
      onClose();
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

  const startGuestFlow = () => {
    setError(null);
    setShowGuestConfirm(false);
    if (!isUserRequiredForSelectedOrder) {
      setShowConfirm(true);
      return;
    }

    setShowGuestNameInput(true);
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

        <h2>{isEditMode ? "Editar Encomenda" : "Nova Encomenda"}</h2>

        {/* TODO: replace this inline error with a toast and remove this fallback once Sonner is implemented here. */}
        {error && <div className={styles.error}>{error}</div>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedUser) {
              setShowConfirm(true);
            } else {
              setShowGuestConfirm(true);
            }
          }}>
          {!isEditMode && (
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
                  disabled={isSubmitting || isEditMode}
                />
                {selectedUser && !isEditMode && (
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
                    {showCreateUserOption && !isEditMode && (
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
          )}

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
                            key={`${currentKeyIdx}-${idx}-${val}`}
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

          {!isEditMode && (
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
          )}

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
              {isSubmitting
                ? isEditMode
                  ? "A guardar..."
                  : "A criar..."
                : isEditMode
                  ? "Guardar Encomenda"
                  : "Criar Encomenda"}
            </button>
          </div>
        </form>
        {showConfirm && (
          <ConfirmDialog
            open={showConfirm}
            message={
              isEditMode
                ? "Tem a certeza que deseja guardar as alterações da encomenda?"
                : "Tem a certeza que deseja criar esta encomenda?"
            }
            onConfirm={async () => {
              setShowConfirm(false);
              await handleSubmit();
            }}
            onCancel={() => setShowConfirm(false)}
          />
        )}
        {showGuestConfirm && (
          <ConfirmDialog
            open={showGuestConfirm}
            message="Tem a certeza que deseja vender esta encomenda como Guest?"
            onConfirm={startGuestFlow}
            onCancel={() => setShowGuestConfirm(false)}
          />
        )}
        {showGuestNameInput && (
          <InputTextDialog
            open={showGuestNameInput}
            title="Guest"
            label="Nome do cliente"
            initialValue={guestName}
            placeholder="Nome do cliente"
            onConfirm={(value) => {
              if (!value) {
                setError("Por favor, indique o nome do cliente.");
                return;
              }
              setGuestName(value);
              setShowGuestNameInput(false);
              setShowGuestEmailInput(true);
            }}
            onCancel={() => setShowGuestNameInput(false)}
          />
        )}
        {showGuestEmailInput && (
          <InputTextDialog
            open={showGuestEmailInput}
            title="Guest"
            label="Email do cliente"
            initialValue={guestEmail}
            placeholder="mail@example.com"
            type="email"
            onConfirm={(value) => {
              if (!value) {
                setError("Por favor, indique o email do cliente.");
                return;
              }
              setGuestEmail(value);
              setShowGuestEmailInput(false);
              setShowGuestPhoneInput(true);
            }}
            onCancel={() => setShowGuestEmailInput(false)}
          />
        )}
        {showGuestPhoneInput && (
          <InputTextDialog
            open={showGuestPhoneInput}
            title="Guest"
            label="Telemóvel do cliente"
            initialValue={phone}
            placeholder="+351 000 000 000"
            type="tel"
            onConfirm={(value) => {
              if (!value) {
                setError("Por favor, indique o telemóvel do cliente.");
                return;
              }
              setPhone(value);
              setShowGuestPhoneInput(false);
              setShowConfirm(true);
            }}
            onCancel={() => setShowGuestPhoneInput(false)}
          />
        )}
        {showStockOverrideConfirm && (
          <ConfirmDialog
            open={showStockOverrideConfirm}
            message={`Tem a certeza que deseja criar a encomenda à mesma?\n"${stockOverrideMessage}."`}
            onConfirm={async () => {
              setShowStockOverrideConfirm(false);
              setStockOverrideMessage(null);
              await handleSubmit(true);
            }}
            onCancel={() => {
              setShowStockOverrideConfirm(false);
              setStockOverrideMessage(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
