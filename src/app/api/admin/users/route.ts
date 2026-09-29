import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/utils/apiErrorUtils";
import { getAllUsers, createUser } from "@/lib/db/repositories/user.repository";
import { verifyPermission } from "@/lib/auth";
import { normalizeText, normalizeIstId, isIstIdQuery } from "@/utils/searchUtils";
import { getUserSearchIndex, isValidEmail, isValidIstId } from "@/lib/services/admin";

export async function GET(request: NextRequest) {
  const auth = await verifyPermission("users:read");
  if (auth.error) return auth.error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const searchParam = searchParams.get("search");

    if (pageParam !== null || limitParam !== null || searchParam !== null) {
      const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(limitParam || "50", 10) || 50));
      const rawSearch = searchParam?.trim() || "";

      const allUsers = await getAllUsers();
      let filtered = allUsers;

      if (rawSearch) {
        if (isIstIdQuery(rawSearch)) {
          const istDigits = normalizeIstId(rawSearch);
          filtered = allUsers.filter(
            (u) =>
              normalizeIstId(u.istid).includes(istDigits) ||
              u.istid.toLowerCase().includes(rawSearch.toLowerCase())
          );
        } else {
          const { ms, userMap } = getUserSearchIndex(allUsers);
          const hits = ms.search(normalizeText(rawSearch));
          filtered = hits.map((hit) => userMap.get(hit.id as string)!).filter(Boolean);
        }
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const start = (page - 1) * limit;
      const paginatedUsers = filtered.slice(start, start + limit);

      return NextResponse.json({
        users: paginatedUsers,
        total,
        page,
        limit,
        totalPages,
      });
    }

    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyPermission("users:write");
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { istid, name, email } = body;

    if (!istid || !name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: istid, name, and email are required" },
        { status: 400 }
      );
    }

    const validIstId = isValidIstId(istid);
    if (!validIstId) {
      return NextResponse.json(
        { error: "Invalid IST ID format. Must be in format: istXXXXXX" },
        { status: 400 }
      );
    }

    const validEmail = isValidEmail(email);
    if (!validEmail) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const newUser = await createUser({
      istid: validIstId,
      name: name.trim(),
      email: validEmail,
    });
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
