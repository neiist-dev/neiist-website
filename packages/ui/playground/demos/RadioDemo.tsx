import React, { useState } from "react";
import { DemoCard } from "../components/DemoCard";
import { Radio, RadioGroup, Stack } from "@neiist/ui";

const CAMPUSES: Array<{
  value: string;
  label: string;
  description: string;
}> = [
  {
    value: "alameda",
    label: "Campus Alameda",
    description: "Pavilhão de Informática III",
  },
  {
    value: "taguspark",
    label: "Campus Taguspark",
    description: "Edifício de Apoio às Aulas",
  },
];

const PAYMENT_METHODS: Array<{
  value: string;
  label: string;
}> = [
  { value: "mbway", label: "MB WAY" },
  { value: "multibanco", label: "Referência Multibanco" },
  { value: "numerario", label: "Numerário (Na Sala)" },
];

export const RadioDemo = () => {
  const [selectedCampus, setSelectedCampus] = useState("alameda");
  const [paymentMethod, setPaymentMethod] = useState("mbway");

  return (
    <Stack gap="md" direction="column">
      <DemoCard
        title="Radio Group (Column)"
        description="Controlled radio selection with descriptive subtitles.">
        <RadioGroup
          label="Seleciona o teu Campus Principal"
          value={selectedCampus}
          onChange={setSelectedCampus}>
          {CAMPUSES.map(({ value, label, description }) => (
            <Radio key={value} value={value} label={label} description={description} />
          ))}
        </RadioGroup>
      </DemoCard>

      <DemoCard title="Radio Group (Row)" description="Horizontal layout for compact forms.">
        <RadioGroup
          direction="row"
          label="Método de Pagamento"
          value={paymentMethod}
          onChange={setPaymentMethod}>
          {PAYMENT_METHODS.map(({ value, label }) => (
            <Radio key={value} value={value} label={label} />
          ))}
        </RadioGroup>
      </DemoCard>
    </Stack>
  );
};
