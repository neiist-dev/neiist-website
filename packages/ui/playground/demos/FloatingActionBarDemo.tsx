import React, { useState } from "react";
import { DemoCard } from "../components/DemoCard";
import { FloatingActionBar, SelectableCard, Button, Stack, Text, Alert } from "@neiist/ui";

const CANDIDATES = [
  {
    id: "1",
    title: "Candidato A",
    role: "Presidência",
    description: "Propostas para melhoria de infraestruturas e representação estudantil.",
  },
  {
    id: "2",
    title: "Candidato B",
    role: "Vice-Presidência",
    description: "Coordenação pedagógica e ligação com docentes e conselho diretivo.",
  },
  {
    id: "3",
    title: "Candidato C",
    role: "Tesouraria",
    description: "Gestão orçamental transparente e apoio financeiro aos projetos autónomos.",
  },
  {
    id: "4",
    title: "Candidato D",
    role: "Vogal de Comunicação",
    description: "Dinamização das redes sociais, eventos e presença digital do núcleo.",
  },
];

export const FloatingActionBarDemo = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>(["1", "2"]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    Alert.success(`Voto submetido com sucesso! (${selectedIds.length} escolhas registadas)`);
  };

  return (
    <Stack gap="lg">
      <DemoCard
        title="Floating Action Bar"
        description="Sticky bottom pill toolbar matching the voting grid layout. Clica nas opções abaixo para adicionar escolhas e interagir com a barra flutuante.">
        <Stack gap="md">
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedIds([])}
              disabled={selectedIds.length === 0}>
              Limpar Seleção
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedIds(CANDIDATES.map((c) => c.id))}
              disabled={selectedIds.length === CANDIDATES.length}>
              Selecionar Todos
            </Button>
            <Text variant="muted" size="sm" style={{ margin: 0, marginInlineStart: "auto" }}>
              {selectedIds.length === 0
                ? "Nenhuma opção selecionada (barra oculta)"
                : `${selectedIds.length} de ${CANDIDATES.length} selecionadas`}
            </Text>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(11.5rem, 13.5rem))",
              gap: "1.5rem",
              paddingBlock: "0.5rem",
            }}>
            {CANDIDATES.map((candidate) => {
              const isSelected = selectedIds.includes(candidate.id);
              return (
                <SelectableCard
                  key={candidate.id}
                  multiple
                  selected={isSelected}
                  overlayText={isSelected ? "Remover" : "Selecionar"}
                  onClick={() => toggleSelect(candidate.id)}
                  title={candidate.title}
                  media={
                    <SelectableCard.TextFront
                      title={candidate.role}
                      description={candidate.description}
                    />
                  }
                />
              );
            })}
          </div>
        </Stack>

        {selectedIds.length > 0 && (
          <FloatingActionBar
            countText={`${selectedIds.length} de ${CANDIDATES.length} escolhas`}
            action={
              <Button
                type="button"
                variant="solid"
                color="primary"
                shape="pill"
                onClick={handleSubmit}>
                Submeter
              </Button>
            }
          />
        )}
      </DemoCard>
    </Stack>
  );
};
