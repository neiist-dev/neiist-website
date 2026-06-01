import { Client } from "pg";
import { EventEmitter } from "events";

class DatabaseBroadcaster extends EventEmitter {
  private client: Client | null = null;
  private readonly connectionString: string;
  private isReconnecting = false;

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
      await this.client.query("SELECT neiist.listen_voting_updates()");

      this.client.on("notification", (msg) => {
        if (msg.channel === "voting_update" && msg.payload) {
          try {
            const payload = JSON.parse(msg.payload);
            const updatedAt = payload.updated_at || payload.updatedAt || msg.payload;
            this.emit("voting_update", { updated_at: updatedAt });
          } catch {
            this.emit("voting_update", { updated_at: msg.payload });
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
      } catch {}
      this.client = null;
    }

    setTimeout(async () => {
      this.isReconnecting = false;
      await this.connect();
    }, 5000);
  }
}

// Singleton pattern with global cache for Next.js HMR
const globalForBroadcaster = globalThis as unknown as {
  dbBroadcaster: DatabaseBroadcaster | undefined;
};

export const dbBroadcaster = globalForBroadcaster.dbBroadcaster ?? new DatabaseBroadcaster();

if (process.env.NODE_ENV !== "production") globalForBroadcaster.dbBroadcaster = dbBroadcaster;

void dbBroadcaster.connect();
