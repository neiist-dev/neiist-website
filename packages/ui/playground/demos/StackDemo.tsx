import React from "react";
import { Stack } from "@neiist/ui";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";

export default function StackDemo() {
  return (
    <>
      <PageHeader title="Stack" description="Documentation and examples for the Stack component." />

      <DemoCard title="Stack Component">
        <Stack direction="row" gap="md" align="center" wrap>
          {["var(--ui-primary)", "var(--ui-secondary)", "var(--ui-tertiary)"].map((bg) => (
            <div key={bg} style={{ background: bg, width: 50, height: 50, borderRadius: "8px" }} />
          ))}
        </Stack>
      </DemoCard>
    </>
  );
}
