import { NextRequest, NextResponse } from "next/server";
import { validateSumUpCredentials, withSumUp, sumupErrorResponse } from "@/lib/payments/sumup";
import {
  getCheckoutSession,
  getRemainingSessionSeconds,
  saveCheckoutSession,
} from "@/lib/redis/sessions";
import { verifyPermission } from "@/lib/auth";
import { handleApiError } from "@/utils/apiErrorUtils";

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyPermission("orders:create");
    if (auth.error) return auth.error;

    const credentialError = validateSumUpCredentials();
    if (credentialError) return credentialError;

    const body = (await req.json().catch(() => ({}))) as {
      checkoutId?: string;
      orderNumber?: string;
    };
    const checkoutId = typeof body.checkoutId === "string" ? body.checkoutId.trim() : "";
    const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";

    if (!checkoutId) return sumupErrorResponse("Missing checkoutId", 400);

    if (orderNumber) {
      const session = await getCheckoutSession(orderNumber);
      if (session?.user_istid && auth.user && session.user_istid !== auth.user.istid)
        return sumupErrorResponse("Not order owner", 403);

      if (session && session.reference === checkoutId) {
        const remaining = getRemainingSessionSeconds(session);
        if (remaining > 0)
          await saveCheckoutSession({ ...session, reference: undefined }, remaining);
      }
    }

    try {
      await withSumUp((client) => client.checkouts.deactivate(checkoutId));
    } catch {
      // If already expired or deactivated on SumUp, consider it safely cancelled
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
