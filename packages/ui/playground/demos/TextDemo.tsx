import React from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Text, Stack } from "@neiist/ui";

export default function TextDemo() {
  const sizes = ["sm", "md", "lg"] as const;
  const variants = ["default", "muted"] as const;

  return (
    <>
      <PageHeader title="Text" description="Documentation and examples for the Text component." />

      <DemoCard title="Sizes & Variants">
        <Stack gap="md">
          {sizes.map((size) =>
            variants.map((variant) => (
              <Text key={`${size}-${variant}`} size={size} variant={variant}>
                This is {size} {variant} text.
              </Text>
            ))
          )}
        </Stack>
      </DemoCard>
    </>
  );
}
