import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/utils/apiErrorUtils";
import { getAllUsers, createUser } from "@/lib/db/repositories/user.repository";
import { verifyPermission } from "@/lib/auth";
import { normalizeText, normalizeIstId, isIstIdQuery } from "@/utils/searchUtils";
import MiniSearch from "minisearch";
import type { User } from "@/types/user";

let cachedUsersRef: User[] | null = null;
let cachedIndex: MiniSearch<User> | null = null;
let cachedUserMap: Map<string, User> | null = null;

function getUserSearchIndex(allUsers: User[]) {
  if (cachedIndex && cachedUserMap && cachedUsersRef === allUsers)
    return { ms: cachedIndex, userMap: cachedUserMap };

  const ms = new MiniSearch<User>({
    idField: "istid",
    fields: ["name", "email", "istid", "positionName", "teams", "courses"],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      combineWith: "AND",
    },
    extractField: (doc, fieldName) => {
      const val = (doc as unknown as Record<string, unknown>)[fieldName];
      if (Array.isArray(val)) return val.join(" ");
      return val ? String(val) : "";
    },
    processTerm: (term) => normalizeText(term) || undefined,
  });

  ms.addAll(allUsers);
  cachedUsersRef = allUsers;
  cachedIndex = ms;
  cachedUserMap = new Map(allUsers.map((u) => [u.istid, u]));

  return { ms, userMap: cachedUserMap };
}

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
    const istIdPattern = /^ist\d+$/i;
    if (!istIdPattern.test(istid.trim())) {
      return NextResponse.json(
        { error: "Invalid IST ID format. Must be in format: istXXXXXX" },
        { status: 400 }
      );
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    const newUser = await createUser({
      istid: istid.trim(),
      name: name.trim(),
      email: email.trim(),
    });
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
