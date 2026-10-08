import type { DirectoryNode, FileNode, FSNode } from "one-terminal";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/i18n-config";

const text = (content: string): FileNode => ({
  kind: "file",
  fileType: "text",
  content,
});

const link = (href: string, label: string): FileNode => ({
  kind: "file",
  fileType: "link",
  href,
  label,
});

const dir = (entries: Record<string, FSNode>): DirectoryNode => ({
  kind: "directory",
  entries,
});

const filesFrom = (items: { file: string; content: string }[]): Record<string, FileNode> =>
  Object.fromEntries(items.map(({ file, content }) => [file, text(content)]));

export function getTerminalVfs(locale: Locale, dict: Dictionary["terminal"]): DirectoryNode {
  const { fs } = dict;

  const aboutDir = dir({
    [fs.mission]: text(dict.about.mission),
    [fs.departments]: dir(filesFrom(dict.about.departments)),
    [fs.bodies]: text(dict.about.bodies),
    [fs.statutes]: link("/estatutos.pdf", dict.about.statutes_label),
  });

  const campusDir = dir({
    "alameda.txt": text(dict.campuses.alameda),
    "taguspark.txt": text(dict.campuses.taguspark),
  });

  const courseDir = dir({
    "leic-a.txt": link("https://fenix.tecnico.ulisboa.pt/cursos/leic-a", dict.courses.leic_a),
    "leic-t.txt": link("https://fenix.tecnico.ulisboa.pt/cursos/leic-t", dict.courses.leic_t),
    "meic-a.txt": link("https://fenix.tecnico.ulisboa.pt/cursos/meic-a", dict.courses.meic_a),
    "meic-t.txt": link("https://fenix.tecnico.ulisboa.pt/cursos/meic-t", dict.courses.meic_t),
    "deic.txt": link("https://fenix.tecnico.ulisboa.pt/cursos/deic", dict.courses.deic),
  });

  const activityDir = dir({
    ...filesFrom(dict.activities.events),
    [fs.dinner]: link(`/${locale}/dinner`, dict.activities.dinner_link),
    [fs.calendar]: link(`/${locale}/activities`, dict.activities.calendar_link),
  });

  const shopDir = dir({
    [fs.catalog]: text(dict.shop.catalog),
    [fs.shop_link]: link(`/${locale}/shop`, dict.shop.shop_link),
  });

  const contactDir = dir({
    [fs.contacts_info]: text(dict.contacts.info),
    "instagram.txt": link("https://instagram.com/NEIIST", dict.contacts.instagram),
    "github.txt": link("https://github.com/neiist-dev", dict.contacts.github),
    "discord.txt": link("https://linktr.ee/NEIIST", dict.contacts.discord),
    "linkedin.txt": link("https://www.linkedin.com/company/neiist/", dict.contacts.linkedin),
  });

  return dir({
    "README.md": text(dict.welcome),
    [fs.about]: aboutDir,
    [fs.campuses]: campusDir,
    [fs.courses]: courseDir,
    [fs.activities]: activityDir,
    [fs.shop]: shopDir,
    [fs.contacts]: contactDir,
    "sinfo.txt": link("https://sinfo.org", dict.sinfo),
  });
}
