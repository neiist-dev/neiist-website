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
