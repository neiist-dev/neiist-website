import { NextResponse } from "next/server";

export async function GET() {
  const fenixLoginUrl = `https://fenix.tecnico.ulisboa.pt/oauth/userdialog?client_id=${process.env.FENIX_CLIENT_ID}&redirect_uri=${process.env.FENIX_REDIRECT_URI}`;
  return NextResponse.redirect(fenixLoginUrl);
}