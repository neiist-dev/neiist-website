import { NextRequest, NextResponse } from "next/server";
import { serverCheckRoles } from "@/utils/permissionUtils";

const SUMUP_API_KEY = process.env.SUMUP_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      checkoutId?: string;
      validationUrl?: string;
    };
    const { checkoutId, validationUrl } = body ?? {};

    if (!checkoutId || !validationUrl) {
      return NextResponse.json({ error: "Missing checkoutId or validationUrl" }, { status: 400 });
    }

    const auth = await serverCheckRoles([]);
    if (!auth.isAuthorized) return auth.error;

    if (!SUMUP_API_KEY) {
      return NextResponse.json({ error: "Payment service misconfigured" }, { status: 500 });
    }

    const domain = BASE_URL ? new URL(BASE_URL).hostname : (req.headers.get("host") ?? "");

    const response = await fetch(
      `https://api.sumup.com/v0.1/checkouts/${checkoutId}/apple-pay-session`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${SUMUP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target: validationUrl, context: domain }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error("SumUp apple-pay-session error:", errBody);
      return NextResponse.json(
        { error: "Merchant validation failed" },
        { status: response.status }
      );
    }

    const session = await response.json();
    return NextResponse.json(session);
  } catch (err) {
    console.error("apple-pay-session route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
