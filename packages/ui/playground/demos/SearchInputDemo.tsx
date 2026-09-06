import React, { useState } from "react";
import { DemoCard } from "../components/DemoCard";
import { SearchInput, Text, Stack } from "@neiist/ui";

export const SearchInputDemo = () => {
  const [value, setValue] = useState("");

  return (
    <Stack gap="md">
      <DemoCard title="Search Input">
        <Stack gap="md" style={{ width: "18.75rem" }}>
          <SearchInput value={value} onChange={setValue} placeholder="Search users..." />
        </Stack>
        <Text style={{ marginTop: "1rem" }}>
          Current search query: <strong>{value || "None"}</strong>
        </Text>
      </DemoCard>
    </Stack>
  );
};
