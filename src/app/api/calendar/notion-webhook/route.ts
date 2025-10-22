import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { NotionPage, NotionEvent } from "@/types/notion";

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const CACHE_FILE = path.resolve(process.cwd(), "notion-events-cache.json");
const SIGNING_SECRET = process.env.NOTION_SIGNING_SECRET;
const NOTION_VERSION = "2022-06-28";

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
    attendees: props.Attendees?.people?.map((p) => p.name ?? "") ?? [],
  };
}

async function fetchNotionPage(pageId: string): Promise<NotionPage> {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    const err = new Error("Failed to fetch Notion page: " + txt);
    err.cause = res.status;
    throw err;
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  if (SIGNING_SECRET) {
    const signatureHeader =
      req.headers.get("Notion-Signature") || req.headers.get("notion-signature") || "";
    const computed = crypto
      .createHmac("sha256", SIGNING_SECRET)
      .update(bodyText, "utf8")
      .digest("base64");
    try {
      if (
        !signatureHeader ||
        !crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signatureHeader))
      ) {
        return new NextResponse("Invalid signature", { status: 401 });
      }
    } catch {
      return new NextResponse("Invalid signature", { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const pageIds = new Set<string>();
  if (Array.isArray(payload)) {
    payload.forEach((p) => {
      if (p && typeof p === "object") {
        if ("page" in p && p.page && typeof p.page === "object" && "id" in p.page)
          pageIds.add((p.page as { id: string }).id);
        if ("record" in p && p.record && typeof p.record === "object" && "id" in p.record)
          pageIds.add((p.record as { id: string }).id);
        if ("page_id" in p) pageIds.add((p as { page_id: string }).page_id);
        if ("resource" in p && p.resource && typeof p.resource === "object" && "id" in p.resource)
          pageIds.add((p.resource as { id: string }).id);
      }
    });
  } else if (payload && typeof payload === "object") {
    const pl = payload as Record<string, unknown>;
    if (pl.page && typeof pl.page === "object" && "id" in pl.page)
      pageIds.add((pl.page as { id: string }).id);
    if (pl.record && typeof pl.record === "object" && "id" in pl.record)
      pageIds.add((pl.record as { id: string }).id);
    if ("page_id" in pl) pageIds.add(pl.page_id as string);
    if (pl.resource && typeof pl.resource === "object" && "id" in pl.resource)
      pageIds.add((pl.resource as { id: string }).id);
    if (Array.isArray(pl.results)) {
      pl.results.forEach((r: Record<string, unknown>) => {
        if (r.page && typeof r.page === "object" && "id" in r.page)
          pageIds.add((r.page as { id: string }).id);
        if (r.record && typeof r.record === "object" && "id" in r.record)
          pageIds.add((r.record as { id: string }).id);
      });
    }
  }

  if (pageIds.size === 0) {
    return NextResponse.json({ ok: true });
  }

  try {
    const current = await loadCache();
    for (const id of pageIds) {
      try {
        const page = await fetchNotionPage(id);
        const ev = parseNotionPageToEvent(page);
        const idx = current.findIndex((c) => c.id === ev.id);
        if (idx === -1) current.push(ev);
        else current[idx] = ev;
      } catch (err: unknown) {
        if (
          typeof err === "object" &&
          err !== null &&
          (("status" in err && (err as { status: number }).status === 404) ||
            ("message" in err &&
              typeof (err as { message: string }).message === "string" &&
              (err as { message: string }).message.includes("404")))
        ) {
          const filtered = current.filter((c) => c.id !== id);
          (current as NotionEvent[]) = filtered;
        } else {
          throw err;
        }
      }
    }
    await saveCache(current);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook processing failed:", err);
    return new NextResponse("Failed to process webhook", { status: 500 });
  }
}
