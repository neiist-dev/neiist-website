"use client";
import { useState, useEffect } from "react";
import CheckoutDoneOverlay from "@/components/shop/CheckoutDoneOverlay";
import styles from "@/styles/components/shop/CheckoutForm.module.css";
import { Campus, type CartItem, type PaymentMethod } from "@/types/shop";
import Image from "next/image";
import { getColorFromOptions, isColorKey } from "@/utils/shopUtils";
import { FaChevronDown } from "react-icons/fa";

interface CheckoutFormProps {
  user: {
    istid: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export default function CheckoutForm({ user }: CheckoutFormProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [campus, setCampus] = useState<Campus>(Campus._Alameda);
  const [payment, setPayment] = useState<PaymentMethod>("in-person");
  const [showTaxInfo, setShowTaxInfo] = useState(false);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);

  const [phone, setPhone] = useState(user.phone || "");
  const [nif, setNif] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem("cart") || "[]";
        setCart(JSON.parse(raw));
      } catch {
        setCart([]);
      }
    };
    load();
    window.addEventListener("cartUpdated", load);
    return () => window.removeEventListener("cartUpdated", load);
  }, []);

  const unitPrice = (item: CartItem) => {
    const variantModifier =
      item.variantId != null
        ? (item.product.variants.find((v) => v.id === item.variantId)?.price_modifier ?? 0)
        : 0;
    return item.product.price + variantModifier;
  };

  const total = cart.reduce((sum, item) => sum + unitPrice(item) * item.quantity, 0);
  const subtotal = total / 1.23; // Price without IVA
  const taxes = total - subtotal; // IVA amount (23% of subtotal)

  const apiItems = cart.map((item) => ({
    product_id: item.product.id,
    variant_id: item.variantId ?? undefined,
    quantity: item.quantity,
  }));

  const handleSubmit = async () => {
    if (!campus) {
      setError("Por favor, seleciona o campus.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_istid: user.istid,
          customer_name: user.name,
          customer_email: user.email,
          items: apiItems,
          campus,
          customer_nif: nif || undefined,
          notes: notes || undefined,
          payment_method: payment,
          payment_reference: undefined,
          customer_phone: user.phone || phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Erro ao submeter encomenda.");
      else {
        setOrderId(data.id);
      }
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && !orderId) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
        <p>O teu carrinho está vazio.</p>
      </div>
    );
  }

  const pickupOptions = [
    { id: Campus._Alameda, label: "Alameda" },
    { id: Campus._Taguspark, label: "Taguspark" },
  ] as const;

  const paymentOptions = [
    { id: "sumup", label: "Cartão" },
    { id: "in-person", label: "Presencial" },
  ] as const;

  return (
    <div className={styles.container}>
      <div className={styles.leftColumn}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>1. Informações Pessoais</h2>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Número de Telefone</label>
              <div className={styles.inputWithIcon}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+351 999 888 777"
                  className={styles.input}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>NIF (Opcional)</label>
              <input
                type="text"
                value={nif}
                onChange={(e) => setNif(e.target.value)}
                placeholder="123456789"
                className={styles.input}
              />
            </div>
          </div>
        </section>

        <div className={styles.divider} />
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Local de Entrega</h2>

          <div className={styles.radioGroup}>
            {pickupOptions.map((opt) => (
              <label key={opt.id} className={styles.radioOption}>
                <input
                  type="radio"
                  name="campus"
                  checked={campus === opt.id}
                  onChange={() => setCampus(opt.id)}
                  className={styles.radioInput}
                  required
                />
                <span className={styles.radioLabel}>{opt.label}</span>
              </label>
            ))}
          </div>
        </section>

        <div className={styles.divider} />

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Método de Pagamento</h2>

          <div className={styles.radioGroup}>
            {paymentOptions.map((opt) => (
              <label key={opt.id} className={styles.radioOption}>
                <input
                  type="radio"
                  name="payment"
                  checked={payment === opt.id}
                  onChange={() => setPayment(opt.id as PaymentMethod)}
                  className={styles.radioInput}
                />
                <span className={styles.radioLabel}>{opt.label}</span>
              </label>
            ))}
          </div>
        </section>

        <div className={styles.divider} />
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Notas (Opcional)</h2>
          <textarea
            className={styles.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Adicione notas sobre a sua encomenda..."
            rows={4}
          />
        </section>
        <button className={styles.checkoutButton} onClick={handleSubmit} disabled={loading}>
          {loading ? "A processar..." : "Finalizar Compra"}
        </button>

        {error && <div className={styles.errorMessage}>{error}</div>}
      </div>

      <div className={styles.rightColumn}>
        <div className={styles.summarySticky}>
          <h2 className={styles.summaryTitle}>Resumo da Encomenda</h2>
          <div className={styles.cartItems}>
            {cart.map((item, idx) => {
              const variantObj =
                item.variantId != null
                  ? item.product.variants.find((v) => v.id === item.variantId)
                  : null;

              const imageSrc =
                variantObj && Array.isArray(variantObj.images) && variantObj.images.length > 0
                  ? variantObj.images[0]
                  : item.product.images?.[0];
              const colorInfo = getColorFromOptions(
                variantObj?.options ?? undefined,
                variantObj?.label ?? undefined
              );
              return (
                <div
                  key={`${item.product.id}-${item.variantId ?? "default"}-${idx}`}
                  className={styles.cartItem}>
                  <div className={styles.productImage}>
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={item.product.name}
                        width={80}
                        height={80}
                        className={styles.productImg}
                      />
                    ) : (
                      <div className={styles.placeholderImage} />
                    )}
                  </div>
                  <div className={styles.productDetails}>
                    <div className={styles.productHeader}>
                      <h3>{item.product.name}</h3>
                      <span className={styles.productPrice}>
                        €{unitPrice(item).toFixed(2)} x {item.quantity}
                      </span>
                    </div>
                    <div className={styles.variantInfo}>
                      {colorInfo.hex && (
                        <span
                          className={styles.colorDot}
                          style={{ backgroundColor: colorInfo.hex }}
                          title={colorInfo.name || colorInfo.hex}
                        />
                      )}
                      {variantObj?.options &&
                        (() => {
                          const entries = Object.entries(variantObj.options);
                          const nonColorEntries = entries.filter(([k]) => !isColorKey(k));
                          return nonColorEntries.map(([k, v]) => (
                            <span className={styles.variantSize} key={k}>
                              {`${k.trim()}: ${v}`}
                            </span>
                          ));
                        })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.pricingSummary}>
            <div className={styles.priceLine}>
              <span>Subtotal</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.priceLine}>
              <span>IVA (23%)</span>
              <span>€{taxes.toFixed(2)}</span>
            </div>
            <div className={styles.priceDivider} />
            <div className={styles.totalLine}>
              <span>Total</span>
              <span>€{total.toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.expandableWrapper}>
            <div className={styles.expandSection}>
              <button
                className={styles.expandButton}
                onClick={() => setShowTaxInfo((v) => !v)}
                aria-expanded={showTaxInfo}>
                <span className={styles.expandText}>
                  Taxas incluídas. Entrega calculada no checkout.
                </span>
                <FaChevronDown
                  className={`${styles.expandIcon} ${showTaxInfo ? styles.expanded : ""}`}
                />
              </button>
              {showTaxInfo && (
                <div className={styles.expandContent}>
                  As taxas são calculadas automaticamente com base na sua localização.
                </div>
              )}
            </div>
            <div className={styles.expandSection}>
              <button
                className={styles.expandButton}
                onClick={() => setShowDeliveryInfo((v) => !v)}
                aria-expanded={showDeliveryInfo}>
                <span className={styles.expandText}>Entrega estimada: 15-20 dias úteis</span>
                <FaChevronDown
                  className={`${styles.expandIcon} ${showDeliveryInfo ? styles.expanded : ""}`}
                />
              </button>
              {showDeliveryInfo && (
                <div className={styles.expandContent}>
                  O prazo de entrega pode variar conforme o local de levantamento escolhido.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {orderId !== null && <CheckoutDoneOverlay orderId={orderId} paymentMethod={payment} />}
    </div>
  );
}
