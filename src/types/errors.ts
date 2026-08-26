export const ErrorCode = {
  STOCK_OVERRIDE_REQUIRED: "STOCK_OVERRIDE_REQUIRED",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export class DatabaseError extends Error {
  public statusCode: number;
  public userMessage: string;
  public code?: ErrorCodeType;

  constructor(userMessage: string, statusCode: number = 400, code?: ErrorCodeType) {
    super(userMessage);
    this.name = "DatabaseError";
    this.userMessage = userMessage;
    this.statusCode = statusCode;
    this.code = code;
  }
}
