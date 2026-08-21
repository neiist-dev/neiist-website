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

export function extractCourses(registrations: FenixRegistration[]): string[] {
  return [
    ...new Set(
      registrations
        .map((registration) => {
          const nameField = registration?.degree?.name;
          if (nameField && typeof nameField === "object") {
            return (
              nameField["pt-PT"] ??
              nameField["en-GB"] ??
              Object.values(nameField)[0] ??
              registration?.degree?.acronym ??
              null
            );
          }
          return (nameField as string) ?? registration?.degree?.acronym ?? null;
        })
        .filter((course): course is string => Boolean(course))
    ),
  ];
}
