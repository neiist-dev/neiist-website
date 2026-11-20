import type { ReactNode } from "react";

export interface CardItem {
  id: string;
  title: string;
  description: string;
  addInfo?: string[];
  image: ReactNode;
  link1?: string;
  link2?: string;
}
