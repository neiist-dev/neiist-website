import React, { useState } from "react";
import { DemoCard } from "../components/DemoCard";
import { Spinner, Stack, Button } from "@neiist/ui";

export const SpinnerDemo = () => {
  const [cardState, setCardState] = useState<"loading" | "success">("loading");
  const [standaloneState, setStandaloneState] = useState<"loading" | "success">("loading");

  const sizes: Array<{
    size: "sm" | "md" | "lg" | "xl";
    label: string;
    color?: "primary" | "secondary" | "neutral";
  }> = [
    { size: "sm", label: "Small (16px)" },
    { size: "md", label: "Medium (24px)" },
    { size: "lg", label: "Large (32px, Secondary)", color: "secondary" },
    { size: "xl", label: "Extra Large (48px, Neutral)", color: "neutral" },
  ];

  return (
    <Stack gap="lg">
      <DemoCard
        title="Standalone Spinners"
        description="Lightweight, accessible loading spinners with size and color variants.">
        <Stack direction="row" gap="md" align="center" wrap>
          {sizes.map(({ size, label, color }) => (
            <Stack key={size} direction="row" gap="sm" align="center">
              <Spinner size={size} color={color} />
              <span>{label}</span>
            </Stack>
          ))}
        </Stack>
      </DemoCard>

      <DemoCard
        title="Morphing State Spinner"
        description="Smoothly transitions between a spinning loader and a success checkmark.">
        <Stack direction="row" gap="md" align="center">
          <Spinner size="lg" state={standaloneState} />
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setStandaloneState((state) => (state === "loading" ? "success" : "loading"))
            }>
            Toggle Morph ({standaloneState})
          </Button>
        </Stack>
      </DemoCard>

      <DemoCard
        title="Process / Status Card Mode"
        description="Unified card layout when title/subtitle are provided.">
        <Stack align="center" style={{ width: "100%", padding: "1rem" }}>
          <Spinner
            state={cardState}
            title={cardState === "loading" ? "A processar pagamento..." : "Pagamento Concluído!"}
            subtitle="Por favor aguarde a confirmação dos detalhes."
            actionLabel={cardState === "success" ? "Voltar ao Início" : undefined}
            onAction={() => {}}
          />
        </Stack>
        <Stack direction="row" gap="md" justify="center" style={{ marginTop: "1rem" }}>
          <Button onClick={() => setCardState((s) => (s === "loading" ? "success" : "loading"))}>
            Alternar Estado ({cardState})
          </Button>
        </Stack>
      </DemoCard>
    </Stack>
  );
};
