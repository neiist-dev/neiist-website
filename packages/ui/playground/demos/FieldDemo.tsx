import React from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Field, Stack, Input } from "@neiist/ui";

interface FieldItemConfig {
  label: string;
  description?: string;
  error?: string;
  input: React.ComponentProps<typeof Input>;
}

const DEMO_FIELDS: FieldItemConfig[] = [
  {
    label: "Email Address",
    description: "We will never share your email.",
    input: { placeholder: "Enter email" },
  },
  {
    label: "Password",
    error: "Password is too short.",
    input: { type: "password", error: "true", defaultValue: "123" },
  },
];

export default function FieldDemo() {
  return (
    <>
      <PageHeader title="Field" description="Documentation and examples for the Field component." />

      <DemoCard title="Basic">
        <Stack gap="lg" style={{ maxWidth: "25rem" }}>
          {DEMO_FIELDS.map(({ label, description, error, input }) => (
            <Field key={label} label={label} description={description} error={error}>
              <Input {...input} />
            </Field>
          ))}
        </Stack>
      </DemoCard>
    </>
  );
}
