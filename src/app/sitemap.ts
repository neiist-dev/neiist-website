import type { MetadataRoute } from "next";
import { locales } from "@/i18n/i18n-config";

const base = "https://neiist.tecnico.ulisboa.pt";

interface RouteConfig {
  path: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

const routes: RouteConfig[] = [
  { path: "", changeFrequency: "daily", priority: 1.0 },
  { path: "/about-us", changeFrequency: "monthly", priority: 0.8 },
  { path: "/activities", changeFrequency: "daily", priority: 0.9 },
  { path: "/shop", changeFrequency: "weekly", priority: 0.8 },
  { path: "/voting", changeFrequency: "weekly", priority: 0.7 },
  { path: "/dinner", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    const alternateLanguages: Record<string, string> = {};
    for (const locale of locales) {
      alternateLanguages[locale] = `${base}/${locale}${route.path}`;
    }

    for (const locale of locales) {
      entries.push({
        url: `${base}/${locale}${route.path}`,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: alternateLanguages,
        },
      });
    }
  }

  return entries;
}
