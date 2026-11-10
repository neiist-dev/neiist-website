import { NextRequest, NextResponse } from "next/server";
import {
  validateSumUpCredentials,
  withSumUp,
  getErrorStatus,
  sumupErrorResponse,
  formatSumUpError,
  SumUpAuthError,
} from "@/lib/payments/sumup";
import { verifyPermission } from "@/lib/auth";

const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_CODE;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ readerId: string }> }
) {
  const auth = await verifyPermission(["pos:access", "shop:write"], {
    match: "any",
  });
  if (auth.error) return auth.error;

  const credentialCheck = validateSumUpCredentials();
  if (credentialCheck) return credentialCheck;

  const { readerId } = await params;
  if (!readerId) return sumupErrorResponse("readerId is required", 400);

  try {
    const reader = await withSumUp((client) => client.readers.get(SUMUP_MERCHANT_CODE!, readerId));
    return NextResponse.json({ success: true, reader });
  } catch (error) {
    return sumupErrorResponse(error, undefined, { readerId });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ readerId: string }> }
) {
  const auth = await verifyPermission("shop:write");
  if (auth.error) return auth.error;

  const credentialCheck = validateSumUpCredentials();
  if (credentialCheck) return credentialCheck;

  const { readerId } = await params;
  if (!readerId) return sumupErrorResponse("readerId is required", 400);

  const body = (await req.json()) as {
    name?: string;
    metadata?: Record<string, unknown>;
  };
  const trimmedName = body?.name?.trim();
  if (body?.name !== undefined && !trimmedName)
    return sumupErrorResponse("Reader name cannot be empty", 400);

  if (trimmedName === undefined && body?.metadata === undefined)
    return sumupErrorResponse("Name or metadata is required", 400);

  try {
    const reader = await withSumUp((client) =>
      client.readers.update(SUMUP_MERCHANT_CODE!, readerId, {
        ...(trimmedName !== undefined ? { name: trimmedName } : {}),
        ...(body?.metadata !== undefined ? { metadata: body.metadata } : {}),
      })
    );
    return NextResponse.json({ success: true, reader });
  } catch (error) {
    return sumupErrorResponse(error, undefined, { readerId });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ readerId: string }> }
) {
  const auth = await verifyPermission("shop:write");
  if (auth.error) return auth.error;

  const credentialCheck = validateSumUpCredentials();
  if (credentialCheck) return credentialCheck;

  const { readerId } = await params;
  if (!readerId) return sumupErrorResponse("readerId is required", 400);

  try {
    await withSumUp((client) => client.readers.delete(SUMUP_MERCHANT_CODE!, readerId));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SumUpAuthError) return sumupErrorResponse(error);
    console.error("SumUp reader delete failed", {
      merchantCode: SUMUP_MERCHANT_CODE,
      readerId,
      error: formatSumUpError(error),
    });

    try {
      await withSumUp((client) => client.readers.get(SUMUP_MERCHANT_CODE!, readerId));
      return sumupErrorResponse("Failed to delete reader", getErrorStatus(error), {
        details: formatSumUpError(error),
      });
    } catch (verifyErr) {
      const verifyStatus = getErrorStatus(verifyErr);
      if (verifyStatus === 404)
        return NextResponse.json({
          success: true,
          verified: true,
          alreadyDeleted: true,
        });

      console.error("SumUp reader delete verification threw", {
        merchantCode: SUMUP_MERCHANT_CODE,
        readerId,
        error: formatSumUpError(verifyErr),
      });
      return sumupErrorResponse("Failed to delete reader", getErrorStatus(error), {
        sdk: formatSumUpError(error),
        verify: formatSumUpError(verifyErr),
      });
    }
  }
}
