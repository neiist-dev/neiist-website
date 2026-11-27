import React, { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Progress, Stack, Text, Button } from "@neiist/ui";

export const ProgressDemo = () => {
  const [value, setValue] = useState(65);

  return (
    <>
      <PageHeader
        title="Progress"
        description="Documentation and examples for the Progress component."
      />

      <DemoCard
        title="Progress Bar"
        description="Linear HTML5 <progress> element with cross-browser styling, smooth CSS transitions, and optional value display.">
        <Stack gap="md">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Text style={{ margin: 0, minWidth: "5rem" }}>Valor: {value}%</Text>
            <input
              type="range"
              min={0}
              max={100}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              style={{ flex: 1, cursor: "pointer" }}
            />
            <Button size="sm" variant="outline" onClick={() => setValue(0)}>
              0%
            </Button>
            <Button size="sm" variant="outline" onClick={() => setValue(50)}>
              50%
            </Button>
            <Button size="sm" variant="outline" onClick={() => setValue(100)}>
              100%
            </Button>
          </div>
          <Progress value={value} showValue />
        </Stack>
      </DemoCard>
    </>
  );
};
