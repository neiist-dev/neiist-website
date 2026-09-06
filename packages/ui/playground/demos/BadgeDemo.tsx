import React from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Badge, Stack } from "@neiist/ui";

const BADGES: Array<{
  variant: "primary" | "secondary" | "tertiary" | "quaternary" | "danger" | "outline";
  label: string;
  removable?: boolean;
}> = [
  { variant: "primary", label: "Primary" },
  { variant: "secondary", label: "Secondary" },
  { variant: "tertiary", label: "Tertiary" },
  { variant: "quaternary", label: "Quaternary" },
  { variant: "danger", label: "Danger" },
  { variant: "outline", label: "Outline" },
  { variant: "primary", label: "Removable", removable: true },
];

export default function BadgeDemo() {
  return (
    <>
      <PageHeader title="Badge" description="Documentation and examples for the Badge component." />

      <DemoCard title="Basic">
        <Stack gap="md" direction="row" wrap>
          {BADGES.map(({ variant, label, removable }) => (
            <Badge key={label} variant={variant} removable={removable}>
              {label}
            </Badge>
          ))}
        </Stack>
      </DemoCard>
    </>
  );
}
