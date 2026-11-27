import React, { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Checkbox, Input, Stack } from "@neiist/ui";

const INPUT_STATES = [
  { placeholder: "Standard Input", props: {} },
  { placeholder: "Disabled Input", props: { disabled: true } },
  { placeholder: "Error Input", props: { error: "This field is required." } },
];

export default function InputDemo() {
  const [conditionalRequired, setConditionalRequired] = useState(false);
  const [phone, setPhone] = useState("");

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

      <DemoCard
        title="Required Validation"
        description="Shows primary * indicator and validates on blur or when required toggles on dynamically.">
        <Stack gap="md" style={{ maxWidth: "25rem" }}>
          <Input
            label="Full Name"
            placeholder="Blur while empty to trigger"
            required
            requiredMessage="This field is required."
          />
          <Checkbox
            label="Require phone number (e.g. MB Way selected)"
            checked={conditionalRequired}
            onChange={(e) => setConditionalRequired(e.target.checked)}
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="912 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required={conditionalRequired}
            requiredMessage="Enter a phone number to continue."
          />
        </Stack>
      </DemoCard>
    </>
  );
}
