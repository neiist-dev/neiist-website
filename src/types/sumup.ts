export interface SumUpCheckout {
  id?: string;
  status?: "PENDING" | "FAILED" | "PAID" | "EXPIRED" | null;
  transaction_code?: string;
  transactions?: Array<{
    transaction_code?: string;
    status?: string;
  }>;
  [key: string]: unknown;
}

export interface SumUpCheckoutPayload {
  merchant_code: string;
  amount: number;
  currency: "EUR";
  checkout_reference: string;
  description: string;
  valid_until: string;
  return_url: string;
}

export interface SumUpTransaction {
  status?: string;
  transaction_code?: string;
  [key: string]: unknown;
}

export interface SumUpReaderStatus {
  id: string;
  name: string;
  status: string;
  device?: {
    model: string;
    identifier: string;
  };
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface SumUpReaderCheckoutResponse {
  data?: {
    client_transaction_id?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SumUpReaderCheckoutPayload {
  description: string;
  total_amount: {
    currency: "EUR";
    minor_unit: number;
    value: number;
  };
}

export interface SumUpReadersListResponse {
  items?: SumUpReaderStatus[];
  [key: string]: unknown;
}

export interface CreateCheckoutRequestBody {
  orderId?: number | string;
}

export interface CreateCheckoutResponse {
  checkoutId?: string;
  error?: string;
}

export interface VerifyCheckoutRequestBody {
  checkoutId?: string;
  orderId?: number | string;
  applePayToken?: ApplePayPaymentToken;
}

export interface VerifyCheckoutResponse {
  ok?: boolean;
  pending?: boolean;
  failed?: boolean;
  alreadyProcessed?: boolean;
  status?: string;
  transactionCode?: string;
  error?: string;
}

export type SumUpCardResponseType =
  | "sent"
  | "invalid"
  | "auth-screen"
  | "error"
  | "success"
  | "fail";

export interface SumUpCardSentBody {
  last_4_digits?: string;
  card_type?: string;
  [key: string]: unknown;
}

export interface SumUpCardErrorBody {
  message?: string;
  error_code?: string;
  [key: string]: unknown;
}

export type SumUpCardResponseBody =
  | SumUpCardSentBody
  | SumUpCardErrorBody
  | Record<string, unknown>;

export interface SumUpCardMountOptions {
  checkoutId: string;
  id?: string;
  container?: string;
  showFooter?: boolean;
  showSubmitButton?: boolean;
  showEmail?: boolean;
  email?: string;
  amount?: string;
  currency?: string;
  locale?: string;
  onResponse?: (_type: SumUpCardResponseType, _body: SumUpCardResponseBody) => void;
  onLoad?: () => void;
}

export interface SumUpCardInstance {
  submit?: () => void;
  update?: (_opts: Partial<SumUpCardMountOptions>) => void;
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

export interface ApiErrorResponse {
  error?: string;
}

export type SumUpReader = {
  id: string;
  name: string;
  status: string;
  device: { model: string; identifier: string };
  created_at?: string;
  updated_at?: string;
};

declare global {
  interface Window {
    SumUpCard?: SumUpCardGlobal;
    ApplePaySession?: ApplePaySessionConstructor;
  }
}
