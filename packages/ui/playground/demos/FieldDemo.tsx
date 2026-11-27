import React, { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Field, Stack, Input, Select } from "@neiist/ui";

interface FieldItemConfig {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  input: React.ComponentProps<typeof Input>;
}

const DEMO_FIELDS: FieldItemConfig[] = [
  {
    label: "Email Address",
    required: true,
    description: "We will never share your email.",
    input: { placeholder: "Enter email" },
  },
  {
    label: "Password",
    error: "Password is too short.",
    input: { type: "password", error: true, defaultValue: "123" },
  },
];

const CAMPUS_OPTIONS = [
  { label: "Alameda", value: "alameda" },
  { label: "Taguspark", value: "taguspark" },
];

const PREFERENCE_OPTIONS = [
  { label: "Email", value: "email" },
  { label: "SMS", value: "sms" },
];

export default function FieldDemo() {
  const [campus, setCampus] = useState("");
  const [preference, setPreference] = useState("");

  return (
    <>
      <PageHeader title="Field" description="Documentation and examples for the Field component." />

      <DemoCard title="Basic">
        <Stack gap="lg" style={{ maxWidth: "25rem" }}>
          {DEMO_FIELDS.map(({ label, required, description, error, input }) => (
            <Field
              key={label}
              label={label}
              required={required}
              description={description}
              error={error}>
              <Input {...input} />
            </Field>
          ))}
        </Stack>
      </DemoCard>

      <DemoCard title="With Select">
        <Stack gap="lg" style={{ maxWidth: "25rem" }}>
          <Field label="Campus" required description="Required selection.">
            <Select
              options={CAMPUS_OPTIONS}
              value={campus}
              onChange={setCampus}
              placeholder="Select a campus"
            />
          </Field>
          <Field
            label="Optional Preference"
            description="Optional selection without required indicator.">
            <Select
              options={PREFERENCE_OPTIONS}
              value={preference}
              onChange={setPreference}
              placeholder="Select a preference"
            />
          </Field>
        </Stack>
      </DemoCard>
    </>
  );
}
