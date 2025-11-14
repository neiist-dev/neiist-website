import type { StaticImageData } from "next/image";

export interface Event {
  id: string;
  title: string;
  description: string;
  image: string | StaticImageData;
}
