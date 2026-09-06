import React, { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { MultiSelect, Field, Stack } from "@neiist/ui";

export default function MultiSelectDemo() {
  const [teams, setTeams] = useState<string[]>(["Engineering"]);
  const [singleValue, setSingleValue] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>(["React"]);

  return (
    <>
      <PageHeader
        title="MultiSelect"
        description="A robust combobox for selecting multiple items, with support for searching and creating new entries."
      />

      <DemoCard
        title="Standard Multi-Select"
        description="Allows selecting multiple options from a predefined list.">
        <Stack style={{ maxWidth: "25rem" }}>
          <Field label="Assign Teams">
            <MultiSelect
              label="Assign Teams"
              placeholder="Search teams..."
              availableItems={["Marketing", "Engineering", "Design", "Logistics", "Finance"]}
              selectedItems={teams}
              onChange={setTeams}
            />
          </Field>
        </Stack>
      </DemoCard>

      <DemoCard
        title="Single Select Mode"
        description="Behaves like a searchable dropdown by setting multiSelect={false}.">
        <Stack style={{ maxWidth: "25rem" }}>
          <Field label="Primary Role">
            <MultiSelect
              label="Primary Role"
              availableItems={["Admin", "Editor", "Viewer", "Guest"]}
              selectedItems={singleValue}
              onChange={setSingleValue}
              multiSelect={false}
              placeholder="Search roles..."
            />
          </Field>
        </Stack>
      </DemoCard>

      <DemoCard
        title="Creatable Mode"
        description="Allows users to type and create new options dynamically.">
        <Stack style={{ maxWidth: "25rem" }}>
          <Field label="Technologies">
            <MultiSelect
              label="Technologies"
              availableItems={["React", "Next.js", "Vite", "TypeScript"]}
              selectedItems={tags}
              onChange={setTags}
              onItemCreate={(_item) => {}}
              placeholder="Type to search or create..."
            />
          </Field>
        </Stack>
      </DemoCard>
    </>
  );
}
