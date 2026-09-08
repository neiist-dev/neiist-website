import type { DirectoryNode, FileNode } from "one-terminal";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/i18n-config";

export function getTerminalVfs(locale: Locale, dict: Dictionary["terminal"]): DirectoryNode {
  const missionFile: FileNode = {
    kind: "file",
    fileType: "text",
    content: dict.about.mission,
  };

  const departmentsFile: FileNode = {
    kind: "file",
    fileType: "text",
    content: dict.about.departments,
  };

  const bodiesFile: FileNode = {
    kind: "file",
    fileType: "text",
    content: dict.about.bodies,
  };

  const statutesFile: FileNode = {
    kind: "file",
    fileType: "link",
    href: "/estatutos.pdf",
    label: dict.about.statutes_label,
  };

  const alamedaCampusFile: FileNode = {
    kind: "file",
    fileType: "text",
    content: dict.campuses.alameda,
  };

  const tagusparkCampusFile: FileNode = {
    kind: "file",
    fileType: "text",
    content: dict.campuses.taguspark,
  };

  const leicAFile: FileNode = {
    kind: "file",
    fileType: "link",
    href: "https://fenix.tecnico.ulisboa.pt/cursos/leic-a",
    label: dict.courses.leic_a,
  };

  const leicTFile: FileNode = {
    kind: "file",
    fileType: "link",
    href: "https://fenix.tecnico.ulisboa.pt/cursos/leic-t",
    label: dict.courses.leic_t,
  };

  const meicAFile: FileNode = {
    kind: "file",
    fileType: "link",
    href: "https://fenix.tecnico.ulisboa.pt/cursos/meic-a",
    label: dict.courses.meic_a,
  };

  const meicTFile: FileNode = {
    kind: "file",
    fileType: "link",
    href: "https://fenix.tecnico.ulisboa.pt/cursos/meic-t",
    label: dict.courses.meic_t,
  };

  const deicFile: FileNode = {
    kind: "file",
    fileType: "link",
    href: "https://fenix.tecnico.ulisboa.pt/cursos/deic",
    label: dict.courses.deic,
  };

  const eventsFile: FileNode = {
    kind: "file",
    fileType: "text",
    content: dict.activities.events,
  };

  const dinnerFile: FileNode = {
    kind: "file",
    fileType: "link",
    href: `/${locale}/dinner`,
    label: dict.activities.dinner_link,
  };

  const calendarFile: FileNode = {
    kind: "file",
    fileType: "link",
    href: `/${locale}/activities`,
    label: dict.activities.calendar_link,
  };

  const catalogFile: FileNode = {
    kind: "file",
    fileType: "text",
    content: dict.shop.catalog,
  };

  const shopLinkFile: FileNode = {
    kind: "file",
    fileType: "link",
    href: `/${locale}/shop`,
    label: dict.shop.shop_link,
  };

  const contactsFile: FileNode = {
    kind: "file",
    fileType: "text",
    content: dict.contacts.info,
  };

  const instagramFile: FileNode = {
    kind: "file",
    fileType: "link",
    href: "https://instagram.com/NEIIST",
    label: dict.contacts.instagram,
  };

  const githubFile: FileNode = {
    kind: "file",
    fileType: "link",
    href: "https://github.com/neiist-dev",
    label: dict.contacts.github,
  };

  const discordFile: FileNode = {
    kind: "file",
    fileType: "link",
    href: "https://linktr.ee/NEIIST",
    label: dict.contacts.discord,
  };

  const linkedinFile: FileNode = {
    kind: "file",
    fileType: "link",
    href: "https://www.linkedin.com/company/neiist/",
    label: dict.contacts.linkedin,
  };

  const sinfoFile: FileNode = {
    kind: "file",
    fileType: "link",
    href: "https://sinfo.org",
    label: dict.sinfo,
  };

  const isEn = locale === "en";

  const aboutEntries: Record<string, FileNode> = isEn
    ? {
        "mission.txt": missionFile,
        "departments.txt": departmentsFile,
        "administrative_bodies.txt": bodiesFile,
        "statutes.txt": statutesFile,
      }
    : {
        "missao.txt": missionFile,
        "departamentos.txt": departmentsFile,
        "orgaos_sociais.txt": bodiesFile,
        "estatutos.txt": statutesFile,
      };

  const campusEntries: Record<string, FileNode> = {
    "alameda.txt": alamedaCampusFile,
    "taguspark.txt": tagusparkCampusFile,
  };

  const courseEntries: Record<string, FileNode> = {
    "leic-a.txt": leicAFile,
    "leic-t.txt": leicTFile,
    "meic-a.txt": meicAFile,
    "meic-t.txt": meicTFile,
    "deic.txt": deicFile,
  };

  const activityEntries: Record<string, FileNode> = isEn
    ? {
        "events.txt": eventsFile,
        "course_dinner.txt": dinnerFile,
        "calendar.txt": calendarFile,
      }
    : {
        "eventos.txt": eventsFile,
        "jantar_curso.txt": dinnerFile,
        "calendario.txt": calendarFile,
      };

  const shopEntries: Record<string, FileNode> = isEn
    ? {
        "catalog.txt": catalogFile,
        "shop.txt": shopLinkFile,
      }
    : {
        "catalogo.txt": catalogFile,
        "loja.txt": shopLinkFile,
      };

  const contactEntries: Record<string, FileNode> = {
    ...(isEn ? { "contacts.txt": contactsFile } : { "contactos.txt": contactsFile }),
    "instagram.txt": instagramFile,
    "github.txt": githubFile,
    "discord.txt": discordFile,
    "linkedin.txt": linkedinFile,
  };

  const aboutDir: DirectoryNode = { kind: "directory", entries: aboutEntries };
  const campusDir: DirectoryNode = { kind: "directory", entries: campusEntries };
  const courseDir: DirectoryNode = { kind: "directory", entries: courseEntries };
  const activityDir: DirectoryNode = { kind: "directory", entries: activityEntries };
  const shopDir: DirectoryNode = { kind: "directory", entries: shopEntries };
  const contactDir: DirectoryNode = { kind: "directory", entries: contactEntries };

  const rootEntries: Record<string, DirectoryNode | FileNode> = {
    "README.md": {
      kind: "file",
      fileType: "text",
      content: dict.welcome,
    },
    ...(isEn
      ? {
          about: aboutDir,
          campuses: campusDir,
          courses: courseDir,
          activities: activityDir,
          shop: shopDir,
          contacts: contactDir,
        }
      : {
          sobre: aboutDir,
          campi: campusDir,
          cursos: courseDir,
          atividades: activityDir,
          loja: shopDir,
          contactos: contactDir,
        }),
    "sinfo.txt": sinfoFile,
  };

  return {
    kind: "directory",
    entries: rootEntries,
  };
}
