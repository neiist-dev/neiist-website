import React from "react";
import { Card } from "@neiist/ui";
import styles from "./DemoCard.module.css";

interface DemoCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function DemoCard({ title, description, children }: DemoCardProps) {
  return (
    <Card variant="flat" className={styles.demoCard}>
      <Card.Header title={title} description={description} />
      <Card.Body>{children}</Card.Body>
    </Card>
  );
}
