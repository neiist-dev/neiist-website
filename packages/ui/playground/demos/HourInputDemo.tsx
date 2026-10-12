import React, { useState } from "react";
import { DemoCard } from "../components/DemoCard";
import { HourInput, Stack } from "@neiist/ui";
import styles from "./HourInputDemo.module.css";

export const HourInputDemo = () => {
  const [time, setTime] = useState<string>("14:30");

  return (
    <Stack gap="md">
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
    </Stack>
  );
};

export default HourInputDemo;
