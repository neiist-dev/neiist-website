"use client";

import { useMemo } from "react";
import { Terminal } from "one-terminal";
import { getTerminalVfs } from "./TerminalVfs";
import styles from "@/styles/components/terminal/HeroTerminal.module.css";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/i18n-config";

interface HeroTerminalProps {
  locale: Locale;
  dict: Dictionary["terminal"];
}

export default function HeroTerminal({ locale, dict }: HeroTerminalProps) {
  const vfs = useMemo(() => getTerminalVfs(locale, dict), [locale, dict]);

  return (
    <aside className={styles.terminalWrapper} aria-label="Terminal">
      <Terminal
        fileStructure={vfs}
        theme="dracula"
        windowChrome={["mac", { titleBarText: "Terminal" }]}
        prompt="guest@~:$ "
        welcomeMessage={dict.welcome}
      />
    </aside>
  );
}
