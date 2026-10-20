import React, { useState } from "react";
import { DemoCard } from "../components/DemoCard";
import {
  ContextMenu,
  DataTable,
  ColumnDef,
  Badge,
  Stack,
  Text,
  Alert,
  useKeyboardShortcut,
} from "@neiist/ui";
import {
  FiEdit2,
  FiCopy,
  FiTrash2,
  FiDownload,
  FiCheckCircle,
  FiExternalLink,
} from "react-icons/fi";

interface SampleRow {
  id: string;
  name: string;
  type: string;
  status: "Ativo" | "Terminado" | "Rascunho";
  votes: number;
}

const SAMPLE_ROWS: SampleRow[] = [
  {
    id: "1",
    name: "Eleição Direção 2026/2027",
    type: "Órgãos Sociais",
    status: "Ativo",
    votes: 342,
  },
  {
    id: "2",
    name: "Votação Regulamento RCM",
    type: "Regulamento",
    status: "Terminado",
    votes: 128,
  },
  { id: "3", name: "Aprovação Orçamento Anual", type: "Financeiro", status: "Rascunho", votes: 0 },
  { id: "4", name: "Escolha Tema Semana Informática", type: "Geral", status: "Ativo", votes: 512 },
];

export const ContextMenuDemo = () => {
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleAction = (action: string) => {
    setLastAction(action);
    Alert.info(action);
  };

  useKeyboardShortcut("Mod+E", () => handleAction("Atalho de teclado acionado: ⌘E (Editar)"));
  useKeyboardShortcut("Mod+D", () => handleAction("Atalho de teclado acionado: ⌘D (Duplicar)"));

  const columns: ColumnDef<SampleRow>[] = [
    {
      id: "name",
      header: "Sessão de Voto",
      cell: (row) => <strong>{row.name}</strong>,
    },
    {
      id: "type",
      header: "Tipo",
      cell: (row) => row.type,
    },
    {
      id: "status",
      header: "Estado",
      cell: (row) => (
        <Badge
          variant={
            row.status === "Ativo"
              ? "primary"
              : row.status === "Terminado"
                ? "secondary"
                : "outline"
          }>
          {row.status}
        </Badge>
      ),
    },
    {
      id: "votes",
      header: "Votos",
      cell: (row) => `${row.votes} votos`,
      align: "end",
    },
  ];

  return (
    <Stack gap="lg">
      {lastAction && (
        <div
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "var(--ui-bg-hover)",
            borderRadius: "var(--ui-radius-sm)",
            border: "1px solid var(--ui-border)",
          }}>
          <Text size="sm" style={{ margin: 0 }}>
            <strong>Última ação:</strong> {lastAction}
          </Text>
        </div>
      )}

      <DemoCard
        title="Standalone Context Menu"
        description="Right-click anywhere within the designated area to trigger contextual menu anchored to cursor coordinates.">
        <ContextMenu
          width={220}
          content={
            <>
              <ContextMenu.Item
                icon={<FiEdit2 />}
                shortcut="⌘E"
                onClick={() => handleAction("Editar item selecionado")}>
                Editar
              </ContextMenu.Item>
              <ContextMenu.Item
                icon={<FiCopy />}
                shortcut="⌘D"
                onClick={() => handleAction("Duplicar item selecionado")}>
                Duplicar
              </ContextMenu.Item>
              <ContextMenu.Item
                icon={<FiExternalLink />}
                onClick={() => handleAction("Abrir numa nova aba")}>
                Abrir numa nova aba
              </ContextMenu.Item>
              <ContextMenu.Divider />
              <ContextMenu.Item
                destructive
                icon={<FiTrash2 />}
                shortcut="⌫"
                onClick={() => handleAction("Eliminar item selecionado")}>
                Eliminar
              </ContextMenu.Item>
            </>
          }>
          <div
            style={{
              padding: "3rem 1.5rem",
              textAlign: "center",
              border: "2px dashed var(--ui-border)",
              borderRadius: "var(--ui-radius-md)",
              backgroundColor: "var(--ui-bg-hover)",
              cursor: "context-menu",
              userSelect: "none",
            }}>
            <Text style={{ margin: 0, fontWeight: 500 }}>
              Clica com o botão direito aqui (ou prime continuamente no telemóvel)
            </Text>
            <Text variant="muted" size="sm" style={{ margin: "0.5rem 0 0" }}>
              Posiciona o menu popover exatamente nas coordenadas do rato.
            </Text>
          </div>
        </ContextMenu>
      </DemoCard>

      <DemoCard
        title="Native DataTable Integration"
        description="Rows capture onContextMenu automatically via renderRowContextMenu without any manual portal or coordinate calculations.">
        <DataTable
          data={SAMPLE_ROWS}
          columns={columns}
          renderRowContextMenu={(row) => (
            <>
              <ContextMenu.Item
                icon={<FiCheckCircle />}
                onClick={() => handleAction(`Visualizar detalhes de: ${row.name}`)}>
                Ver Detalhes
              </ContextMenu.Item>
              <ContextMenu.Item
                icon={<FiDownload />}
                onClick={() => handleAction(`Exportar resultados de: ${row.name}`)}>
                Exportar Excel
              </ContextMenu.Item>
              <ContextMenu.Item
                icon={<FiEdit2 />}
                onClick={() => handleAction(`Editar sessão: ${row.name}`)}>
                Editar Sessão
              </ContextMenu.Item>
              <ContextMenu.Divider />
              <ContextMenu.Item
                destructive
                icon={<FiTrash2 />}
                onClick={() => handleAction(`Eliminar sessão: ${row.name}`)}>
                Eliminar Sessão
              </ContextMenu.Item>
            </>
          )}
        />
      </DemoCard>
    </Stack>
  );
};
