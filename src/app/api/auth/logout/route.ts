import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL));

  response.cookies.set("accessToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });

  response.cookies.set("userData", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });

  return response;
}
