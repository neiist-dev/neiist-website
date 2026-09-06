import React from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { ToggleSwitch, Stack } from "@neiist/ui";

export default function ToggleSwitchDemo() {
  const [checked1, setChecked1] = React.useState(true);
  const [checked2, setChecked2] = React.useState(false);

  const STATES = [
    { label: "Enable Notifications", checked: checked1, onChange: setChecked1, props: {} },
    { label: "Dark Mode", checked: checked2, onChange: setChecked2, props: {} },
    { label: "Disabled Toggle", checked: false, onChange: () => {}, props: { disabled: true } },
  ];

  return (
    <>
      <PageHeader
        title="ToggleSwitch"
        description="Documentation and examples for the ToggleSwitch component."
      />

      <DemoCard title="Basic">
        <Stack gap="md" direction="column">
          {STATES.map((state) => (
            <Stack key={state.label} direction="row" gap="md" style={{ alignItems: "center" }}>
              <ToggleSwitch checked={state.checked} onChange={state.onChange} {...state.props} />
              <span style={{ fontSize: "0.9rem" }}>{state.label}</span>
            </Stack>
          ))}
        </Stack>
      </DemoCard>
    </>
  );
}
