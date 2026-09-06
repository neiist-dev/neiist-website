import React, { useRef, useState } from "react";
import { DemoCard } from "../components/DemoCard";
import { Popover, Button, Text, Heading, Stack, Input, Badge } from "@neiist/ui";

const ALIGNMENT_ITEMS: Array<{
  align: "start" | "center" | "end";
  label: string;
  description: string;
}> = [
  {
    align: "start",
    label: "Align Start",
    description: "Alinhado ao início (esquerda) do botão.",
  },
  {
    align: "center",
    label: "Align Center",
    description: "Alinhado ao centro do botão.",
  },
  {
    align: "end",
    label: "Align End",
    description: "Alinhado ao fim (direita) do botão.",
  },
];

function AlignmentPopoverItem({
  align,
  label,
  description,
}: {
  align: "start" | "center" | "end";
  label: string;
  description: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <div>
      <Button ref={ref} variant="outline" onClick={() => setOpen((prev) => !prev)}>
        {label}
      </Button>
      <Popover
        isOpen={open}
        onClose={() => setOpen(false)}
        anchorRef={ref}
        align={align}
        width={240}>
        <div style={{ padding: "1rem", textAlign: align === "center" ? "center" : undefined }}>
          <Text style={{ margin: 0, fontSize: "0.875rem" }}>{description}</Text>
        </div>
      </Popover>
    </div>
  );
}

export const PopoverDemo = () => {
  const [basicOpen, setBasicOpen] = useState(false);
  const basicAnchorRef = useRef<HTMLButtonElement>(null);

  const [formOpen, setFormOpen] = useState(false);
  const formAnchorRef = useRef<HTMLButtonElement>(null);
  const [tag, setTag] = useState("");

  return (
    <Stack gap="lg">
      <DemoCard
        title="Basic Popover"
        description="Floating contextual container anchored to a trigger element on desktop, and rendered as a Drawer on mobile.">
        <Stack direction="row" gap="md" align="center" wrap>
          <Button
            ref={basicAnchorRef}
            variant="solid"
            color="primary"
            onClick={() => setBasicOpen((prev) => !prev)}>
            {basicOpen ? "Fechar Popover" : "Abrir Popover"}
          </Button>

          <Popover
            isOpen={basicOpen}
            onClose={() => setBasicOpen(false)}
            anchorRef={basicAnchorRef}
            width={300}
            mobileDrawerTitle="Informação">
            <div style={{ padding: "1.25rem" }}>
              <Stack gap="sm">
                <Heading level={4} style={{ margin: 0 }}>
                  Dica Rápida
                </Heading>
                <Text variant="muted" style={{ margin: 0, fontSize: "0.875rem" }}>
                  Os popovers adaptam-se dinamicamente ao ecrã: em ecrãs móveis transformam-se
                  automaticamente numa gaveta inferior.
                </Text>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <Button size="sm" variant="outline" onClick={() => setBasicOpen(false)}>
                    Entendido
                  </Button>
                </div>
              </Stack>
            </div>
          </Popover>
        </Stack>
      </DemoCard>

      <DemoCard
        title="Alignment Options"
        description="Controls how the popover aligns relative to the anchor trigger element (start, center, end).">
        <Stack direction="row" gap="md" align="center" wrap>
          {ALIGNMENT_ITEMS.map((item) => (
            <AlignmentPopoverItem key={item.align} {...item} />
          ))}
        </Stack>
      </DemoCard>

      <DemoCard
        title="Interactive Popover Form"
        description="Popovers can host interactive controls, forms, or filter panels.">
        <Stack direction="row" gap="md" align="center" wrap>
          <Button
            ref={formAnchorRef}
            variant="outline"
            onClick={() => setFormOpen((prev) => !prev)}>
            Adicionar Etiqueta{" "}
            {tag && (
              <Badge variant="primary" size="sm" style={{ marginLeft: "0.5rem" }}>
                {tag}
              </Badge>
            )}
          </Button>

          <Popover
            isOpen={formOpen}
            onClose={() => setFormOpen(false)}
            anchorRef={formAnchorRef}
            width={280}
            mobileDrawerTitle="Adicionar Etiqueta">
            <div style={{ padding: "1.25rem" }}>
              <Stack gap="sm">
                <Heading level={4} style={{ margin: 0 }}>
                  Nova Etiqueta
                </Heading>
                <Input
                  placeholder="Ex: Urgente"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                />
                <Stack direction="row" gap="sm" justify="end" style={{ marginTop: "0.5rem" }}>
                  <Button size="sm" variant="ghost" onClick={() => setFormOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    variant="solid"
                    color="primary"
                    onClick={() => setFormOpen(false)}>
                    Guardar
                  </Button>
                </Stack>
              </Stack>
            </div>
          </Popover>
        </Stack>
      </DemoCard>
    </Stack>
  );
};
