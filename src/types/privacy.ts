export interface DataCollectedItem {
  data: string;
  purpose: string;
  legal_basis: string;
}

export interface ListItem {
  label?: string;
  text: string;
}

export interface SubsectionItem {
  title: string;
  paragraphs: string[];
  items: string[];
}

export interface ControllerSection {
  type: "controller";
  id: string;
  title: string;
  intro: string;
  organization: string;
  address: string;
  email_label: string;
  email: string;
  dpo_note: string;
  complaint_text: string;
  authority_name: string;
  authority_url: string;
}

export interface TableSection {
  type: "table";
  id: string;
  title: string;
  headers: string[];
  rows: DataCollectedItem[];
}

export interface ListSection {
  type: "list";
  id: string;
  title: string;
  intro?: string;
  items: ListItem[];
  outro?: string;
  subsections?: SubsectionItem[];
}

export interface ParagraphsSection {
  type: "paragraphs";
  id: string;
  title: string;
  paragraphs: string[];
}

export type PrivacySection = ControllerSection | TableSection | ListSection | ParagraphsSection;
