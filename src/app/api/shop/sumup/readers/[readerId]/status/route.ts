import { NextResponse } from "next/server";
import { validateSumUpCredentials, withSumUp, sumupErrorResponse } from "@/lib/sumup";
import { UserRole } from "@/types/user";
import type { SumUpReaderStatus } from "@/types/sumup";
import { serverCheckRoles } from "@/lib/auth";

const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_CODE;

async function authorize() {
  const auth = await serverCheckRoles([UserRole._SHOP_MANAGER, UserRole._ADMIN]);
  if (!auth.isAuthorized) return { error: auth.error };

  return { success: true };
}

export async function GET(_req: Request, { params }: { params: Promise<{ readerId: string }> }) {
  const auth = await authorize();
  if (auth.error) return auth.error;

  const credentialError = validateSumUpCredentials();
  if (credentialError) return credentialError;

  const { readerId } = await params;
  if (!readerId) return sumupErrorResponse("readerId is required", 400);

  try {
    const status = (await withSumUp((client) =>
      client.readers.get(SUMUP_MERCHANT_CODE!, readerId)
    )) as SumUpReaderStatus;
    return NextResponse.json({ success: true, status });
  } catch (error) {
    return sumupErrorResponse(error, undefined, { readerId });
  }
}
