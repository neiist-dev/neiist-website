import React, { useState } from "react";
import { DemoCard } from "../components/DemoCard";
import { Timeline, TimelineItem, Button, Stack } from "@neiist/ui";
import { FaExclamationTriangle } from "react-icons/fa";

type OrderFlowType = "normal" | "dinner" | "deadline_alert";

const FLOW_OPTIONS: Array<{ id: OrderFlowType; label: string; totalSteps: number }> = [
  { id: "normal", label: "Encomenda Normal (4 Passos)", totalSteps: 4 },
  { id: "dinner", label: "Jantar de Curso (2 Passos)", totalSteps: 2 },
  { id: "deadline_alert", label: "Alerta Prazo de Levantamento", totalSteps: 4 },
];

interface TimelineStepConfig {
  title: string;
  subtitle: string;
  isAlert?: boolean;
  icon?: React.ReactNode;
}

const FLOW_STEPS: Record<OrderFlowType, TimelineStepConfig[]> = {
  normal: [
    { title: "Pendente", subtitle: "Registo efetuado" },
    { title: "Pago", subtitle: "MB Way confirmado" },
    { title: "Pronto", subtitle: "Disponível no NEIIST" },
    { title: "Entregue", subtitle: "Levantado com sucesso" },
  ],
  dinner: [
    { title: "Pendente", subtitle: "Inscrição em validação" },
    { title: "Confirmado", subtitle: "Lugar garantido no jantar" },
  ],
  deadline_alert: [
    { title: "Pendente", subtitle: "14 Mai" },
    { title: "Pago", subtitle: "15 Mai" },
    {
      title: "Pronto",
      subtitle: "Prazo a expirar!",
      isAlert: true,
      icon: <FaExclamationTriangle size={14} />,
    },
    { title: "Entregue", subtitle: "Aguardando recolha" },
  ],
};

export const TimelineDemo = () => {
  const [flow, setFlow] = useState<OrderFlowType>("normal");
  const [step, setStep] = useState(2);

  const totalSteps = FLOW_OPTIONS.find((f) => f.id === flow)?.totalSteps ?? 4;

  const handleFlowChange = (newFlow: OrderFlowType) => {
    setFlow(newFlow);
    if (newFlow === "dinner") {
      setStep(Math.min(step, 2));
    } else if (newFlow === "deadline_alert") {
      setStep(3);
    }
  };

  const progress = (step / totalSteps) * 100;

  return (
    <Stack gap="lg">
      <DemoCard
        title="Order Progress Tracker (my-orders Flows)"
        description="Tracks multi-step order progression supporting Normal Shop orders, Jantar de Curso, and deadline alerts.">
        <Stack gap="md" direction="column">
          {/* Flow Mode Switcher */}
          <Stack gap="sm" direction="row" wrap>
            {FLOW_OPTIONS.map(({ id, label }) => (
              <Button
                key={id}
                size="sm"
                variant={flow === id ? "solid" : "outline"}
                color="primary"
                onClick={() => handleFlowChange(id)}>
                {label}
              </Button>
            ))}
          </Stack>

          {/* Timeline Rendering */}
          <div style={{ padding: "2.5rem 1rem 1rem" }}>
            <Timeline progress={flow === "deadline_alert" ? 75 : progress}>
              {FLOW_STEPS[flow].map((item, index) => {
                const itemStep = index + 1;
                const isCompleted = flow === "deadline_alert" ? itemStep < 3 : step >= itemStep;
                const isActive = flow === "deadline_alert" ? itemStep === 3 : step === itemStep;

                return (
                  <TimelineItem
                    key={item.title}
                    title={item.title}
                    subtitle={item.subtitle}
                    completed={isCompleted}
                    active={isActive}
                    isAlert={item.isAlert}
                    icon={item.icon}
                  />
                );
              })}
            </Timeline>
          </div>

          {/* Interactive Navigation */}
          {flow !== "deadline_alert" && (
            <Stack direction="row" gap="md" justify="center" style={{ paddingTop: "1rem" }}>
              <Button
                size="sm"
                variant="outline"
                disabled={step <= 0}
                onClick={() => setStep((currentStep) => Math.max(0, currentStep - 1))}>
                Passo Anterior
              </Button>
              <Button
                size="sm"
                disabled={step >= totalSteps}
                onClick={() => setStep((currentStep) => Math.min(totalSteps, currentStep + 1))}>
                Próximo Passo ({step}/{totalSteps})
              </Button>
            </Stack>
          )}
        </Stack>
      </DemoCard>
    </Stack>
  );
};
