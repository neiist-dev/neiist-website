import { normalizeText } from "@/utils/searchUtils";
import MiniSearch from "minisearch";
import type { User } from "@/types/user";

let cachedUsersRef: User[] | null = null;
let cachedIndex: MiniSearch<User> | null = null;
let cachedUserMap: Map<string, User> | null = null;

export function getUserSearchIndex(allUsers: User[]) {
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

