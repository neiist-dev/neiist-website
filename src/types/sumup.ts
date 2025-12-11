export interface SumUpClient {
  checkouts: {
    create(_payload: CheckoutPayload): Promise<CheckoutResponse>;
    get(_checkoutId: string): Promise<CheckoutData>;
  };
}

export interface CreateRequestBody {
  orderId?: number | string;
  amount?: number | string;
  currency?: string;
  checkout_reference?: string;
}

export interface CheckoutPayload {
  amount: number;
  currency: string;
  checkout_reference: string;
  merchant_code: string;
  return_url?: string;
}

export interface CheckoutResponse {
  id?: string;
  data?: { id?: string };
  hosted_url?: string;
  redirect_url?: string;
  [key: string]: unknown;
}

export interface CheckoutTransaction {
  status?: string;
  state?: string;
  [key: string]: unknown;
}

export interface CheckoutPayment {
  status?: string;
  state?: string;
  [key: string]: unknown;
}

export interface CheckoutData {
  status?: string;
  state?: string;
  transaction?: CheckoutTransaction;
  payment?: CheckoutPayment;
  checkout_reference?: string;
  checkoutReference?: string;
  checkout?: { reference?: string } | null;
  [key: string]: unknown;
}

export interface SumUpCardMountOptions {
  checkoutId: string;
  container: string;
  showFooter?: boolean;
  onResponse?: (
    _type: string,
    _body: CheckoutData | CheckoutResponse | Record<string, unknown>
  ) => void;
}

export interface SumUpCardInstance {
  unmount?: () => void;
}

export interface SumUpCardGlobal {
  mount: (_opts: SumUpCardMountOptions) => SumUpCardInstance;
}

declare global {
  interface Window {
    SumUpCard?: SumUpCardGlobal;
  }
}
