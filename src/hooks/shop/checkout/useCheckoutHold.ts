"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@neiist/ui";
import { CHECKOUT_HOLD_TTL_SECONDS } from "@/types/redis";
import {
  CHECKOUT_HOLD_STORAGE_KEY,
  clearClientCart,
  discardCheckoutHold,
  toCartOrderItems,
} from "@/utils/shop/shopUtils";
import type { CartItem } from "@/types/shop/product";

interface HoldState {
  orderNumber: string;
  expiresAt: string;
  cartSignature: string;
}

interface ReserveResponse {
  orderNumber?: string;
  totalAmount?: number;
  expiresAt?: string;
  error?: string;
}

const inFlight = new Map<string, Promise<ReserveResponse>>();

const getCartSignature = (cart: CartItem[]) =>
  cart
    .map((i) => `${i.product.id}:${i.variantId ?? 0}:${i.quantity}`)
    .sort()
    .join("|");

const getSecondsLeft = (expiresAt: string) =>
  Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / 1000));

function getStoredHold(): HoldState | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_HOLD_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as HoldState) : null;
    return parsed?.orderNumber && parsed?.expiresAt && parsed?.cartSignature ? parsed : null;
  } catch {
    return null;
  }
}

function setStoredHold(hold: HoldState | null) {
  try {
    if (hold) sessionStorage.setItem(CHECKOUT_HOLD_STORAGE_KEY, JSON.stringify(hold));
    else sessionStorage.removeItem(CHECKOUT_HOLD_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

export function useCheckoutHold({
  cart,
  cartLoaded,
  isCompleted,
  expiredMessage,
  reserveErrorMessage,
  basePath,
}: {
  cart: CartItem[];
  cartLoaded: boolean;
  isCompleted: boolean;
  expiredMessage: string;
  reserveErrorMessage: string;
  basePath?: string;
}) {
  const router = useRouter();
  const [hold, setHold] = useState<HoldState | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(CHECKOUT_HOLD_TTL_SECONDS);
  const [isAcquiring, setIsAcquiring] = useState(false);
  const expiredRef = useRef(false);

  const cartSignature = useMemo(() => getCartSignature(cart), [cart]);
  const apiItems = useMemo(() => toCartOrderItems(cart), [cart]);

  const clearHold = useCallback(() => {
    setStoredHold(null);
    setHold(null);
  }, []);

  const expireAndRedirect = useCallback(
    (orderNumber?: string | null) => {
      if (expiredRef.current) return;
      expiredRef.current = true;
      clearHold();
      clearClientCart();
      if (orderNumber) void discardCheckoutHold(orderNumber);
      Alert.warning(expiredMessage);
      router.replace(`${basePath || ""}/shop`);
    },
    [clearHold, expiredMessage, basePath, router]
  );

  const callReserve = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/shop/checkout/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: apiItems, ...payload }),
      });
      const data = (await res.json().catch(() => ({}))) as ReserveResponse;
      if (res.status === 410) {
        expireAndRedirect(payload.orderNumber as string | undefined);
        throw new Error(data.error || expiredMessage);
      }
      if (!res.ok || !data.orderNumber || !data.expiresAt) {
        throw new Error(data.error || reserveErrorMessage);
      }
      const next: HoldState = {
        orderNumber: data.orderNumber,
        expiresAt: data.expiresAt,
        cartSignature,
      };
      setStoredHold(next);
      setHold(next);
      setRemainingSeconds(getSecondsLeft(next.expiresAt));
      return {
        orderNumber: next.orderNumber,
        totalAmount: data.totalAmount ?? 0,
      };
    },
    [apiItems, cartSignature, expireAndRedirect, expiredMessage, reserveErrorMessage]
  );

  useEffect(() => {
    if (!cartLoaded || isCompleted || cart.length === 0) return;

    let active = true;
    expiredRef.current = false;

    const stored = getStoredHold();
    const canResume =
      stored !== null &&
      stored.cartSignature === cartSignature &&
      Date.parse(stored.expiresAt) > Date.now();

    if (stored && !canResume) {
      void discardCheckoutHold(stored.orderNumber);
      setStoredHold(null);
    }

    const key = `${cartSignature}:${canResume ? stored.orderNumber : "new"}`;
    const promise =
      inFlight.get(key) ??
      callReserve(canResume ? { orderNumber: stored.orderNumber } : {}).finally(() => {
        inFlight.delete(key);
      });
    inFlight.set(key, promise);

    setIsAcquiring(true);
    promise
      .catch((err) => {
        if (!active) return;
        clearHold();
        Alert.error(err instanceof Error ? err.message : reserveErrorMessage);
        router.replace(`${basePath || ""}/shop`);
      })
      .finally(() => {
        if (active) setIsAcquiring(false);
      });

    return () => {
      active = false;
    };
  }, [
    cartLoaded,
    isCompleted,
    cart.length,
    cartSignature,
    callReserve,
    clearHold,
    reserveErrorMessage,
    basePath,
    router,
  ]);

  useEffect(() => {
    if (!hold || isCompleted) return;
    const tick = () => {
      const left = getSecondsLeft(hold.expiresAt);
      setRemainingSeconds(left);
      if (left <= 0) expireAndRedirect(hold.orderNumber);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [hold, isCompleted, expireAndRedirect]);

  const syncSession = useCallback(
    (fields: Record<string, unknown>) => {
      const orderNumber = hold?.orderNumber ?? getStoredHold()?.orderNumber;
      return callReserve({
        ...fields,
        orderNumber,
        requireExisting: Boolean(orderNumber),
      });
    },
    [hold?.orderNumber, callReserve]
  );

  return {
    hold,
    apiItems,
    remainingSeconds,
    isAcquiring,
    syncSession,
    clearHold,
  };
}
