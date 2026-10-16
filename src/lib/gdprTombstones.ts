import fs from "fs/promises";
import path from "path";

const TOMBSTONES_FILE = "/var/log/neiist/tombstones.jsonl";

export function getErasureInitiator(actorIstid: string, targetIstid: string): string {
  return actorIstid === targetIstid ? "user_request" : `admin:${actorIstid}`;
}

export async function appendErasureTombstone(istid: string, initiatedBy: string): Promise<void> {
  const line = JSON.stringify({
    istid,
    erased_at: new Date().toISOString(),
    initiated_by: initiatedBy,
    event: "user_erased",
  });

  try {
    await fs.mkdir(path.dirname(TOMBSTONES_FILE), { recursive: true });
    await fs.appendFile(TOMBSTONES_FILE, `${line}\n`);
  } catch (error) {
    console.error("Failed to append GDPR erasure tombstone:", error);
  }
}
