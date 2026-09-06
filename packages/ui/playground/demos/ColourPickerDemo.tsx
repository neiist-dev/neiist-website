import React from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { ColourPicker, Stack } from "@neiist/ui";

export default function ColourPickerDemo() {
  return (
    <>
      <PageHeader
        title="ColourPicker"
        description="Documentation and examples for the ColourPicker component."
      />

      <DemoCard title="Basic">
        <Stack style={{ maxWidth: "18.75rem" }}>
          <ColourPicker default_value="#2863fd" />
        </Stack>
      </DemoCard>
    </>
  );
}
