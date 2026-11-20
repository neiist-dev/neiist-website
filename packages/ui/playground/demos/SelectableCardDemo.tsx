import React, { useState } from "react";
import { DemoCard } from "../components/DemoCard";
import { SelectableCard, Modal, Stack, Button, Text } from "@neiist/ui";

interface OptionItem {
  id: string;
  title: string;
  description: string;
  hasDetails?: boolean;
}

const SINGLE_OPTIONS: OptionItem[] = [
  {
    id: "lista-a",
    title: "Lista A",
    description:
      "Por um futuro de inovação e proximidade com a comunidade académica. Inclui plano de requalificação de salas de estudo e novas parcerias empresariais.",
    hasDetails: true,
  },
  {
    id: "lista-b",
    title: "Lista B",
    description:
      "Foco na representação estudantil, novos projetos e workshops técnicos. Proposta de ciclos de formação contínua em engenharia e ciência.",
    hasDetails: true,
  },
  {
    id: "branco",
    title: "Voto em Branco",
    description: "Abstenção formal e voto em branco.",
    hasDetails: false,
  },
];

const MULTI_OPTIONS: OptionItem[] = [
  {
    id: "opt-1",
    title: "Opção 1",
    description:
      "Alargamento do horário de funcionamento do polo de estudos 24h durante épocas de exames com reforço de segurança.",
    hasDetails: true,
  },
  {
    id: "opt-2",
    title: "Opção 2",
    description: "Criação de novos núcleos temáticos para inteligência artificial.",
    hasDetails: false,
  },
  {
    id: "opt-3",
    title: "Opção 3",
    description:
      "Organização de maratona de programação anual aberta ao campus com mentoria de empresas parceiras.",
    hasDetails: true,
  },
  {
    id: "opt-4",
    title: "Opção 4",
    description: "Aquisição de novo equipamento para o laboratório de eletrónica.",
    hasDetails: false,
  },
];

export const SelectableCardDemo = () => {
  const [singleSelected, setSingleSelected] = useState<string>("lista-a");
  const [multiSelected, setMultiSelected] = useState<string[]>(["opt-1", "opt-2"]);
  const [modalOption, setModalOption] = useState<{
    item: OptionItem;
    mode: "single" | "multiple";
  } | null>(null);

  const toggleMulti = (id: string) => {
    setMultiSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSingleClick = (option: OptionItem) => {
    if (option.hasDetails) {
      setModalOption({ item: option, mode: "single" });
    } else {
      setSingleSelected(option.id);
    }
  };

  const handleMultiClick = (option: OptionItem) => {
    if (option.hasDetails) {
      setModalOption({ item: option, mode: "multiple" });
    } else {
      toggleMulti(option.id);
    }
  };

  return (
    <Stack gap="lg">
      <DemoCard
        title="Single Selection Mode (Voting Grid Style)"
        description="Single-select mode: selected card maintains the top-right check badge and primary ring. On hover, the badge inverts colors (white background with blue checkmark) against the primary overlay. Cards with details display 'Ver detalhes' on hover and open the details modal.">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(11.5rem, 13.5rem))",
            gap: "2rem 1.5rem",
          }}>
          {SINGLE_OPTIONS.map((option) => {
            const isSelected = singleSelected === option.id;

            return (
              <SelectableCard
                key={option.id}
                selected={isSelected}
                hasDetails={option.hasDetails}
                detailsLabel="Ver detalhes"
                selectedLabel="Voto atual"
                unselectedLabel="Votar"
                onClick={() => handleSingleClick(option)}
                title={option.title}
                media={
                  <SelectableCard.TextFront title={option.title} description={option.description} />
                }
              />
            );
          })}
        </div>
      </DemoCard>

      <DemoCard
        title="Multiple Selection Mode"
        description="Multi-select mode: selected cards display the top-right check badge on idle and invert colors on hover. Cards with details open a modal on click, while cards without details toggle selection immediately.">
        <Stack gap="md">
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button size="sm" variant="outline" onClick={() => setMultiSelected([])}>
              Desmarcar Todos
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMultiSelected(MULTI_OPTIONS.map((o) => o.id))}>
              Selecionar Todos
            </Button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(11.5rem, 13.5rem))",
              gap: "2rem 1.5rem",
            }}>
            {MULTI_OPTIONS.map((option) => {
              const isSelected = multiSelected.includes(option.id);

              return (
                <SelectableCard
                  key={option.id}
                  multiple
                  selected={isSelected}
                  hasDetails={option.hasDetails}
                  detailsLabel="Ver detalhes"
                  selectedLabel="Remover"
                  unselectedLabel="Selecionar"
                  onClick={() => handleMultiClick(option)}
                  title={option.title}
                  media={
                    <SelectableCard.TextFront
                      title={option.title}
                      description={option.description}
                    />
                  }
                />
              );
            })}
          </div>
        </Stack>
      </DemoCard>

      {modalOption && (
        <Modal
          open={Boolean(modalOption)}
          onClose={() => setModalOption(null)}
          title={modalOption.item.title}
          size="md">
          <Modal.Body>
            <Text style={{ margin: "0 0 1rem" }}>{modalOption.item.description}</Text>
          </Modal.Body>
          <Modal.Footer>
            {modalOption.mode === "single" ? (
              <SelectableCard.Action
                selected={singleSelected === modalOption.item.id}
                selectedLabel="Manter Voto"
                unselectedLabel="Votar"
                onClick={() => {
                  setSingleSelected(modalOption.item.id);
                  setModalOption(null);
                }}
              />
            ) : (
              <SelectableCard.Action
                selected={multiSelected.includes(modalOption.item.id)}
                selectedLabel="Remover"
                unselectedLabel="Selecionar"
                onClick={() => {
                  toggleMulti(modalOption.item.id);
                  setModalOption(null);
                }}
              />
            )}
          </Modal.Footer>
        </Modal>
      )}
    </Stack>
  );
};
