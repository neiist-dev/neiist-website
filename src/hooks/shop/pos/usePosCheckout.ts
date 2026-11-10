"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Alert } from "@neiist/ui";
import { CartItem, Product, ProductVariant } from "@/types/shop/product";
import { PosShift } from "@/types/shop/pos";
import { Order } from "@/types/shop/order";
import { PaymentMethod, RESERVATION } from "@/types/shop/payment";
import { User } from "@/types/user";
import { PosPaymentConfirmData } from "@/components/shop/pos/modals/PosPaymentModal";
import { CustomerProfile } from "@/components/shop/pos/PosCustomerSection";
import { settlePosOrderAction, settlePosOrdersBatchAction } from "@/actions/shop/orders";
import { getUserPendingOrdersAction } from "@/actions/shop/pos";
import { validateDiscount } from "@/utils/shop/discountUtils";
import { subtractMoney } from "@/utils/shop/moneyUtils";
import {
  getProductPosAvailability,
  upsertPosCartItem,
  updatePosCartItemQuantity,
} from "@/utils/shop/posUtils";
import { calculateCartSubtotal, toCartOrderItems } from "@/utils/shop/shopUtils";
import type { Dictionary } from "@/i18n/dictionaries";

interface UsePosCheckoutProps {
  products: Product[];
  initialPendingOrder?: Order | null;
  selectedStationId: string;
  activeShift: PosShift | null;
  canOverride?: boolean;
  dict: Dictionary["pos"];
}

export function usePosCheckout({
  products,
  initialPendingOrder,
  selectedStationId,
  activeShift,
  canOverride = false,
  dict,
}: UsePosCheckoutProps) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);

  const [customerNif, setCustomerNif] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("alameda");
  const [orderNotes, setOrderNotes] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [pendingOrderNumber, setPendingOrderNumber] = useState<string | null>(
    initialPendingOrder?.order_number ?? null
  );
  const hasNotifiedPendingOrderRef = useRef<string | null>(null);

  const [pendingOrdersPrompt, setPendingOrdersPrompt] = useState<Order[]>([]);
  const [loadedPendingOrders, setLoadedPendingOrders] = useState<Order[]>(
    initialPendingOrder ? [initialPendingOrder] : []
  );

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    discount_amount: number;
    discount_type?: "percentage" | "fixed";
    discount_value?: number;
  } | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  const loadPendingOrdersToCart = useCallback(
    (ordersToLoad: Order[], silentToast = false) => {
      if (ordersToLoad.length === 0) return;

      const loadedCart: CartItem[] = [];
      const orderNums: string[] = [];

      for (const ord of ordersToLoad) {
        orderNums.push(ord.order_number);
        for (const it of ord.items || []) {
          const prod = products.find((p) => p.id === it.product_id);
          if (prod) {
            const variant = prod.variants?.find((v) => v.id === it.variant_id) ?? null;
            loadedCart.push({
              product: prod,
              variantId: variant?.id,
              quantity: it.quantity,
            });
          }
        }
      }

      setCart(loadedCart);
      setLoadedPendingOrders(ordersToLoad);
      setPendingOrderNumber(orderNums.join(", "));

      const first = ordersToLoad[0];
      const firstIstid = first.user_istid;
      if (firstIstid) {
        setCustomer((prev) =>
          prev?.istid === firstIstid
            ? prev
            : {
                istid: firstIstid,
                name: first.customer_name || firstIstid,
                email: first.customer_email || "",
                phone: first.customer_phone || "",
                isGuest: false,
              }
        );
      } else if (first.customer_name) {
        setCustomer({
          istid: null,
          name: first.customer_name,
          email: first.customer_email || "",
          phone: first.customer_phone || "",
          isGuest: true,
        });
      }

      if (first.customer_nif) setCustomerNif(first.customer_nif);
      if (first.customer_phone) setCustomerPhone(first.customer_phone);
      if (first.campus) setSelectedCampus(first.campus);
      if (first.notes) setOrderNotes(first.notes);

      setPendingOrdersPrompt([]);

      if (!silentToast) {
        Alert.info(
          ordersToLoad.length === 1
            ? dict.alerts.reservation_loaded.replace("{number}", orderNums[0])
            : dict.alerts.reservations_loaded.replace("{numbers}", orderNums.join(", "))
        );
      }
    },
    [products, dict.alerts.reservation_loaded, dict.alerts.reservations_loaded]
  );

  // Initialize cart and customer when initialPendingOrder is provided
  useEffect(() => {
    if (!initialPendingOrder) return;
    loadPendingOrdersToCart([initialPendingOrder], true);

    if (hasNotifiedPendingOrderRef.current !== initialPendingOrder.order_number) {
      hasNotifiedPendingOrderRef.current = initialPendingOrder.order_number;
      Alert.info(
        dict.alerts.processing_pending.replace("{number}", initialPendingOrder.order_number)
      );
    }
  }, [initialPendingOrder, loadPendingOrdersToCart, dict.alerts.processing_pending]);

  const resetCheckoutFields = useCallback(() => {
    setPendingOrderNumber(null);
    setLoadedPendingOrders([]);
    setCart([]);
    setCustomer(null);
    setCustomerNif("");
    setCustomerPhone("");
    setOrderNotes("");
    setAppliedDiscount(null);
    setDiscountCodeInput("");
  }, []);

  const handleClearPendingOrder = () => {
    resetCheckoutFields();
    Alert.info(dict.alerts.reservation_discarded);
  };

  // Guest modal confirmation
  const handleConfirmGuest = (guest: { name: string; email: string; phone: string }) => {
    setCustomer({
      istid: null,
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      isGuest: true,
    });
    setCustomerPhone(guest.phone);
    setIsGuestModalOpen(false);
    Alert.success(dict.alerts.guest_selected.replace("{name}", guest.name));
  };

  const addToCart = useCallback(
    (product: Product, variant: ProductVariant | null) => {
      if (pendingOrderNumber) {
        Alert.error(dict.alerts.reservation_locked_cart);
        return;
      }

      const { isDeadlinePassed, isOutOfStock } = getProductPosAvailability(product);
      if (isDeadlinePassed && !canOverride) {
        Alert.error(dict.alerts.deadline_expired);
        return;
      }
      if (isOutOfStock && !canOverride) {
        Alert.error(dict.alerts.out_of_stock);
        return;
      }

      if (product.product_type === "event_ticket") {
        const existingTicket = cart.find((it) => it.product.product_type === "event_ticket");
        if (existingTicket) {
          Alert.error(dict.alerts.ticket_single);
          return;
        }
        if (cart.length > 0) {
          Alert.error(dict.alerts.ticket_mixed);
          return;
        }
      } else {
        const hasTicket = cart.some((it) => it.product.product_type === "event_ticket");
        if (hasTicket) {
          Alert.error(dict.alerts.ticket_locked);
          return;
        }
      }

      setCart((prev) => upsertPosCartItem(prev, product, variant));
    },
    [
      cart,
      pendingOrderNumber,
      canOverride,
      dict.alerts.reservation_locked_cart,
      dict.alerts.deadline_expired,
      dict.alerts.out_of_stock,
      dict.alerts.ticket_locked,
      dict.alerts.ticket_mixed,
      dict.alerts.ticket_single,
    ]
  );

  const updateQuantity = (index: number, delta: number) => {
    if (pendingOrderNumber) {
      Alert.error(dict.alerts.reservation_quantity_locked);
      return;
    }
    setCart((prev) => updatePosCartItemQuantity(prev, index, delta));
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotalAmount = useMemo(() => calculateCartSubtotal(cart), [cart]);

  const totalAmount = useMemo(() => {
    if (!appliedDiscount) return subtotalAmount;
    return Math.max(0, subtractMoney(subtotalAmount, appliedDiscount.discount_amount || 0));
  }, [subtotalAmount, appliedDiscount]);

  useEffect(() => {
    setAppliedDiscount(null);
  }, [cart, customer?.istid]);

  const handleApplyDiscount = async () => {
    const codeToValidate = discountCodeInput.trim().toUpperCase();
    if (!codeToValidate) return;
    if (cart.length === 0) {
      Alert.error(dict.alerts.discount_add_items);
      return;
    }
    setIsApplyingDiscount(true);
    try {
      const res = await validateDiscount({
        code: codeToValidate,
        cartItems: toCartOrderItems(cart),
        targetIstid: customer?.istid || null,
      });

      if (!res.valid) {
        Alert.error(res.error || dict.alerts.discount_invalid);
        return;
      }

      setAppliedDiscount({
        code: res.code || codeToValidate,
        discount_amount: res.discount_amount ?? 0,
        discount_type: res.discount_type,
        discount_value: res.discount_value,
      });
      Alert.success(dict.alerts.discount_applied.replace("{code}", res.code || codeToValidate));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : dict.alerts.discount_error;
      Alert.error(msg);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCodeInput("");
  };

  // Handle final payment submission from PosPaymentModal
  const handleConfirmOrderPayment = async (data: PosPaymentConfirmData) => {
    if (cart.length === 0) return;

    const effectiveOrderNumber = data.orderNumber || pendingOrderNumber;
    const isLoadedPending = loadedPendingOrders.length > 0 || Boolean(initialPendingOrder);

    if (isLoadedPending) {
      const ordersToSettle =
        loadedPendingOrders.length > 0
          ? loadedPendingOrders
          : initialPendingOrder
            ? [initialPendingOrder]
            : [];

      if (data.paymentStatus === "successful") {
        const orderNumbers = ordersToSettle.map((o) => o.order_number);
        const ref = data.reference || null;

        if (ordersToSettle.length > 1) {
          await settlePosOrdersBatchAction({
            orderNumbers,
            paymentMethod: data.method as PaymentMethod,
            paymentReference: ref,
            shiftId: activeShift?.id,
          });
          return {
            orderNumber: orderNumbers.join(", "),
            isReservation: false,
          };
        } else {
          const ord = ordersToSettle[0];
          await settlePosOrderAction({
            orderNumber: ord.order_number,
            paymentMethod: data.method as PaymentMethod,
            paymentReference: ref,
            shiftId: activeShift?.id,
          });

          return {
            orderNumber: ord.order_number,
            isReservation: false,
          };
        }
      } else {
        return {
          orderNumber: ordersToSettle.map((o) => o.order_number).join(", "),
          isReservation: true,
        };
      }
    }

    const isReservation = data.method === RESERVATION || data.paymentStatus === "pending";

    const payload = {
      order_number: effectiveOrderNumber || undefined,
      order_source: "pos",
      user_istid: customer?.istid || undefined,
      guest_checkout: customer?.isGuest || false,
      customer_name: customer?.name || (customer?.isGuest ? "Cliente Externo" : "Cliente POS"),
      customer_email: customer?.email || undefined,
      customer_phone: customerPhone || undefined,
      customer_nif: customerNif || undefined,
      campus: selectedCampus,
      notes: orderNotes || undefined,
      shift_id: activeShift?.id,
      station_id: selectedStationId,
      discount_code: appliedDiscount?.code || undefined,
      stock_override: canOverride,
      is_reservation: isReservation,
      payment_method: isReservation ? undefined : data.method,
      items: cart.map((it) => ({
        product_id: it.product.id,
        variant_id: it.variantId ?? null,
        quantity: it.quantity,
        deliver_now: !isReservation && data.paymentStatus === "successful",
      })),
      payment: isReservation
        ? undefined
        : {
            method: data.method,
            status: data.paymentStatus,
            reference: data.reference || undefined,
            shift_id: activeShift?.id,
          },
    };

    const res = await fetch("/api/shop/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.error || dict.payment.sale_error);
    }

    return {
      orderNumber: resData.order_number,
      isReservation,
    };
  };

  const handleFinishSale = () => {
    resetCheckoutFields();
    setIsPaymentModalOpen(false);
  };

  const handleSelectUser = async (u: User | null) => {
    if (u) {
      setCustomer({
        istid: u.istid,
        name: u.name,
        email: u.email,
        phone: u.phone || undefined,
        photo: u.photo,
        isGuest: false,
      });
      if (u.phone) setCustomerPhone(u.phone);

      if (!pendingOrderNumber) {
        try {
          const pendingOrders = await getUserPendingOrdersAction(u.istid);
          if (pendingOrders && pendingOrders.length > 0) {
            setPendingOrdersPrompt(pendingOrders);
          }
        } catch (err) {
          console.error("Error fetching pending orders for user:", err);
        }
      }
    } else {
      setCustomer(null);
    }
  };

  const pendingOrderNumbers = useMemo(
    () => loadedPendingOrders.map((o) => o.order_number),
    [loadedPendingOrders]
  );

  return {
    customer,
    setCustomer,
    isGuestModalOpen,
    setIsGuestModalOpen,
    customerNif,
    setCustomerNif,
    customerPhone,
    setCustomerPhone,
    selectedCampus,
    setSelectedCampus,
    orderNotes,
    setOrderNotes,
    cart,
    setCart,
    pendingOrderNumber,
    pendingOrderNumbers,
    pendingOrdersPrompt,
    setPendingOrdersPrompt,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    subtotalAmount,
    totalAmount,
    appliedDiscount,
    discountCodeInput,
    setDiscountCodeInput,
    isApplyingDiscount,
    handleApplyDiscount,
    handleRemoveDiscount,
    handleClearPendingOrder,
    loadPendingOrdersToCart,
    handleConfirmGuest,
    handleConfirmOrderPayment,
    handleFinishSale,
    handleSelectUser,
  };
}
