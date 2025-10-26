export interface NotionPage {
  id: string;
  url: string;
  properties: NotionPageProperties;
}

export interface NotionPageProperties {
  Name?: {
    title: { plain_text: string }[];
  };
  Date?: {
    date: { start: string | null; end: string | null };
  };
  Location?: {
    multi_select: { name: string }[];
  };
  Type?: {
    select: { name: string } | null;
  };
  Teams?: {
    multi_select: { name: string }[];
  };
  Attendees?: {
    people: NotionPerson[];
  };
  "Related Events"?: {
    relation: { id: string }[];
  };
}

export interface NotionEvent {
  id: string;
  title: string;
  date: string | null;
  end: string | null;
  url: string;
  location: string[];
  type: string | null;
  teams: string[];
  attendees: string[];
}

export interface NotionPerson {
  name: string;
  person?: { email?: string };
}

export interface NotionApiResponse {
  results: NotionPage[];
  has_more: boolean;
  next_cursor?: string;
}
