import React from "react";
import { DemoCard } from "../components/DemoCard";
import { Tooltip, Button, Stack } from "@neiist/ui";

export const TooltipDemo = () => {
  const positions = ["top", "bottom", "left", "right"] as const;

  return (
    <Stack gap="lg">
      <DemoCard title="Tooltip Positions">
        <Stack direction="row" gap="md" wrap justify="center" style={{ padding: "2rem" }}>
          {positions.map((position) => (
            <Tooltip
              key={position}
              content={`${position.charAt(0).toUpperCase() + position.slice(1)} tooltip`}
              position={position}>
              <Button variant="outline">
                {position.charAt(0).toUpperCase() + position.slice(1)}
              </Button>
            </Tooltip>
          ))}
        </Stack>
      </DemoCard>
    </Stack>
  );
};
