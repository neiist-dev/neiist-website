import React from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Heading, Stack } from "@neiist/ui";

export default function HeadingDemo() {
  const levels = [1, 2, 3, 4, 5, 6] as const;

  return (
    <>
      <PageHeader
        title="Heading"
        description="Documentation and examples for the Heading component."
      />

      <DemoCard title="Basic">
        <Stack gap="md">
          {levels.map((level) => (
            <Heading key={level} level={level}>
              Heading Level {level}
            </Heading>
          ))}
        </Stack>
      </DemoCard>
    </>
  );
}
