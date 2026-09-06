import React from "react";
import { Stack } from "@neiist/ui";
import { DemoCard } from "../components/DemoCard";

export default function StackDemo() {
  return (
    <DemoCard title="Stack Component">
      <Stack direction="row" gap="md" align="center" wrap>
        {["var(--ui-primary)", "var(--ui-secondary)", "var(--ui-primary)"].map((bg, idx) => (
          <div key={idx} style={{ background: bg, width: 50, height: 50, borderRadius: "8px" }} />
        ))}
      </Stack>
    </DemoCard>
  );
}
