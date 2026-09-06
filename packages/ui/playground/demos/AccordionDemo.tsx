import React from "react";
import { DemoCard } from "../components/DemoCard";
import { Accordion, Stack } from "@neiist/ui";

interface AccordionItemData {
  value: string;
  trigger: string;
  content: string;
}

const SINGLE_ACCORDION_ITEMS: AccordionItemData[] = [
  {
    value: "item-1",
    trigger: "O que é o NEIIST?",
    content:
      "O Núcleo de Estudantes de Informática do Instituto Superior Técnico representa os estudantes de LEIC e MEIC.",
  },
  {
    value: "item-2",
    trigger: "Como me posso tornar sócio?",
    content:
      "Podes inscrever-te diretamente na nossa plataforma online ou presencialmente na sala do núcleo no Taguspark ou Alameda.",
  },
  {
    value: "item-3",
    trigger: "Quais as vantagens de ser sócio?",
    content:
      "Descontos em merchandising, acesso prioritário a workshops e eventos de recrutamento, e impressão gratuita.",
  },
];

const MULTIPLE_ACCORDION_ITEMS: AccordionItemData[] = [
  {
    value: "m-1",
    trigger: "Iniciativas e Hackathons",
    content:
      "Organizamos eventos anuais como o HackIST, workshops técnicos e sessões de esclarecimento com empresas parceiras.",
  },
  {
    value: "m-2",
    trigger: "Departamentos do Núcleo",
    content:
      "Direção, Departamento Pedagógico, Departamento de Informática, Departamento de Imagem e Comunicação, e Relações Externas.",
  },
];

export const AccordionDemo = () => {
  return (
    <Stack gap="lg">
      <DemoCard
        title="Single Accordion"
        description="Only one panel can be open at a time with smooth CSS Grid row transition.">
        <Accordion type="single" defaultValue="item-1">
          {SINGLE_ACCORDION_ITEMS.map(({ value, trigger, content }) => (
            <Accordion.Item key={value} value={value}>
              <Accordion.Trigger>{trigger}</Accordion.Trigger>
              <Accordion.Content>{content}</Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion>
      </DemoCard>

      <DemoCard
        title="Multiple Accordion"
        description="Allows multiple sections to be expanded concurrently.">
        <Accordion type="multiple" defaultValue={["m-1", "m-2"]}>
          {MULTIPLE_ACCORDION_ITEMS.map(({ value, trigger, content }) => (
            <Accordion.Item key={value} value={value}>
              <Accordion.Trigger>{trigger}</Accordion.Trigger>
              <Accordion.Content>{content}</Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion>
      </DemoCard>
    </Stack>
  );
};
