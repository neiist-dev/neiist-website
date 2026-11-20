import { cacheTag } from "next/cache";
import MiniSearch from "minisearch";
import { getAllUsers } from "@/lib/db/repositories/user.repository";
import { normalizeText, normalizeIstId, isIstIdQuery } from "@/utils/searchUtils";
import type { User } from "@/types/user";

let cachedVersion: number | null = null;
let cachedIndex: MiniSearch<User> | null = null;
let cachedUserMap: Map<string, User> | null = null;

async function getCachedUsers() {
  "use cache";
  cacheTag("users");
  return { users: await getAllUsers(), version: Date.now() };
}

export async function searchUsers(rawSearch: string, page: number, limit: number) {
  const { users: allUsers, version } = await getCachedUsers();
  let filtered = allUsers;
  const query = rawSearch.trim();
  if (query) {
    if (isIstIdQuery(query)) {
      const istDigits = normalizeIstId(query);
      filtered = allUsers.filter(
        (u) =>
          normalizeIstId(u.istid).includes(istDigits) ||
          u.istid.toLowerCase().includes(query.toLowerCase())
      );
    } else {
      if (!cachedIndex || !cachedUserMap || cachedVersion !== version) {
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
        cachedVersion = version;
        cachedIndex = ms;
        cachedUserMap = new Map(allUsers.map((u) => [u.istid, u]));
      }
      const hits = cachedIndex.search(normalizeText(query));
      filtered = hits.map((hit) => cachedUserMap!.get(hit.id as string)!).filter(Boolean);
    }
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const users = filtered.slice(start, start + limit);
  return { users, total, page, limit, totalPages };
}
