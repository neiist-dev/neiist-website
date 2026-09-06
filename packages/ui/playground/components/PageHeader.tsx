import React from "react";
import { Heading, Text } from "@neiist/ui";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <Heading level={1} className={styles.title}>
        {title}
      </Heading>
      <Text variant="muted" className={styles.description}>
        {description}
      </Text>
    </header>
  );
}
