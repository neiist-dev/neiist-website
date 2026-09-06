import React from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Alert, Button, Stack } from "@neiist/ui";

export default function AlertDemo() {
  const alerts = [
    {
      variant: "success",
      label: "Success",
      action: () => Alert.success("Action completed successfully!"),
    },
    {
      variant: "danger",
      label: "Error",
      action: () => Alert.error("Something went terribly wrong."),
    },
    { variant: "secondary", label: "Info", action: () => Alert.info("Here is some information.") },
    {
      variant: "warning",
      label: "Warning",
      action: () => Alert.warning("Be careful, this action is dangerous."),
    },
  ] as const;

  return (
    <>
      <PageHeader
        title="Alert"
        description="A utility wrapper for Sonner toasts, used to display global notifications."
      />

      <DemoCard
        title="Basic Toasts"
        description="Click the buttons below to trigger the different toast variants.">
        <Stack gap="md" direction="row" wrap>
          {alerts.map(({ variant, label, action }) => (
            <Button key={variant} variant={variant} onClick={action}>
              {label}
            </Button>
          ))}
        </Stack>
      </DemoCard>
    </>
  );
}
