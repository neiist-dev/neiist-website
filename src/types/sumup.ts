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
  description?: string;
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

export interface CheckoutTransactionSummary {
  id?: string;
  transaction_code?: string;
  status?: string;
  [key: string]: unknown;
}

export interface CheckoutData {
  id?: string;
  status?: string;
  state?: string;
  transaction?: CheckoutTransaction;
  payment?: CheckoutPayment;
  checkout_reference?: string;
  checkoutReference?: string;
  checkout?: { reference?: string } | null;
  transaction_code?: string;
  transactions?: CheckoutTransactionSummary[];
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

export interface ApplePayPaymentToken {
  paymentData: {
    data: string;
    signature: string;
    header: {
      publicKeyHash: string;
      ephemeralPublicKey: string;
      transactionId: string;
    };
    version: string;
  };
  paymentMethod: {
    displayName: string;
    network: string;
    type: string;
  };
  transactionIdentifier: string;
}

export interface ApplePayPaymentRequest {
  currencyCode: string;
  countryCode: string;
  merchantCapabilities: string[];
  supportedNetworks: string[];
  total: {
    label: string;
    amount: string;
    type?: "final" | "pending";
  };
}

export interface ApplePaySessionInstance {
  onvalidatemerchant: ((_event: { validationURL: string }) => void) | null;
  onpaymentauthorized: ((_event: { payment: { token: ApplePayPaymentToken } }) => void) | null;
  oncancel: (() => void) | null;
  begin(): void;
  abort(): void;
  completeMerchantValidation(_merchantSession: unknown): void;
  completePayment(_status: number): void;
}

export interface ApplePaySessionConstructor {
  new (_version: number, _request: ApplePayPaymentRequest): ApplePaySessionInstance;
  canMakePayments(): boolean;
  readonly STATUS_SUCCESS: number;
  readonly STATUS_FAILURE: number;
}

declare global {
  interface Window {
    SumUpCard?: SumUpCardGlobal;
    ApplePaySession?: ApplePaySessionConstructor;
  }
}
