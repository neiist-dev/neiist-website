import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { NotionPage, NotionEvent, NotionPerson, NotionApiResponse } from "@/types/notion";
import { syncEventToCalendar, getOrCreateUserCalendar } from "@/utils/googleCalendar";
import { getAllUsers } from "@/utils/dbUtils";

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const DATABASE_ID = process.env.DATABASE_ID!;
const ENV_PATH = path.resolve(process.cwd(), ".env");

type NotionWebhookPayload = {
  verification_token?: string;
  [key: string]: unknown;
};

const notion = new Client({ auth: NOTION_API_KEY });

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
    attendees: props.Attendees?.people?.map((p: NotionPerson) => p.person?.email ?? "") ?? [],
  };
}

async function fetchAllNotionEvents(): Promise<NotionEvent[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined = undefined;
  do {
    const response = (await notion.dataSources.query({
      data_source_id: DATABASE_ID,
      start_cursor: cursor,
    })) as NotionApiResponse;
    const mappedPages: NotionPage[] = response.results.map((page) => ({
      id: page.id,
      url: page.url,
      properties: page.properties,
    }));
    pages.push(...mappedPages);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return pages.map(parseNotionPageToEvent);
}

async function syncAllEventsToGoogleCalendars(events: NotionEvent[]) {
  const allUsers = await getAllUsers();
  const users = allUsers.filter((u) => u.email && u.istid);

  await Promise.all(
    users.map(async (user) => {
      try {
        const alternativeEmailRaw = user.alternativeEmailVerified
          ? user.alternativeEmail
          : undefined;
        const alternativeEmail = alternativeEmailRaw ?? undefined;
        const calendarId = await getOrCreateUserCalendar(
          user.email!,
          user.istid,
          user.name,
          alternativeEmail
        );
        await Promise.all(
          events.map((event) => syncEventToCalendar(calendarId, event, user.email!))
        );
      } catch (error) {
        console.error(`✗ Error syncing calendar for ${user.istid}:`, error);
      }
    })
  );
}

async function getVerificationToken(): Promise<string | undefined> {
  return process.env.VERIFICATION_TOKEN;
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

  try {
    const events = await fetchAllNotionEvents();
    await syncAllEventsToGoogleCalendars(events);

    return NextResponse.json({
      ok: true,
      synced: true,
      eventCount: events.length,
      message: "All calendars updated successfully",
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new NextResponse("Failed to sync calendars", { status: 500 });
  }
}
