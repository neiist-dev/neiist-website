import crypto from "crypto";
import { NextRequest } from "next/server";
import { defaultLocale, isValidLocale } from "@/i18n/i18n-config";
import { paymentBroadcaster } from "@/lib/payments/broadcaster";
import { withSumUp } from "@/lib/payments/sumup";
import { getRedisClient } from "@/lib/redis/client";
import { saveCheckoutSession } from "@/lib/redis/sessions";
import { SUMUP_BRIDGE_REDEEMED_PREFIX } from "@/types/redis";
import type { PaymentTarget } from "@/types/shop/payment";
import {
  ENABLE_SUMUP_MOBILE_BRIDGE,
  type SumUpBridgeMode,
  type SumUpBridgeRelayJob,
  type SumUpBridgeStatePayload,
  type SumUpReader,
} from "@/types/shop/sumup";

type RelayEventSender = (_event: string, _data: unknown) => void;

interface RelaySessionEntry {
  userId: string;
  send: RelayEventSender;
}

interface SumUpBridgeMemoryStore {
  activeSessions: Map<string, RelaySessionEntry>;
  jobsById: Map<string, SumUpBridgeRelayJob>;
}

const BRIDGE_JOB_TTL_MS = 60 * 60 * 1000;
const BRIDGE_STATE_TTL_MS = 15 * 60 * 1000;
const BRIDGE_REDEEMED_TTL_SECONDS = 86400;

const globalForBridge = globalThis as unknown as {
  __neiistSumUpBridge?: SumUpBridgeMemoryStore;
};

function getBridgeStore(): SumUpBridgeMemoryStore {
  if (!globalForBridge.__neiistSumUpBridge) {
    globalForBridge.__neiistSumUpBridge = {
      activeSessions: new Map(),
      jobsById: new Map(),
    };
  }
  return globalForBridge.__neiistSumUpBridge;
}

function getBridgeSigningSecret(): string {
  return (process.env.JWT_SECRET || process.env.SUMUP_API_KEY || "").trim();
}

export function resolveBridgeBaseUrl(req: NextRequest): string {
  const configured = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    ""
  ).trim();
  if (configured) return configured.replace(/\/$/, "");

  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, "");
  return req.nextUrl.origin.replace(/\/$/, "");
}

function signBridgeState(payload: SumUpBridgeStatePayload): string {
  const secret = getBridgeSigningSecret();
  if (!secret) throw new Error("Bridge signing secret is not configured.");

  const dataB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sigB64 = crypto.createHmac("sha256", secret).update(dataB64).digest("base64url");
  return `${dataB64}.${sigB64}`;
}

export function verifyBridgeState(token: string): SumUpBridgeStatePayload | null {
  if (!token) return null;
  const secret = getBridgeSigningSecret();
  if (!secret) return null;

  const [dataB64, sigB64, extra] = token.split(".");
  if (!dataB64 || !sigB64 || extra !== undefined) return null;

  try {
    const expectedSigB64 = crypto.createHmac("sha256", secret).update(dataB64).digest("base64url");
    const sigBuf = Buffer.from(sigB64);
    const expectedBuf = Buffer.from(expectedSigB64);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const parsed = JSON.parse(
      Buffer.from(dataB64, "base64url").toString("utf8")
    ) as SumUpBridgeStatePayload;

    if (!parsed?.jobId || !parsed.returnPath?.startsWith("/") || parsed.exp <= Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function buildSumUpPaymentSwitchUrl(params: {
  amount: number;
  description: string;
  jobId: string;
  stateToken: string;
  baseUrl: string;
}): string {
  const affiliateKey = process.env.SUMUP_AFFILIATE_KEY?.trim();
  if (!affiliateKey) throw new Error("SUMUP_AFFILIATE_KEY is not configured.");

  const appId = process.env.SUMUP_APP_ID?.trim() || "pt.ulisboa.tecnico.neiist";
  const callbackBase = `${params.baseUrl.replace(/\/$/, "")}/api/shop/sumup/bridge/callback`;
  const encodedState = encodeURIComponent(params.stateToken);
  const callbackSuccess = `${callbackBase}?state=${encodedState}&bridge_outcome=success`;
  const callbackFail = `${callbackBase}?state=${encodedState}&bridge_outcome=fail`;
  const formattedAmount = params.amount.toFixed(2);

  const query = new URLSearchParams({
    "affiliate-key": affiliateKey,
    "app-id": appId,
    total: formattedAmount,
    amount: formattedAmount,
    currency: "EUR",
    title: params.description.slice(0, 100),
    "skip-screen-success": "true",
    "foreign-tx-id": params.jobId,
    callback: callbackSuccess,
    callbacksuccess: callbackSuccess,
    callbackfail: callbackFail,
  });

  return `sumupmerchant://pay/1.0?${query.toString().replace(/\+/g, "%20")}`;
}

export async function createBridgePaymentAttempt(params: {
  target: PaymentTarget;
  body: Record<string, unknown>;
  userId: string;
  sessionId?: string;
  req: NextRequest;
}): Promise<{ jobId: string; deepLinkUrl: string }> {
  const { target, body, userId, sessionId, req } = params;
  const mode: SumUpBridgeMode = sessionId ? "relay" : "direct";
  const jobId = `${target.orderNumber}-${crypto.randomUUID().slice(0, 8)}`;

  let rawLocale = "";
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      rawLocale = new URL(referer).pathname.split("/").filter(Boolean)[0] || "";
    } catch {
      rawLocale = "";
    }
  }
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const isFastPos = (target.redisSession?.order_source ?? body.order_source) === "fast-pos";
  const returnPath =
    mode === "relay"
      ? `/${locale}/shop/pos/mobile-tpa`
      : isFastPos
        ? `/${locale}/shop/pos/live`
        : `/${locale}/shop/pos`;

  const bodyShiftId =
    typeof body.shift_id === "string"
      ? body.shift_id
      : typeof body.shiftId === "string"
        ? body.shiftId
        : null;

  const stateToken = signBridgeState({
    jobId,
    orderNumber: target.orderNumber,
    orderNumbers: target.orderNumbers,
    amountCents: Math.round(target.totalAmount * 100),
    userId,
    shiftId: target.redisSession?.shift_id ?? bodyShiftId,
    mode,
    returnPath,
    exp: Date.now() + BRIDGE_STATE_TTL_MS,
  });

  const deepLinkUrl = buildSumUpPaymentSwitchUrl({
    amount: target.totalAmount,
    description: target.description,
    jobId,
    stateToken,
    baseUrl: resolveBridgeBaseUrl(req),
  });

  if (target.redisSession) {
    await saveCheckoutSession({ ...target.redisSession, reference: jobId }, 600);
  }

  if (mode === "relay" && sessionId) {
    dispatchRelayJob({
      jobId,
      sessionId,
      userId,
      orderNumber: target.orderNumber,
      amount: target.totalAmount,
      description: target.description,
      deepLinkUrl,
      status: "pending",
      createdAt: Date.now(),
    });
  }

  return { jobId, deepLinkUrl };
}

export function registerRelayConnection(
  sessionId: string,
  userId: string,
  send: RelayEventSender
): () => void {
  const store = getBridgeStore();
  store.activeSessions.set(sessionId, { userId, send });

  const cutoff = Date.now() - BRIDGE_STATE_TTL_MS;
  for (const job of store.jobsById.values()) {
    if (
      job.sessionId === sessionId &&
      job.userId === userId &&
      job.status === "pending" &&
      job.createdAt > cutoff
    ) {
      send("job", job);
    }
  }

  return () => {
    if (store.activeSessions.get(sessionId)?.send === send) {
      store.activeSessions.delete(sessionId);
    }
  };
}

export function hasActiveRelaySession(sessionId: string, userId: string): boolean {
  return getBridgeStore().activeSessions.get(sessionId)?.userId === userId;
}

export function getVirtualReadersForUser(userId: string): SumUpReader[] {
  if (!ENABLE_SUMUP_MOBILE_BRIDGE || !userId) return [];
  const readers: SumUpReader[] = [];
  for (const [sessionId, entry] of getBridgeStore().activeSessions.entries()) {
    if (entry.userId === userId) {
      readers.push({
        id: sessionId,
        name: "SumUp App (Solo Lite / Tap to Pay)",
        status: "app",
      });
    }
  }
  return readers;
}

function dispatchRelayJob(job: SumUpBridgeRelayJob): void {
  const store = getBridgeStore();
  const cutoff = Date.now() - BRIDGE_JOB_TTL_MS;
  for (const [id, existing] of store.jobsById.entries()) {
    if (existing.createdAt < cutoff) {
      store.jobsById.delete(id);
    }
  }

  store.jobsById.set(job.jobId, job);
  store.activeSessions.get(job.sessionId)?.send("job", job);
}

export function getRelayJob(jobId: string): SumUpBridgeRelayJob | null {
  return getBridgeStore().jobsById.get(jobId) ?? null;
}

export function completeRelayJob(
  jobId: string,
  outcome: { status: "paid" | "failed"; transactionCode?: string; message?: string },
  event: "job_updated" | "job_cancelled" = "job_updated"
): SumUpBridgeRelayJob | null {
  const store = getBridgeStore();
  const job = store.jobsById.get(jobId);
  if (!job) return null;

  const updated: SumUpBridgeRelayJob = {
    ...job,
    status: outcome.status,
    transactionCode: outcome.transactionCode,
    message: outcome.message,
  };
  store.jobsById.set(jobId, updated);

  store.activeSessions.get(job.sessionId)?.send(event, updated);

  paymentBroadcaster.emitPaymentUpdate(jobId, {
    status: outcome.status === "paid" ? "PAID" : "FAILED",
    orderNumber: job.orderNumber,
    clientTransactionId: jobId,
    message: outcome.message,
  });

  return updated;
}

export function cancelRelayJobForSession(sessionId: string, userId: string): boolean {
  const store = getBridgeStore();
  let cancelled = false;
  for (const job of store.jobsById.values()) {
    if (job.sessionId === sessionId && job.userId === userId && job.status === "pending") {
      completeRelayJob(
        job.jobId,
        { status: "failed", message: "Cancelled by cashier" },
        "job_cancelled"
      );
      cancelled = true;
    }
  }
  return cancelled || store.activeSessions.get(sessionId)?.userId === userId;
}

export async function verifyAndRedeemSumUpBridgeTx(params: {
  state: SumUpBridgeStatePayload;
  transactionCode?: string | null;
}): Promise<{ ok: true; transactionCode: string } | { ok: false; error: string }> {
  const merchantCode = process.env.SUMUP_MERCHANT_CODE?.trim();
  if (!merchantCode) return { ok: false, error: "SumUp merchant code is not configured." };

  const cleanTxCode = params.transactionCode?.trim() || "";

  let tx;
  try {
    tx = await withSumUp((client) =>
      client.transactions.get(
        merchantCode,
        cleanTxCode
          ? { transaction_code: cleanTxCode }
          : { foreign_transaction_id: params.state.jobId }
      )
    );
  } catch (err) {
    console.error("[SumUpBridge] Transaction verification lookup failed:", err);
    return { ok: false, error: "Failed to verify transaction with SumUp." };
  }

  const rawStatus = String(tx.status ?? "").toUpperCase();
  const simpleStatus = String(tx.simple_status ?? "").toUpperCase();
  const isSuccessful =
    rawStatus === "SUCCESSFUL" || simpleStatus === "SUCCESSFUL" || simpleStatus === "PAID_OUT";

  if (!isSuccessful) {
    return { ok: false, error: "SumUp transaction is not successful." };
  }

  if (String(tx.currency ?? "").toUpperCase() !== "EUR") {
    return { ok: false, error: "SumUp transaction currency mismatch." };
  }

  const paidCents = Math.round(Number(tx.amount ?? 0) * 100);
  if (paidCents !== params.state.amountCents) {
    return { ok: false, error: "SumUp transaction amount mismatch." };
  }

  if (tx.foreign_transaction_id && tx.foreign_transaction_id !== params.state.jobId) {
    return { ok: false, error: "SumUp foreign transaction id mismatch." };
  }

  const verifiedTxCode = String(tx.transaction_code || cleanTxCode).trim();
  if (!verifiedTxCode) {
    return { ok: false, error: "Missing transaction_code in SumUp response." };
  }

  const redis = getRedisClient();
  const redeemedKey = `${SUMUP_BRIDGE_REDEEMED_PREFIX}${verifiedTxCode}`;
  const acquired = await redis.set(
    redeemedKey,
    params.state.orderNumber,
    "EX",
    BRIDGE_REDEEMED_TTL_SECONDS,
    "NX"
  );

  if (!acquired) {
    const existingOrder = await redis.get(redeemedKey);
    if (existingOrder !== params.state.orderNumber) {
      return { ok: false, error: "SumUp transaction has already been redeemed." };
    }
  }

  return { ok: true, transactionCode: verifiedTxCode };
}
