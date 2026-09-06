import React from "react";
import { DemoCard } from "../components/DemoCard";
import { Tabs, Text, Stack } from "@neiist/ui";
import { FiUsers, FiSettings, FiInfo } from "react-icons/fi";

export const TabsDemo = () => {
  const adminTabs = [
    {
      id: "teams",
      name: "Equipas",
      icon: <FiUsers size={18} />,
      content: <Text>Conteúdo das equipas...</Text>,
    },
    {
      id: "bodies",
      name: "Órgãos Sociais",
      icon: <FiSettings size={18} />,
      content: <Text>Conteúdo dos órgãos sociais...</Text>,
    },
    {
      id: "aboutUs-order",
      name: "Sobre Nós",
      icon: <FiInfo size={18} />,
      content: <Text>Conteúdo de Sobre Nós...</Text>,
    },
  ];

  return (
    <Stack gap="lg">
      <DemoCard title="Admin Dashboard Tabs">
        <Tabs tabs={adminTabs} />
      </DemoCard>
    </Stack>
  );
};
