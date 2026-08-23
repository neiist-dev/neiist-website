export type FenixRegistration = {
  degree?: {
    name?: { [locale: string]: string } | string | null;
    acronym?: string | null;
  } | null;
};

export type FenixPersonResponse = {
  username?: string;
  name?: string;
  displayName?: string;
  email?: string;
  institutionalEmail?: string;
  phone?: string;
  roles?: {
    student?: {
      registrations?: FenixRegistration[];
    };
  };
  photo?: {
    data?: string;
  };
};

export type FenixOAuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number | string;
};

export function extractCourses(registrations: FenixRegistration[] = []): string[] {
  const courses = new Set<string>();
  for (const reg of registrations) {
    const degree = reg?.degree;
    if (!degree) continue;
    const rawName =
      typeof degree.name === "object"
        ? (degree.name?.["pt-PT"] ?? degree.name?.["en-GB"])
        : degree.name;
    const name = (rawName || degree.acronym)?.trim();
    if (name) courses.add(name);
  }
  return Array.from(courses);
}
