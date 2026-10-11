"use client";

import { useMemo } from "react";
import { Terminal, type ExtraCommands } from "one-terminal";
import { getTerminalVfs } from "./TerminalVfs";
import styles from "@/styles/components/terminal/HeroTerminal.module.css";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/i18n-config";

interface HeroTerminalProps {
  locale: Locale;
  dict: Dictionary["terminal"];
  onStartGame?: () => void;
}

export default function HeroTerminal({ locale, dict, onStartGame }: HeroTerminalProps) {
  const vfs = useMemo(() => getTerminalVfs(locale, dict), [locale, dict]);

  const extraCommands = useMemo<ExtraCommands>(
    () => ({
      game: {
        run: () => {
          onStartGame?.();
          return "Starting Campus Runner...";
        },
      },
    }),
    [onStartGame]
  );

  return (
    <div className={styles.terminalWrapper}>
      <Terminal
        fileStructure={vfs}
        startPath="/home/neiist"
        theme="dracula"
        windowChrome={["mac", { titleBarText: "Terminal" }]}
        prompt="guest@{cwd}:$ "
        welcomeMessage={dict.welcome}
        extraCommands={extraCommands}
      />
    </div>
  );
}
