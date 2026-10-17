import { Client } from "pg";
import { EventEmitter } from "events";

class DatabaseBroadcaster extends EventEmitter {
  private client: Client | null = null;
  private readonly connectionString: string;
  private isConnecting = false;
  private isReconnecting = false;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectDelay = 30000; // 30 seconds

  constructor() {
    super();
    this.setMaxListeners(0);
    this.connectionString = process.env.DATABASE_URL || "";
    if (!this.connectionString) {
      console.error("DATABASE_URL env not defined");
    }
  }

  async connect() {
    if (this.client || this.isConnecting || this.isReconnecting || !this.connectionString) return;
    this.isConnecting = true;

    const client = new Client({
      connectionString: this.connectionString,
    });

    // Attach error listener before connecting so socket errors never become uncaught exceptions
    client.on("error", (err) => {
      console.error("DB Broadcaster Client Error:", err);
      if (this.client === client) {
        void this.reconnect();
      }
    });

    try {
      await client.connect();
      await client.query("SELECT neiist.listen_voting_updates()");

      this.client = client;
      this.reconnectAttempts = 0;

      client.on("notification", (msg) => {
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

      client.on("end", () => {
        if (this.client === client) void this.reconnect();
      });

      this.emit("voting_update", { type: "STATE_CHANGE", updated_at: new Date().toISOString() });
    } catch (error) {
      console.error("DB Broadcaster Connection Error:", error);
      try {
        client.removeAllListeners();
        await client.end();
      } catch {
        // ignore error on cleanup of failed client
      }
      this.client = null;
      this.isConnecting = false;
      await this.reconnect();
      return;
    }

    this.isConnecting = false;
  }

  private async reconnect() {
    if (this.isReconnecting) return;
    this.isReconnecting = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.client) {
      const oldClient = this.client;
      this.client = null;
      try {
        oldClient.removeAllListeners();
        await oldClient.end();
      } catch (err) {
        console.error("Error closing old DB Broadcaster connection:", err);
      }
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;
    console.warn(`DB Broadcaster reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null;
      this.isReconnecting = false;
      await this.connect();
    }, delay);
    this.reconnectTimeout.unref?.();
  }
}

// Singleton pattern with global cache
const globalForBroadcaster = globalThis as unknown as {
  dbBroadcaster: DatabaseBroadcaster | undefined;
};

export const dbBroadcaster = globalForBroadcaster.dbBroadcaster ?? new DatabaseBroadcaster();

if (!globalForBroadcaster.dbBroadcaster) globalForBroadcaster.dbBroadcaster = dbBroadcaster;

void dbBroadcaster.connect();
