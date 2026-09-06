import React from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Input, Stack } from "@neiist/ui";

const INPUT_STATES = [
  { placeholder: "Standard Input", props: {} },
  { placeholder: "Disabled Input", props: { disabled: true } },
  { placeholder: "Error Input", props: { error: "true" } },
];

export default function InputDemo() {
  return (
    <>
      <PageHeader title="Input" description="Documentation and examples for the Input component." />

      <DemoCard title="Basic">
        <Stack gap="md" style={{ maxWidth: "25rem" }}>
          {INPUT_STATES.map((state) => (
            <Input key={state.placeholder} placeholder={state.placeholder} {...state.props} />
          ))}
        </Stack>
      </DemoCard>
    </>
  );
}
