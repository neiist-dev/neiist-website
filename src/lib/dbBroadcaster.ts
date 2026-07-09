import { Client } from "pg";
import { EventEmitter } from "events";

class DatabaseBroadcaster extends EventEmitter {
  private client: Client | null = null;
  private readonly connectionString: string;
  private isReconnecting = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectDelay = 30000; // 30 seconds

  constructor() {
    super();
    this.setMaxListeners(100);
    this.connectionString = process.env.DATABASE_URL || "";
    if (!this.connectionString) {
      console.error("DATABASE_URL env not defined");
    }
  }

  async connect() {
    if (this.client || !this.connectionString) return;

    this.client = new Client({
      connectionString: this.connectionString,
    });

    try {
      await this.client.connect();
      this.reconnectAttempts = 0;
      await this.client.query("SELECT neiist.listen_voting_updates()");
      this.emit("voting_update", { type: "STATE_CHANGE", updated_at: new Date().toISOString() });

      this.client.on("notification", (msg) => {
        if (msg.channel === "voting_update" && msg.payload) {
          try {
            const payload = JSON.parse(msg.payload);
            const updatedAt = payload.updated_at || payload.updatedAt || msg.payload;
            const type = payload.type || "STATE_CHANGE";
            this.emit("voting_update", { type, updated_at: updatedAt });
          } catch {
            this.emit("voting_update", { type: "STATE_CHANGE", updated_at: msg.payload });
          }
        }
      });

      this.client.on("error", (err) => {
        console.error("DB Broadcaster Client Error:", err);
        this.reconnect();
      });

      this.client.on("end", () => {
        this.reconnect();
      });
    } catch (error) {
      console.error("DB Broadcaster Connection Error:", error);
      await this.reconnect();
    }
  }

  private async reconnect() {
    if (this.isReconnecting) return;
    this.isReconnecting = true;

    if (this.client) {
      try {
        await this.client.end();
      } catch (err) {
        console.error("Error closing old DB Broadcaster connection:", err);
      }
      this.client = null;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;
    console.warn(`DB Broadcaster reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      this.isReconnecting = false;
      await this.connect();
    }, delay);
  }
}

// Singleton pattern with global cache for Next.js HMR
const globalForBroadcaster = globalThis as unknown as {
  dbBroadcaster: DatabaseBroadcaster | undefined;
};

export const dbBroadcaster = globalForBroadcaster.dbBroadcaster ?? new DatabaseBroadcaster();

if (process.env.NODE_ENV !== "production") globalForBroadcaster.dbBroadcaster = dbBroadcaster;

void dbBroadcaster.connect();
