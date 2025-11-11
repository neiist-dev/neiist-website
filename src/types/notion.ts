export interface NotionPage {
  id: string;
  url: string;
  properties: NotionPageProperties;
  last_edited_time: string;
}

export interface NotionPageProperties {
  Name?: {
    title: { plain_text: string }[];
  };
  Date?: {
    date: { start: string | null; end: string | null } | null;
  };
  Location?: {
    select: { name: string } | null;
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
  lastEditedTime: string;
}

export interface NotionPerson {
  name?: string;
  person?: { email?: string };
}

// Better typed response from Notion API
export interface NotionApiResponse {
  results: NotionPageResult[];
  has_more: boolean;
  next_cursor?: string | null;
}

// Raw result from Notion API before mapping
export interface NotionPageResult {
  id: string;
  url: string;
  properties: Record<string, unknown>;
  last_edited_time: string;
}

// Helper to safely map Notion API results to NotionPage
export function mapNotionResultToPage(result: NotionPageResult): NotionPage {
  return {
    id: result.id,
    url: result.url,
    properties: result.properties as NotionPageProperties,
    last_edited_time: result.last_edited_time,
  };
}
