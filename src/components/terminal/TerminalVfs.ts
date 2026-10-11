import type { DirectoryNode } from "one-terminal";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/i18n-config";

export function getTerminalVfs(locale: Locale, dict: Dictionary["terminal"]): DirectoryNode {
  const { fs } = dict;

  const departmentEntries: DirectoryNode["entries"] = Object.fromEntries(
    dict.about.departments.map((dept) => [
      dept.file,
      { kind: "file", fileType: "text", content: dept.content },
    ])
  );

  const eventEntries: DirectoryNode["entries"] = Object.fromEntries(
    dict.activities.events.map((event) => [
      event.file,
      { kind: "file", fileType: "text", content: event.content },
    ])
  );

  return {
    kind: "directory",
    entries: {
      home: {
        kind: "directory",
        entries: {
          neiist: {
            kind: "directory",
            entries: {
              "README.md": {
                kind: "file",
                fileType: "text",
                content: dict.welcome,
              },
              ".bashrc": {
                kind: "file",
                fileType: "text",
                content: "# ~/.bashrc\nexport USER=guest\nalias ll='ls -la'",
              },
              ".profile": {
                kind: "file",
                fileType: "text",
                content: '# ~/.profile\nPATH="/usr/bin:$PATH"',
              },
              [fs.about]: {
                kind: "directory",
                entries: {
                  [fs.mission]: {
                    kind: "file",
                    fileType: "text",
                    content: dict.about.mission,
                  },
                  [fs.departments]: {
                    kind: "directory",
                    entries: departmentEntries,
                  },
                  [fs.bodies]: {
                    kind: "file",
                    fileType: "text",
                    content: dict.about.bodies,
                  },
                  [fs.statutes]: {
                    kind: "file",
                    fileType: "link",
                    href: "/estatutos.pdf",
                    label: dict.about.statutes_label,
                  },
                },
              },
              [fs.campuses]: {
                kind: "directory",
                entries: {
                  "alameda.txt": {
                    kind: "file",
                    fileType: "text",
                    content: dict.campuses.alameda,
                  },
                  "taguspark.txt": {
                    kind: "file",
                    fileType: "text",
                    content: dict.campuses.taguspark,
                  },
                },
              },
              [fs.courses]: {
                kind: "directory",
                entries: {
                  "leic-a.txt": {
                    kind: "file",
                    fileType: "link",
                    href: "https://fenix.tecnico.ulisboa.pt/cursos/leic-a",
                    label: dict.courses.leic_a,
                  },
                  "leic-t.txt": {
                    kind: "file",
                    fileType: "link",
                    href: "https://fenix.tecnico.ulisboa.pt/cursos/leic-t",
                    label: dict.courses.leic_t,
                  },
                  "meic-a.txt": {
                    kind: "file",
                    fileType: "link",
                    href: "https://fenix.tecnico.ulisboa.pt/cursos/meic-a",
                    label: dict.courses.meic_a,
                  },
                  "meic-t.txt": {
                    kind: "file",
                    fileType: "link",
                    href: "https://fenix.tecnico.ulisboa.pt/cursos/meic-t",
                    label: dict.courses.meic_t,
                  },
                  "deic.txt": {
                    kind: "file",
                    fileType: "link",
                    href: "https://fenix.tecnico.ulisboa.pt/cursos/deic",
                    label: dict.courses.deic,
                  },
                },
              },
              [fs.activities]: {
                kind: "directory",
                entries: {
                  ...eventEntries,
                  [fs.dinner]: {
                    kind: "file",
                    fileType: "link",
                    href: `/${locale}/dinner`,
                    label: dict.activities.dinner_link,
                  },
                  [fs.calendar]: {
                    kind: "file",
                    fileType: "link",
                    href: `/${locale}/activities`,
                    label: dict.activities.calendar_link,
                  },
                },
              },
              [fs.shop]: {
                kind: "directory",
                entries: {
                  [fs.catalog]: {
                    kind: "file",
                    fileType: "text",
                    content: dict.shop.catalog,
                  },
                  [fs.shop_link]: {
                    kind: "file",
                    fileType: "link",
                    href: `/${locale}/shop`,
                    label: dict.shop.shop_link,
                  },
                },
              },
              [fs.contacts]: {
                kind: "directory",
                entries: {
                  [fs.contacts_info]: {
                    kind: "file",
                    fileType: "text",
                    content: dict.contacts.info,
                  },
                  "instagram.txt": {
                    kind: "file",
                    fileType: "link",
                    href: "https://instagram.com/NEIIST",
                    label: dict.contacts.instagram,
                  },
                  "github.txt": {
                    kind: "file",
                    fileType: "link",
                    href: "https://github.com/neiist-dev",
                    label: dict.contacts.github,
                  },
                  "discord.txt": {
                    kind: "file",
                    fileType: "link",
                    href: "https://linktr.ee/NEIIST",
                    label: dict.contacts.discord,
                  },
                  "linkedin.txt": {
                    kind: "file",
                    fileType: "link",
                    href: "https://www.linkedin.com/company/neiist/",
                    label: dict.contacts.linkedin,
                  },
                },
              },
              "sinfo.txt": {
                kind: "file",
                fileType: "link",
                href: "https://sinfo.org",
                label: dict.sinfo,
              },
            },
          },
        },
      },
      etc: {
        kind: "directory",
        entries: {
          motd: {
            kind: "file",
            fileType: "text",
            content:
              "Welcome to NEIIST Terminal! Type 'help' for available commands or 'game' to play.",
          },
          hosts: {
            kind: "file",
            fileType: "text",
            content: "127.0.0.1 localhost\n127.0.1.1 neiist.tecnico.ulisboa.pt",
          },
        },
      },
      var: {
        kind: "directory",
        entries: {
          log: {
            kind: "directory",
            entries: {
              syslog: {
                kind: "file",
                fileType: "text",
                content: "Terminal initialized successfully.",
              },
            },
          },
        },
      },
      tmp: {
        kind: "directory",
        entries: {
          ".keep": {
            kind: "file",
            fileType: "text",
            content: "Temporary files live here.",
          },
        },
      },
      "README-root.txt": {
        kind: "file",
        fileType: "text",
        content:
          "You are at the root of the virtual file system. NEIIST files are located at /home/neiist.",
      },
    },
  };
}
