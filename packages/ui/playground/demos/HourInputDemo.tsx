import React, { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { HourInput, Stack } from "@neiist/ui";
import styles from "./HourInputDemo.module.css";

export const HourInputDemo = () => {
  const [time, setTime] = useState<string>("14:30");

  return (
    <>
      <PageHeader
        title="HourInput"
        description="Documentation and examples for the HourInput component."
      />

      <DemoCard title="HourInput (Keyboard & Time Belt Popover)">
        <Stack gap="md" className={styles.container}>
          <HourInput
            value={time}
            onChange={setTime}
            placeholder="HH:MM"
            mobileDrawerTitle="Selecionar Hora"
          />
          <div className={styles.resultText}>Selected Time: {time || "None"}</div>
        </Stack>
      </DemoCard>
    </>
  );
};

export default HourInputDemo;
