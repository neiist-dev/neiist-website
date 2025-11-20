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
  Public?: {
    checkbox: boolean;
  };
}

export interface NotionPerson {
  name?: string;
  person?: { email?: string };
}

export interface NotionApiResponse {
  results: NotionPageResult[];
  has_more: boolean;
  next_cursor?: string | null;
}

export interface NotionPageResult {
  id: string;
  url: string;
  properties: Record<string, unknown>;
  last_edited_time: string;
}

export function mapNotionResultToPage(result: NotionPageResult): NotionPage {
  return {
    id: result.id,
    url: result.url,
    properties: result.properties as NotionPageProperties,
    last_edited_time: result.last_edited_time,
  };
}
