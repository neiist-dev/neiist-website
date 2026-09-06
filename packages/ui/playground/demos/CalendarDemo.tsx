import React, { useState } from "react";
import { DemoCard } from "../components/DemoCard";
import { Calendar, Stack, Button, type CalendarDateRange } from "@neiist/ui";
import { pt } from "date-fns/locale";

export const CalendarDemo = () => {
  const [singleDate, setSingleDate] = useState<Date | undefined>(new Date());
  const [rangeDate, setRangeDate] = useState<CalendarDateRange | undefined>({
    from: new Date(),
    to: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
  });

  return (
    <Stack gap="lg" direction="column">
      <DemoCard
        title='Single Selection (mode="single")'
        description="Select a single date using month and year dropdown navigation.">
        <Stack gap="md" align="center" style={{ padding: "1.5rem" }}>
          <Calendar mode="single" selected={singleDate} onSelect={setSingleDate} locale={pt} />
          <div style={{ fontSize: "0.875rem", color: "var(--ui-fg-light)", textAlign: "center" }}>
            Data selecionada:{" "}
            <strong style={{ color: "var(--ui-fg)" }}>
              {singleDate ? singleDate.toLocaleDateString("pt-PT") : "Nenhuma"}
            </strong>
          </div>
          {singleDate && (
            <Button
              variant="ghost"
              color="neutral"
              size="sm"
              onClick={() => setSingleDate(undefined)}>
              Limpar seleção
            </Button>
          )}
        </Stack>
      </DemoCard>

      <DemoCard
        title='Range Selection (mode="range")'
        description="Select a date interval with start and end dates.">
        <Stack gap="md" align="center" style={{ padding: "1.5rem" }}>
          <Calendar mode="range" selected={rangeDate} onSelect={setRangeDate} locale={pt} />
          <div style={{ fontSize: "0.875rem", color: "var(--ui-fg-light)", textAlign: "center" }}>
            Intervalo selecionado:{" "}
            <strong style={{ color: "var(--ui-fg)" }}>
              {rangeDate?.from ? rangeDate.from.toLocaleDateString("pt-PT") : "..."}
              {" — "}
              {rangeDate?.to ? rangeDate.to.toLocaleDateString("pt-PT") : "..."}
            </strong>
          </div>
          {(rangeDate?.from || rangeDate?.to) && (
            <Button
              variant="ghost"
              color="neutral"
              size="sm"
              onClick={() => setRangeDate(undefined)}>
              Limpar intervalo
            </Button>
          )}
        </Stack>
      </DemoCard>
    </Stack>
  );
};
