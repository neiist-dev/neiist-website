import React from "react";
import { DemoCard } from "../components/DemoCard";
import { Skeleton, Stack } from "@neiist/ui";

export const SkeletonDemo = () => {
  return (
    <Stack gap="lg">
      <DemoCard
        title="Skeleton Placeholders"
        description="Pulsing placeholders for content loading states.">
        <Stack gap="md" style={{ maxWidth: 400 }}>
          <Stack direction="row" gap="md" align="center">
            <Skeleton variant="circular" width={48} height={48} />
            <Stack gap="sm" style={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Stack>
          </Stack>

          <Skeleton variant="rectangular" height={140} />
          <Skeleton variant="text" width="85%" />
          <Skeleton variant="text" width="70%" />
        </Stack>
      </DemoCard>
    </Stack>
  );
};
