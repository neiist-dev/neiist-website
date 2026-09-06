import React, { useState } from "react";
import { DemoCard } from "../components/DemoCard";
import { Button, InputDialog, InputDateDialog, Stack } from "@neiist/ui";
import { pt } from "date-fns/locale";

export const InputDialogDemo = () => {
  const [openText, setOpenText] = useState(false);
  const [openDate, setOpenDate] = useState(false);
  const [value, setValue] = useState("");

  const [dateValue, setDateValue] = useState("");

  return (
    <Stack gap="lg">
      <DemoCard title="Text Input Dialog">
        <Stack direction="row" gap="md" align="center" wrap>
          <Button onClick={() => setOpenText(true)}>Rename Folder</Button>
          <span>Value: {value}</span>
        </Stack>
        <InputDialog
          open={openText}
          title="Rename Folder"
          label="Folder Name"
          initialValue="My Folder"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onCancel={() => setOpenText(false)}
          onConfirm={(value) => {
            setValue(value);
            setOpenText(false);
          }}
        />
      </DemoCard>

      <DemoCard title="Date Input Dialog">
        <Stack direction="row" gap="md" align="center" wrap>
          <Button onClick={() => setOpenDate(true)}>Pick a Date</Button>
          {dateValue && <span>Date: {dateValue}</span>}
        </Stack>
        <InputDateDialog
          open={openDate}
          title="Select Date"
          label="Event Date"
          locale={pt}
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onCancel={() => setOpenDate(false)}
          onConfirm={(value) => {
            setDateValue(value ?? "");
            setOpenDate(false);
          }}
        />
      </DemoCard>
    </Stack>
  );
};
