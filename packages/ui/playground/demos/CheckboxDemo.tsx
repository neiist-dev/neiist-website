import React from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Checkbox, Stack } from "@neiist/ui";

const CHECKBOX_STATES = [
  { label: "I accept the terms and conditions", props: {} },
  { label: "Subscribe to newsletter", props: { defaultChecked: true } },
  { label: "Disabled checkbox", props: { disabled: true } },
];

export default function CheckboxDemo() {
  return (
    <>
      <PageHeader
        title="Checkbox"
        description="Documentation and examples for the Checkbox component."
      />

      <DemoCard title="Basic">
        <Stack gap="md">
          {CHECKBOX_STATES.map((state) => (
            <Checkbox key={state.label} label={state.label} {...state.props} />
          ))}
        </Stack>
      </DemoCard>
    </>
  );
}
