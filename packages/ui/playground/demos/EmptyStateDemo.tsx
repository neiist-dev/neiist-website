import React from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { EmptyState, Button, Stack } from "@neiist/ui";

export default function EmptyStateDemo() {
  return (
    <Stack gap="md">
      <PageHeader
        title="EmptyState"
        description="Documentation and examples for the EmptyState component."
      />

      <DemoCard title="Basic">
        <EmptyState
          title="No Data Available"
          description="Try adjusting your filters or creating a new entry."
          action={<Button variant="primary">Create Entry</Button>}
        />
      </DemoCard>
    </Stack>
  );
}
