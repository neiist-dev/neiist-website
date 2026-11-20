import React, { useState } from "react";
import { DemoCard } from "../components/DemoCard";
import { Spinner, Stack, Button } from "@neiist/ui";

export const SpinnerDemo = () => {
  const [cardState, setCardState] = useState<"loading" | "success" | "error">("loading");
  const [standaloneState, setStandaloneState] = useState<"loading" | "success" | "error">(
    "loading"
  );

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

  const cycleState = (
    current: "loading" | "success" | "error"
  ): "loading" | "success" | "error" => {
    if (current === "loading") return "success";
    if (current === "success") return "error";
    return "loading";
  };

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
        description="Smoothly transitions between a spinning loader, a success checkmark, and an error cross.">
        <Stack direction="row" gap="md" align="center" wrap>
          <Spinner size="lg" state={standaloneState} />
          <Button
            size="sm"
            variant={standaloneState === "loading" ? "primary" : "outline"}
            onClick={() => setStandaloneState("loading")}>
            Loading
          </Button>
          <Button
            size="sm"
            variant={standaloneState === "success" ? "primary" : "outline"}
            onClick={() => setStandaloneState("success")}>
            Success
          </Button>
          <Button
            size="sm"
            variant={standaloneState === "error" ? "danger" : "outline"}
            onClick={() => setStandaloneState("error")}>
            Error
          </Button>
          <Button size="sm" variant="outline" onClick={() => setStandaloneState(cycleState)}>
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
            title={
              cardState === "loading"
                ? "A processar pagamento..."
                : cardState === "success"
                  ? "Pagamento Concluído!"
                  : "Erro no Pagamento"
            }
            subtitle={
              cardState === "loading"
                ? "Por favor aguarde a confirmação dos detalhes."
                : cardState === "success"
                  ? "A tua encomenda foi processada com sucesso."
                  : "Não foi possível processar a transação. Por favor tenta novamente."
            }
            actionLabel={
              cardState === "success"
                ? "Voltar ao Início"
                : cardState === "error"
                  ? "Tentar Novamente"
                  : undefined
            }
            onAction={() => {}}
          />
        </Stack>
        <Stack direction="row" gap="md" justify="center" wrap style={{ marginTop: "1rem" }}>
          <Button
            variant={cardState === "loading" ? "primary" : "outline"}
            onClick={() => setCardState("loading")}>
            Loading
          </Button>
          <Button
            variant={cardState === "success" ? "primary" : "outline"}
            onClick={() => setCardState("success")}>
            Success
          </Button>
          <Button
            variant={cardState === "error" ? "danger" : "outline"}
            onClick={() => setCardState("error")}>
            Error
          </Button>
          <Button onClick={() => setCardState(cycleState)}>Alternar Estado ({cardState})</Button>
        </Stack>
      </DemoCard>
    </Stack>
  );
};
