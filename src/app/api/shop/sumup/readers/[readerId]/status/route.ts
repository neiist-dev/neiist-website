import { NextResponse } from "next/server";
import { serverCheckRoles } from "@/utils/permissionUtils";
import {
  validateSumUpCredentials,
  getSumUpClient,
  sumupErrorResponse,
  getErrorStatus,
} from "@/utils/sumupUtils";
import { UserRole } from "@/types/user";
import type { SumUpReaderStatus } from "@/types/sumup";

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

  const client = getSumUpClient();

  const { readerId } = await params;
  if (!readerId) return sumupErrorResponse("readerId is required", 400);

  let data: SumUpReaderStatus | null = null;
  try {
    data = (await client.readers.get(SUMUP_MERCHANT_CODE!, readerId)) as SumUpReaderStatus;
  } catch (error: unknown) {
    return sumupErrorResponse("Failed to fetch reader status", getErrorStatus(error), { readerId });
  }

  return NextResponse.json({ success: true, status: data });
}
