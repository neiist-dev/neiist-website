"use client";

import { useEffect } from "react";
import { Alert } from "@neiist/ui";
import { ENABLE_SUMUP_MOBILE_BRIDGE } from "@/types/shop/sumup";

interface UseSumUpBridgeReturnOptions {
  successMessage: string;
  failedMessage: string;
  onSuccess?: (_orderNumber: string) => void;
}

export function useSumUpBridgeReturn({
  successMessage,
  failedMessage,
  onSuccess,
}: UseSumUpBridgeReturnOptions): void {
  useEffect(() => {
    if (!ENABLE_SUMUP_MOBILE_BRIDGE) return;

    const params = new URLSearchParams(window.location.search);
    const bridgeStatus = params.get("bridge_status");
    if (!bridgeStatus) return;

    const order = params.get("order") || "";
    const bridgeMessage = params.get("bridge_message");

    if (bridgeStatus === "success") {
      Alert.success(successMessage.replace("{number}", order));
      onSuccess?.(order);
    } else if (bridgeStatus === "failed") {
      Alert.error(bridgeMessage || failedMessage);
    }

    params.delete("bridge_status");
    params.delete("order");
    params.delete("bridge_message");
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }, [failedMessage, onSuccess, successMessage]);
}
