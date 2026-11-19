import React, { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Button, PageIndicator, Stack, Text } from "@neiist/ui";

export default function PageIndicatorDemo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = 5;

  return (
    <>
      <PageHeader
        title="PageIndicator"
        description="Reusable dot-and-pill pagination indicator primitive."
      />

      <DemoCard
        title="Interactive Pagination"
        description="Click any dot or use the step buttons to change the active indicator.">
        <Stack gap="md" align="center">
          <PageIndicator count={total} activeIndex={activeIndex} onSelect={setActiveIndex} />
          <Stack direction="row" gap="sm" align="center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeIndex === 0}>
              Previous
            </Button>
            <Text size="sm" variant="muted">
              Page {activeIndex + 1} of {total}
            </Text>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveIndex((prev) => Math.min(total - 1, prev + 1))}
              disabled={activeIndex === total - 1}>
              Next
            </Button>
          </Stack>
        </Stack>
      </DemoCard>
    </>
  );
}
