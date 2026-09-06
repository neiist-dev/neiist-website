import React from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Card, CardHeader, CardBody, Text, Stack } from "@neiist/ui";

export default function CardDemo() {
  return (
    <>
      <PageHeader title="Card" description="Documentation and examples for the Card component." />

      <DemoCard title="Basic">
        <Stack style={{ maxWidth: 400 }}>
          <Card variant="elevated">
            <CardHeader title="Project Details" description="Manage your project settings here." />
            <CardBody>
              <Text variant="muted">This is the body of the card where content goes.</Text>
            </CardBody>
          </Card>
        </Stack>
      </DemoCard>
    </>
  );
}
