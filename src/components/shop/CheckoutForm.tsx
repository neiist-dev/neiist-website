"use client";
import { useEffect, useState } from "react";
import styles from "@/styles/components/shop/CheckoutForm.module.css";
import { FaTrash } from "react-icons/fa";
import Image from "next/image";
import { User } from "@/types/user";
import { CartItem } from "@/types/shop";
import CheckoutConfirmOverlay from "@/components/shop/CheckoutConfirmOverlay";
import CheckoutDoneOverlay from "@/components/shop/CheckoutDoneOverlay";

interface CheckoutFormProps {
  user: User;
}

export default function CheckoutForm({ user }: CheckoutFormProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [campus, setCampus] = useState<"Alameda" | "TagusPark">("Alameda");
  const [nif, setNif] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<"Dinheiro" | "MBWay">("Dinheiro");
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);

  useEffect(() => {
    const load = () => setCart(JSON.parse(localStorage.getItem("cart") || "[]"));
    load();
    window.addEventListener("cartUpdated", load);
    return () => window.removeEventListener("cartUpdated", load);
  }, []);

  const unitPrice = (item: CartItem) =>
    item.product.price +
    (item.variantId
      ? (item.product.variants.find((v) => v.id === item.variantId)?.price_modifier ?? 0)
      : 0);

  const updateQty = (i: number, d: number) => {
    setCart((prev) => {
      const next = prev.map((item, idx) =>
        idx === i ? { ...item, quantity: Math.max(1, item.quantity + d) } : item
      );
      localStorage.setItem("cart", JSON.stringify(next));
      setTimeout(() => window.dispatchEvent(new Event("cartUpdated")), 0);
      return next;
    });
  };

  const remove = (i: number) => {
    setCart((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      localStorage.setItem("cart", JSON.stringify(next));
      setTimeout(() => window.dispatchEvent(new Event("cartUpdated")), 0);
      return next;
    });
  };

  const clear = () => {
    setCart([]);
    localStorage.setItem("cart", "[]");
    setTimeout(() => window.dispatchEvent(new Event("cartUpdated")), 0);
  };

  const apiItems = cart.map((item) => ({
    product_id: item.product.id,
    variant_id: item.variantId,
    quantity: item.quantity,
  }));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        clear();
        setOrderId(data.id);
        setStep("done");
      }
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div
        className={styles.grid}
        style={step !== "form" ? { filter: "blur(1.5px)", pointerEvents: "none" } : {}}>
        <section>
          <h2 className={styles.title}>O teu Carrinho</h2>
          {cart.length === 0 ? (
            <div className={styles.muted}>O teu carrinho está vazio.</div>
          ) : (
            <ul className={styles.list}>
              {cart.map((item, i) => {
                const variantObj = item.variantId
                  ? item.product.variants.find((v) => v.id === item.variantId)
                  : undefined;
                const imageSrc =
                  variantObj && Array.isArray(variantObj.images) && variantObj.images.length > 0
                    ? variantObj.images[0]
                    : item.product.images[0];
                return (
                  <li key={i} className={styles.item}>
                    <Image
                      src={imageSrc}
                      alt={item.product.name}
                      width={64}
                      height={64}
                      className={styles.img}
                    />
                    <div className={styles.info}>
                      <strong>{item.product.name}</strong>
                      {variantObj && (
                        <div className={styles.variant}>
                          {variantObj.label ||
                            Object.entries(variantObj.options || {})
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ")}
                        </div>
                      )}
                      <span className={styles.price}>{unitPrice(item).toFixed(2)}€</span>
                      <div className={styles.row}>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          onClick={() => updateQty(i, -1)}
                          disabled={item.quantity <= 1}
                          aria-label="Diminuir quantidade">
                          –
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          onClick={() => updateQty(i, 1)}
                          aria-label="Aumentar quantidade">
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => remove(i)}
                      aria-label="Remover"
                      title="Remover">
                      <FaTrash />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <form
          className={styles.panel}
          onSubmit={(e) => {
            e.preventDefault();
            if (!campus.trim()) {
              setError("O campo Campus é obrigatório.");
              return;
            }
            setError(null);
            setStep("confirm");
          }}>
          <h2 className={styles.title}>Finalizar Compra</h2>

          <label>
            <div className={styles.label}>
              Campus <span style={{ color: "var(--danger)" }}>*</span>
            </div>
            <select
              className={styles.field}
              value={campus}
              onChange={(e) => setCampus(e.target.value as "Alameda" | "TagusPark")}
              required>
              <option value="Alameda">Alameda</option>
              <option value="TagusPark">TagusPark</option>
            </select>
          </label>

          <label>
            <div className={styles.label}>NIF (opcional)</div>
            <input
              className={styles.field}
              value={nif}
              onChange={(e) => setNif(e.target.value)}
              placeholder="NIF para fatura"
              inputMode="numeric"
              maxLength={9}
            />
          </label>

          {!user.phone && (
            <label>
              <div className={styles.label}>
                Telemóvel <span style={{ color: "var(--danger)" }}>*</span>
              </div>
              <input
                className={styles.field}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Número de telemóvel"
                inputMode="tel"
                maxLength={16}
                required
              />
            </label>
          )}

          <label>
            <div className={styles.label}>Notas (opcional)</div>
            <textarea
              className={styles.field}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas para a encomenda"
              rows={3}
            />
          </label>

          <div>
            <div className={styles.label}>Método de Pagamento</div>
            <div className={styles.row}>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name="payment"
                  value="Dinheiro"
                  checked={payment === "Dinheiro"}
                  onChange={() => setPayment("Dinheiro")}
                />
                Dinheiro (presencial)
              </label>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name="payment"
                  value="MBWay"
                  checked={payment === "MBWay"}
                  onChange={() => setPayment("MBWay")}
                />
                MBWay (presencial)
              </label>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? "A processar..." : "Submeter Encomenda"}
          </button>
        </form>
      </div>

      {step === "confirm" && (
        <CheckoutConfirmOverlay
          cart={cart}
          campus={campus}
          nif={nif}
          notes={notes}
          payment={payment}
          user={user}
          loading={loading}
          error={error}
          onBack={() => setStep("form")}
          onSubmit={handleSubmit}
        />
      )}

      {step === "done" && <CheckoutDoneOverlay orderId={orderId} />}
    </div>
  );
}
