import React, { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { ColorSwatch, Stack, Text } from "@neiist/ui";

export default function ColorSwatchDemo() {
  const [activeColor, setActiveColor] = useState("#2863fd");

  const sizes = ["sm", "md", "lg"] as const;

  return (
    <>
      <PageHeader
        title="ColorSwatch"
        description="A small interactive circle used for selecting or displaying colors."
      />

      <DemoCard title="Interactive Selection" description="Can be used as a radio-like selector.">
        <Stack gap="lg">
          <Stack gap="md" direction="row" wrap>
            {["#2863fd", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"].map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                active={activeColor === color}
                onClick={() => setActiveColor(color)}
              />
            ))}
          </Stack>
          <Text variant="muted">Selected Color: {activeColor}</Text>
        </Stack>
      </DemoCard>

      <DemoCard title="Sizes" description="Available in small, medium (default), and large.">
        <Stack gap="md" direction="row" align="center" wrap>
          {sizes.map((size) => (
            <ColorSwatch key={size} color="#ec4899" size={size} />
          ))}
        </Stack>
      </DemoCard>
    </>
  );
}
