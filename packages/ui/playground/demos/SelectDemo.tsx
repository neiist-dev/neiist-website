import React from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Select, Stack } from "@neiist/ui";

export default function SelectDemo() {
  return (
    <>
      <PageHeader
        title="Select"
        description="Documentation and examples for the Select component."
      />

      <DemoCard title="Basic">
        <Stack style={{ maxWidth: "25rem" }}>
          <Select
            label="Função Principal"
            placeholder="Select a role"
            options={[
              { label: "Administrator", value: "admin" },
              { label: "Member", value: "member" },
            ]}
          />
        </Stack>
      </DemoCard>
    </>
  );
}
