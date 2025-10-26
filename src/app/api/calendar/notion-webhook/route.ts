import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { NotionPage, NotionEvent, NotionPerson } from "@/types/notion";

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const CACHE_FILE = path.resolve(process.cwd(), "notion-events-cache.json");
const ENV_PATH = path.resolve(process.cwd(), ".env");

const notion = new Client({ auth: NOTION_API_KEY });

type NotionWebhookPayload = {
  verification_token?: string;
  [key: string]: unknown;
};

function parseNotionPageToEvent(page: NotionPage): NotionEvent {
  const props = page.properties;
  return {
    id: page.id,
    title: props.Name?.title?.[0]?.plain_text || "Untitled Event",
    date: props.Date?.date?.start ?? null,
    end: props.Date?.date?.end ?? null,
    url: page.url,
    location: props.Location?.multi_select?.map((loc) => loc.name) ?? [],
    type: props.Type?.select?.name ?? null,
    teams: props.Teams?.multi_select?.map((t) => t.name) ?? [],
    attendees: props.Attendees?.people?.map((p: NotionPerson) => p.name ?? "") ?? [],
  };
}

async function loadCache(): Promise<NotionEvent[]> {
  try {
    const txt = await fs.readFile(CACHE_FILE, "utf8");
    return JSON.parse(txt) as NotionEvent[];
  } catch {
    return [];
  }
}

async function saveCache(events: NotionEvent[]) {
  await fs.writeFile(CACHE_FILE, JSON.stringify(events, null, 2), "utf8");
}

async function getVerificationToken(): Promise<string | undefined> {
  try {
    const envContent = await fs.readFile(ENV_PATH, "utf8");
    const match = envContent.match(/^VERIFICATION_TOKEN=(.*)$/m);
    return match ? match[1].trim() : undefined;
  } catch {
    return undefined;
  }
}

async function saveVerificationTokenToEnv(token: string) {
  let env = "";
  try {
    env = await fs.readFile(ENV_PATH, "utf8");
  } catch {
    env = "";
  }

  if (/^VERIFICATION_TOKEN=.*/m.test(env)) {
    env = env.replace(/^VERIFICATION_TOKEN=.*/m, `VERIFICATION_TOKEN=${token}`);
  } else {
    if (!env.endsWith("\n")) env += "\n";
    env += `VERIFICATION_TOKEN=${token}\n`;
  }

  await fs.writeFile(ENV_PATH, env, "utf8");
}

function extractPageIds(payload: unknown): Set<string> {
  const ids = new Set<string>();
  function recurse(obj: unknown) {
    if (Array.isArray(obj)) {
      obj.forEach(recurse);
    } else if (obj && typeof obj === "object") {
      for (const [key, value] of Object.entries(obj)) {
        if (key === "id" && typeof value === "string") ids.add(value);
        if (key === "page_id" && typeof value === "string") ids.add(value);
        recurse(value);
      }
    }
  }
  recurse(payload);
  return ids;
}

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  let payload: NotionWebhookPayload;
  try {
    payload = JSON.parse(bodyText) as NotionWebhookPayload;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (payload.verification_token) {
    await saveVerificationTokenToEnv(payload.verification_token);
    return NextResponse.json({
      message: "verification_token saved to .env file. Restart your app to use it.",
      verification_token: payload.verification_token,
    });
  }

  const verificationToken = await getVerificationToken();
  if (verificationToken) {
    const signatureHeader =
      req.headers.get("X-Notion-Signature") || req.headers.get("x-notion-signature") || "";
    const calculatedSignature =
      "sha256=" +
      crypto.createHmac("sha256", verificationToken).update(bodyText, "utf8").digest("hex");
    try {
      if (
        !signatureHeader ||
        !crypto.timingSafeEqual(Buffer.from(calculatedSignature), Buffer.from(signatureHeader))
      ) {
        return new NextResponse("Invalid signature", { status: 401 });
      }
    } catch {
      return new NextResponse("Invalid signature", { status: 401 });
    }
  }

  const pageIds = extractPageIds(payload);
  if (pageIds.size === 0) {
    return NextResponse.json({ ok: true });
  }

  try {
    const current = await loadCache();
    for (const id of pageIds) {
      try {
        const page = (await notion.pages.retrieve({ page_id: id })) as NotionPage;
        const ev = parseNotionPageToEvent(page);
        const idx = current.findIndex((c) => c.id === ev.id);
        if (idx === -1) current.push(ev);
        else current[idx] = ev;
      } catch (error) {
        if ((error as { code?: string }).code === "object_not_found") {
          const filtered = current.filter((c) => c.id !== id);
          (current as NotionEvent[]) = filtered;
        } else {
          throw error;
        }
      }
    }
    await saveCache(current);
    return NextResponse.json({ ok: true });
  } catch {
    return new NextResponse("Failed to process webhook", { status: 500 });
  }
}
