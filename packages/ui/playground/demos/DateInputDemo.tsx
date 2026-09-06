import React, { useState } from "react";
import { DemoCard } from "../components/DemoCard";
import { DateInput } from "@neiist/ui";
import { Stack } from "@neiist/ui";

import { pt } from "date-fns/locale";

export const DateInputDemo = () => {
  const [date, setDate] = useState<Date>();

  return (
    <Stack gap="md">
      <DemoCard title="DateInput (Keyboard & Calendar)">
        <Stack gap="md" style={{ maxWidth: "18.75rem", margin: "0 auto", padding: "2rem" }}>
          <DateInput
            value={date}
            onChange={setDate}
            placeholder="DD/MM/YYYY"
            locale={pt}
            mobileDrawerTitle="Selecionar Data"
          />
          <div style={{ fontSize: "0.85rem", color: "var(--ui-fg-light)" }}>
            Selected Date: {date ? date.toISOString() : "None"}
          </div>
        </Stack>
      </DemoCard>
    </Stack>
  );
};
