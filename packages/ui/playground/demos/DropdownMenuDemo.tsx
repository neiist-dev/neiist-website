import React from "react";
import { DemoCard } from "../components/DemoCard";
import { DropdownMenu, Button, Stack } from "@neiist/ui";
import { FiEdit2, FiTrash2, FiCopy, FiShare2, FiMoreVertical } from "react-icons/fi";

interface MenuItemConfig {
  id: string;
  label?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  destructive?: boolean;
  divider?: boolean;
}

const PRIMARY_MENU_ITEMS: MenuItemConfig[] = [
  { id: "edit", icon: <FiEdit2 />, label: "Editar Perfil" },
  { id: "duplicate", icon: <FiCopy />, label: "Duplicar", shortcut: "⌘C" },
  { id: "share", icon: <FiShare2 />, label: "Partilhar" },
  { id: "divider-1", divider: true },
  { id: "delete", icon: <FiTrash2 />, label: "Eliminar Conta", destructive: true },
];

const SECONDARY_MENU_ITEMS: MenuItemConfig[] = [
  { id: "details", label: "Ver Detalhes" },
  { id: "invoice", label: "Descarregar Fatura" },
  { id: "divider-2", divider: true },
  { id: "cancel", label: "Cancelar Subscrição", destructive: true },
];

export const DropdownMenuDemo = () => {
  return (
    <Stack gap="lg">
      <DemoCard
        title="Action Dropdown Menu"
        description="Floating contextual menu positioned relative to any trigger element.">
        <Stack direction="row" gap="md" align="center" wrap>
          <DropdownMenu>
            <DropdownMenu.Trigger>
              <Button variant="solid" color="primary">
                Ações
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content width={220}>
              {PRIMARY_MENU_ITEMS.map((item) =>
                item.divider ? (
                  <DropdownMenu.Divider key={item.id} />
                ) : (
                  <DropdownMenu.Item
                    key={item.id}
                    icon={item.icon}
                    shortcut={item.shortcut}
                    destructive={item.destructive}>
                    {item.label}
                  </DropdownMenu.Item>
                )
              )}
            </DropdownMenu.Content>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenu.Trigger>
              <Button variant="ghost" size="icon" aria-label="Mais opções">
                <FiMoreVertical />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content width={180}>
              {SECONDARY_MENU_ITEMS.map((item) =>
                item.divider ? (
                  <DropdownMenu.Divider key={item.id} />
                ) : (
                  <DropdownMenu.Item key={item.id} destructive={item.destructive}>
                    {item.label}
                  </DropdownMenu.Item>
                )
              )}
            </DropdownMenu.Content>
          </DropdownMenu>
        </Stack>
      </DemoCard>
    </Stack>
  );
};
