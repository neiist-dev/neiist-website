import React, { useState } from "react";
import { DemoCard } from "../components/DemoCard";
import { TimePicker, Stack, Button, type TimeRangeValue } from "@neiist/ui";
import styles from "./TimePickerDemo.module.css";

export const TimePickerDemo = () => {
  const [singleTime, setSingleTime] = useState<string>("14:30");
  const [rangeTime, setRangeTime] = useState<TimeRangeValue>({
    start: "09:00",
    end: "17:30",
  });

  return (
    <Stack gap="lg" direction="column">
      <DemoCard
        title="Single Selection (Inline)"
        description="Select a single time using the infinite 3D iOS drum wheel.">
        <Stack gap="md" align="center" className={styles.demoContent}>
          <TimePicker value={singleTime} onChange={setSingleTime} />
          <div className={styles.selectedText}>
            Hora selecionada:{" "}
            <strong className={styles.selectedHighlight}>{singleTime || "Nenhuma"}</strong>
          </div>
          {singleTime && (
            <Button
              variant="ghost"
              color="neutral"
              size="sm"
              onClick={() => setSingleTime("00:00")}>
              Repor para 00:00
            </Button>
          )}
        </Stack>
      </DemoCard>

      <DemoCard
        title="Range Selection (range={true})"
        description="Select a time interval with start and end times using flat typography headers.">
        <Stack gap="md" align="center" className={styles.demoContent}>
          <TimePicker range value={rangeTime} onChange={setRangeTime} />
          <div className={styles.selectedText}>
            Intervalo selecionado:{" "}
            <strong className={styles.selectedHighlight}>
              {rangeTime.start} — {rangeTime.end}
            </strong>
          </div>
          <Button
            variant="ghost"
            color="neutral"
            size="sm"
            onClick={() => setRangeTime({ start: "09:00", end: "18:00" })}>
            Repor predefinido (09:00 — 18:00)
          </Button>
        </Stack>
      </DemoCard>
    </Stack>
  );
};

export default TimePickerDemo;
