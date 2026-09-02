import { NextRequest, NextResponse } from "next/server";
import {
  validateSumUpCredentials,
  withSumUp,
  sumupErrorResponse,
  getErrorStatus,
  formatSumUpError,
  SumUpAuthError,
} from "@/lib/sumup";
import { UserRole } from "@/types/user";
import type { SumUpReadersListResponse } from "@/types/sumup";
import { serverCheckRoles } from "@/lib/auth";

const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_CODE;

type SumUpProblem = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
};

function parseSumUpProblem(error: unknown): SumUpProblem | null {
  if (!error || typeof error !== "object") return null;

  const maybeError = error as { error?: SumUpProblem };
  if (maybeError.error && typeof maybeError.error === "object") {
    return maybeError.error;
  }

  return null;
}

async function authorize() {
  const auth = await serverCheckRoles([UserRole._SHOP_MANAGER, UserRole._ADMIN]);
  if (!auth.isAuthorized) return { error: auth.error };

  return { success: true };
}

export async function GET() {
  const auth = await authorize();
  if (auth.error) return auth.error;

  const credentialError = validateSumUpCredentials();
  if (credentialError) return credentialError;

  try {
    const data = (await withSumUp((client) =>
      client.readers.list(SUMUP_MERCHANT_CODE!)
    )) as SumUpReadersListResponse;
    return NextResponse.json({ readers: data.items ?? [] });
  } catch (err) {
    return sumupErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorize();
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
    if (error instanceof SumUpAuthError) return sumupErrorResponse(error);
    const status = getErrorStatus(error);
    const problem = parseSumUpProblem(error);
    const detail = problem?.detail || problem?.title;

    return sumupErrorResponse(detail || "Failed to create reader", status, {
      details: formatSumUpError(error),
    });
  }
}
