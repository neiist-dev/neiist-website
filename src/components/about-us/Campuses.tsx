"use client";

import { Tabs } from "@neiist/ui";
import styles from "@/styles/components/about-us/Campuses.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface CampusesProps {
  dict: Dictionary["about_us_page"]["campuses"];
}

export default function Campuses({ dict }: CampusesProps) {
  const tabs = [
    {
      id: "alameda",
      name: dict.alameda_title,
      content: <p className={styles.room}>{dict.alameda_room}</p>,
    },
    {
      id: "taguspark",
      name: dict.taguspark_title,
      content: <p className={styles.room}>{dict.taguspark_room}</p>,
    },
  ];

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>{dict.title}</h2>
        <p className={styles.description}>{dict.description}</p>
      </header>
      <Tabs tabs={tabs} align="center" />
    </section>
  );
}
