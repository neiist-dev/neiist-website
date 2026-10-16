import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const TOMBSTONES_FILE = path.join(process.cwd(), "data", "tombstones.jsonl");
const GENESIS_HASH = "0".repeat(64);

function getPepper(): string {
  const pepper = process.env.GDPR_TOMBSTONE_SECRET || process.env.JWT_SECRET;
  if (!pepper) throw new Error("GDPR_TOMBSTONE_SECRET or JWT_SECRET is required");
  return pepper;
}

async function getPrevHash(): Promise<string> {
  try {
    const lines = (await fs.readFile(TOMBSTONES_FILE, "utf8")).trim().split("\n");
    const lastLine = lines[lines.length - 1];
    return lastLine ? (JSON.parse(lastLine) as { hash: string }).hash : GENESIS_HASH;
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return GENESIS_HASH;
    throw error;
  }
}

export async function appendGdprTombstone({
  istid,
  initiated_by,
}: {
  istid: string;
  initiated_by: string;
}): Promise<void> {
  const tombstone_id = crypto.createHmac("sha256", getPepper()).update(istid).digest("hex");
  const erased_at = new Date().toISOString();
  const prev_hash = await getPrevHash();
  const hash = crypto
    .createHash("sha256")
    .update(prev_hash + tombstone_id + erased_at + initiated_by)
    .digest("hex");

  const line = JSON.stringify({ tombstone_id, erased_at, initiated_by, prev_hash, hash });

  await fs.mkdir(path.dirname(TOMBSTONES_FILE), { recursive: true });
  await fs.appendFile(TOMBSTONES_FILE, `${line}\n`);
}
