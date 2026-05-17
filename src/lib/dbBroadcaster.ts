import { Client } from "pg";
import { EventEmitter } from "events";

class DatabaseBroadcaster extends EventEmitter {
  private client: Client | null = null;
  private readonly connectionString: string;

  constructor() {
    super();
    this.connectionString = process.env.DATABASE_URL || "";
    if (!this.connectionString) {
      console.error("DATABASE_URL env not defined");
    }
  }

  async connect() {
    if (this.client) return;

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
            this.emit("voting_update", payload);
          } catch {
            this.emit("voting_update", { updatedAt: msg.payload });
          }
        }
      });

      this.client.on("error", () => {
        this.reconnect();
      });

      this.client.on("end", () => {
        this.reconnect();
      });
    } catch (error) {
      console.error("Database listener error:", error);
      this.reconnect();
    }
  }

  private reconnect() {
    this.client = null;
    setTimeout(() => this.connect(), 5000);
  }
}

// Singleton pattern with global cache for Next.js HMR
const globalForBroadcaster = globalThis as unknown as {
  dbBroadcaster: DatabaseBroadcaster | undefined;
};

export const dbBroadcaster = globalForBroadcaster.dbBroadcaster ?? new DatabaseBroadcaster();

if (process.env.NODE_ENV !== "production") globalForBroadcaster.dbBroadcaster = dbBroadcaster;

void dbBroadcaster.connect();
