import type { StaticImageData } from "next/image";

export interface CardItem {
  id: string;
  title: string;
  description: string;
  addInfo?: string[];
  image: string | StaticImageData;
  link1?: string;
  link2?: string;
}
