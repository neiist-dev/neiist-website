import { NextRequest, NextResponse } from "next/server";
import { validateSumUpCredentials, withSumUp, sumupErrorResponse } from "@/lib/payments/sumup";
import { getVirtualReadersForUser } from "@/lib/payments/sumupBridge";
import { ENABLE_SUMUP_MOBILE_BRIDGE, type SumUpReadersListResponse } from "@/types/shop/sumup";
import { verifyPermission } from "@/lib/auth";

const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_CODE;

export async function GET() {
  const auth = await verifyPermission(["pos:access", "shop:write"], { match: "any" });
  if (auth.error) return auth.error;

  const credentialError = validateSumUpCredentials();
  if (credentialError) return credentialError;

  try {
    const data = (await withSumUp((client) =>
      client.readers.list(SUMUP_MERCHANT_CODE!)
    )) as SumUpReadersListResponse;
    const readers = [...(data.items ?? [])];
    if (ENABLE_SUMUP_MOBILE_BRIDGE && auth.user?.istid)
      readers.unshift(...getVirtualReadersForUser(auth.user.istid));

    return NextResponse.json({ readers });
  } catch (err) {
    return sumupErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyPermission("shop:write");
  if (auth.error) return auth.error;

  const credentialError = validateSumUpCredentials();
  if (credentialError) return credentialError;

  const body = (await req.json()) as {
    pairing_code?: string;
    name?: string;
    metadata?: Record<string, unknown>;
  };
  const pairingCode = (body?.pairing_code ?? "").trim().toUpperCase();
  const readerName = (body?.name ?? "").trim();

  if (!pairingCode || !readerName)
    return sumupErrorResponse("Pairing code and name are required.", 400);

  try {
    const reader = await withSumUp((client) =>
      client.readers.create(SUMUP_MERCHANT_CODE!, {
        pairing_code: pairingCode,
        name: readerName,
        metadata: body.metadata,
      })
    );
    return NextResponse.json({ success: true, reader }, { status: 201 });
  } catch (error) {
    return sumupErrorResponse(error);
  }
}
