import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://neiist.tecnico.ulisboa.pt";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/about-us`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/activities`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    { url: `${base}/shop`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/dinner`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];
}
