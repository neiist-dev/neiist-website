import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromJWT } from "@/utils/authUtils";
import { removeUser } from "@/utils/dbUtils";

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    const jwtUser = getUserFromJWT(sessionToken);

    if (!jwtUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const result = await removeUser(jwtUser.istid);

    if (!result.success) {
      if (result.error === "member_of_department") {
        return NextResponse.json(
          {
            error:
              "Não é possível apagar os dados de um membro de uma equipa ou corpo diretivo. Contacta um administrador.",
          },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }

    const res = NextResponse.json({ success: true });

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
    };
    res.cookies.set("access_token", "", cookieOpts);
    res.cookies.set("session", "", cookieOpts);
    res.cookies.set("refresh_token", "", cookieOpts);
    res.cookies.set("fenix_oauth_state", "", cookieOpts);

    return res;
  } catch (error) {
    console.error("Error deleting user data:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
