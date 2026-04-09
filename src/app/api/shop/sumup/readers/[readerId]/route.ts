import { NextResponse } from "next/server";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { UserRole } from "@/types/user";
import {
  validateSumUpCredentials,
  getSumUpClient,
  getErrorStatus,
  sumupErrorResponse,
  formatSumUpError,
} from "@/utils/sumupUtils";

const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_CODE;

async function authorize() {
  const auth = await serverCheckRoles([UserRole._SHOP_MANAGER, UserRole._ADMIN]);
  if (!auth.isAuthorized) return { error: auth.error };
  return { success: true };
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ readerId: string }> }) {
  const auth = await authorize();
  if (auth.error) return auth.error;

  const credentialCheck = validateSumUpCredentials();
  if (credentialCheck) return credentialCheck;

  const client = getSumUpClient();
  const { readerId } = await params;

  if (!readerId) return sumupErrorResponse("readerId is required", 400);

  try {
    await client.readers.delete(SUMUP_MERCHANT_CODE!, readerId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SumUp reader delete failed", {
      merchantCode: SUMUP_MERCHANT_CODE,
      readerId,
      error: formatSumUpError(error),
    });

    try {
      await client.readers.get(SUMUP_MERCHANT_CODE!, readerId);

      return sumupErrorResponse("Failed to delete reader", getErrorStatus(error), {
        details: formatSumUpError(error),
      });
    } catch (verifyErr) {
      const verifyStatus = getErrorStatus(verifyErr);

      if (verifyStatus === 404) {
        return NextResponse.json({
          success: true,
          verified: true,
          alreadyDeleted: true,
        });
      }

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
