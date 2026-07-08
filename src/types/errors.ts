export class DatabaseError extends Error {
  public statusCode: number;
  public userMessage: string;

  constructor(userMessage: string, statusCode: number = 400) {
    super(userMessage);
    this.name = "DatabaseError";
    this.statusCode = statusCode;
    this.userMessage = userMessage;
  }
}
