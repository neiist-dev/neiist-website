import { NextRequest, NextResponse } from "next/server";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { validateSumUpCredentials, sumupErrorResponse } from "@/utils/sumupUtils";

type ApplePaySessionRequestBody = {
  checkoutId?: string;
  validationUrl?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ApplePaySessionRequestBody;
    const { checkoutId, validationUrl } = body ?? {};

    if (!checkoutId || !validationUrl)
      return sumupErrorResponse("Missing checkoutId or validationUrl", 400);

    const auth = await serverCheckRoles([]);
    if (!auth.isAuthorized) return auth.error;

    const credentialError = validateSumUpCredentials();
    if (credentialError) return credentialError;

    const apiKey = process.env.SUMUP_API_KEY!;

    const domain = new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").hostname;
    const response = await fetch(
      `https://api.sumup.com/v0.1/checkouts/${checkoutId}/apple-pay-session`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target: validationUrl, context: domain }),
      }
    );

    if (!response.ok) return sumupErrorResponse("Merchant validation failed", response.status);

    const session = await response.json();
    return NextResponse.json(session);
  } catch {
    return sumupErrorResponse("Internal server error", 500);
  }
}
