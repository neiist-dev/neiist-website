import React, { useState } from "react";
import { DemoCard } from "../components/DemoCard";
import { Textarea, Stack } from "@neiist/ui";

export const TextareaDemo = () => {
  const [val, setVal] = useState("");

  const TEXTAREA_ITEMS: Array<{
    label: string;
    placeholder?: string;
    helperText?: string;
    error?: string;
    disabled?: boolean;
    value?: string;
    defaultValue?: string;
    onChange?: (_e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  }> = [
    {
      label: "Mensagem de Contacto",
      placeholder: "Escreve a tua mensagem aqui...",
      helperText: "Máximo de 500 caracteres",
      value: val,
      onChange: (e) => setVal(e.target.value),
    },
    {
      label: "Comentário com Erro",
      placeholder: "Campo obrigatório...",
      error: "Este campo não pode ficar vazio",
      defaultValue: "",
    },
    {
      label: "Desativado",
      disabled: true,
      defaultValue: "Este campo encontra-se desativado.",
    },
  ];

  return (
    <Stack gap="md">
      <DemoCard
        title="Textarea"
        description="Multi-line accessible input with helper text and validation states.">
        <Stack gap="md" style={{ maxWidth: "28.125rem" }}>
          {TEXTAREA_ITEMS.map((item) => (
            <Textarea key={item.label} {...item} />
          ))}
        </Stack>
      </DemoCard>
    </Stack>
  );
};
