"use client";

import { useMemo } from "react";
import { Terminal } from "one-terminal";
import type { ExtraCommands, NeofetchConfig } from "one-terminal";
import { getTerminalVfs } from "./TerminalVfs";
import styles from "@/styles/components/terminal/HeroTerminal.module.css";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/i18n-config";

const NEIIST_ASCII_LOGO = [
  "  _   _ _____ ___ ___ ____ _____",
  " | \\ | | ____|_ _|_ _/ ___|_   _|",
  " |  \\| |  _|  | | | |\\___ \\ | |",
  " | |\\  | |___ | | | | ___) || |",
  " |_| \\_|_____|___|___|____/ |_|",
].join("\n");

interface HeroTerminalProps {
  locale: Locale;
  dict: Dictionary["terminal"];
  onStartGame?: () => void;
}

export default function HeroTerminal({ locale, dict, onStartGame }: HeroTerminalProps) {
  const vfs = useMemo(() => getTerminalVfs(locale, dict), [locale, dict]);

  const neofetch = useMemo<NeofetchConfig>(
    () => ({
      logo: NEIIST_ASCII_LOGO,
      info: {
        [dict.neofetch.labels.org]: dict.neofetch.values.org,
        [dict.neofetch.labels.institute]: dict.neofetch.values.institute,
        [dict.neofetch.labels.alameda]: dict.neofetch.values.alameda,
        [dict.neofetch.labels.taguspark]: dict.neofetch.values.taguspark,
        [dict.neofetch.labels.courses]: dict.neofetch.values.courses,
        [dict.neofetch.labels.website]: dict.neofetch.values.website,
        [dict.neofetch.labels.github]: dict.neofetch.values.github,
      },
    }),
    [dict.neofetch]
  );

  const extraCommands = useMemo<ExtraCommands>(
    () => ({
      game: {
        description: dict.game_description,
        run: () => {
          onStartGame?.();
          return "Starting Campus Runner...";
        },
      },
    }),
    [dict.game_description, onStartGame]
  );

  return (
    <div className={styles.terminalWrapper}>
      <Terminal
        fileStructure={vfs}
        startPath="/home/neiist"
        hostname="neiist.tecnico.ulisboa.pt"
        neofetch={neofetch}
        theme="dracula"
        windowChrome={["mac", { titleBarText: "Terminal" }]}
        prompt="guest@{cwd}:$ "
        welcomeMessage={dict.welcome}
        extraCommands={extraCommands}
      />
    </div>
  );
}
