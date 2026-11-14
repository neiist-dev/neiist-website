import { EventEmitter } from "events";
import type { PaymentEventPayload } from "@/types/shop/payment";

const emitter = new EventEmitter();

export const paymentBroadcaster = {
  emitPaymentUpdate(key: string, payload: PaymentEventPayload): void {
    if (key) {
      emitter.emit(`payment:${key}`, payload);
    }
  },

  onPaymentUpdate(key: string, listener: (_payload: PaymentEventPayload) => void): () => void {
    if (!key) return () => {};
    const event = `payment:${key}`;
    emitter.on(event, listener);
    return () => {
      emitter.off(event, listener);
    };
  },
};
