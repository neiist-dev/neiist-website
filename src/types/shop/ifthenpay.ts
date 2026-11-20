export interface MbWayPaymentRequest {
  mbWayKey: string;
  orderId: string;
  amount: string;
  mobileNumber: string;
  email?: string;
  description?: string;
  notificationUrl?: string;
}

export interface MbWayPaymentResponse {
  Amount: number;
  Message: string;
  orderId: string | number;
  RequestId: string;
  Status: string;
}

export interface MbWayStatusResponse {
  CreatedAt: string;
  Message: string;
  RequestId: string;
  Status: string;
  UpdateAt?: string;
}

export interface MbWayNotificationPayload {
  RequestId: string;
  CreatedAt: string;
  UpdateAt: string;
  Status: string;
  Message: string;
}

export const MBWAY_STATUS = {
  // Initialization status codes
  INIT_SUCCESS: "000",
  INIT_FAILED: "100",
  INIT_DECLINED: "122",
  INIT_ERROR: "999",

  // Transaction status codes
  PAID: "000",
  DECLINED: "020",
  EXPIRED: "101",
  FAILED: "122",
} as const;

export interface HandleMbWayStatusParams {
  requestId: string;
  statusCode: string;
  orderNumber?: string | null;
  orderNumbers?: string[] | null;
  shiftId?: string | null;
  verifiedBy: string;
  message?: string;
}

export interface HandleMbWayStatusResult {
  status: "paid" | "declined" | "expired" | "failed" | "pending";
  message: string;
  orderNumber?: string | null;
}
