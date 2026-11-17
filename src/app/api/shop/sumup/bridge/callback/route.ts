import { NextRequest, NextResponse } from "next/server";
import {
  completeRelayJob,
  resolveBridgeBaseUrl,
  verifyAndRedeemSumUpBridgeTx,
  verifyBridgeState,
} from "@/lib/payments/sumupBridge";
import { discardCheckoutSession } from "@/lib/redis/sessions";
import { finalizePaidOrders } from "@/lib/shop/orders";
import { ENABLE_SUMUP_MOBILE_BRIDGE, type SumUpBridgeStatePayload } from "@/types/shop/sumup";

function buildReturnRedirect(
  req: NextRequest,
  state: SumUpBridgeStatePayload,
  status: "success" | "failed",
  message?: string
): NextResponse {
  const url = new URL(state.returnPath, resolveBridgeBaseUrl(req));
  url.searchParams.set("bridge_status", status);
  url.searchParams.set("order", state.orderNumber);
  if (message) url.searchParams.set("bridge_message", message);
  return NextResponse.redirect(url);
}

async function handleFailure(
  req: NextRequest,
  state: SumUpBridgeStatePayload,
  message?: string,
  discardSession = true
): Promise<NextResponse> {
  if (state.mode === "relay") {
    completeRelayJob(state.jobId, {
      status: "failed",
      message: message || "Pagamento cancelado ou recusado na app SumUp.",
    });
  } else if (discardSession) {
    await discardCheckoutSession(state.orderNumber).catch(() => {});
  }
  return buildReturnRedirect(req, state, "failed", message || undefined);
}

export async function GET(req: NextRequest) {
  if (!ENABLE_SUMUP_MOBILE_BRIDGE) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sp = req.nextUrl.searchParams;
  const stateToken = sp.get("state") || "";
  const state = verifyBridgeState(stateToken);
  if (!state) {
    return NextResponse.json({ error: "Invalid or expired bridge state" }, { status: 400 });
  }

  const bridgeOutcome = (sp.get("bridge_outcome") || "").toLowerCase();
  const smpStatus = (sp.get("smp-status") || sp.get("status") || "").toLowerCase();
  const smpTxCode = sp.get("smp-tx-code") || sp.get("tx-code") || sp.get("transaction_code") || "";
  const failureCause = sp.get("smp-failure-cause") || sp.get("smp-message") || "";

  const isExplicitFailure =
    bridgeOutcome === "fail" ||
    smpStatus === "failed" ||
    smpStatus === "canceled" ||
    smpStatus === "cancelled";

  if (isExplicitFailure) {
    return handleFailure(req, state, failureCause || undefined);
  }

  const verified = await verifyAndRedeemSumUpBridgeTx({
    state,
    transactionCode: smpTxCode,
  });

  if (!verified.ok) return handleFailure(req, state, verified.error);

  const settled = await finalizePaidOrders({
    orderNumbers: state.orderNumbers,
    paymentReference: verified.transactionCode,
    receivedBy: state.userId,
    verifiedBy: "sumup-bridge",
    paymentMethod: "sumup-tpa",
    shiftId: state.shiftId ?? null,
  });

  if (!settled.success) return handleFailure(req, state, settled.error, false);

  if (state.mode === "relay")
    completeRelayJob(state.jobId, {
      status: "paid",
      transactionCode: verified.transactionCode,
    });

  return buildReturnRedirect(req, state, "success");
}
