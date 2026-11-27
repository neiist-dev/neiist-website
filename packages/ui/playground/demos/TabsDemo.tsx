import React from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Tabs, Text } from "@neiist/ui";
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
    <>
      <PageHeader title="Tabs" description="Documentation and examples for the Tabs component." />

      <DemoCard title="Admin Dashboard Tabs">
        <Tabs tabs={adminTabs} />
      </DemoCard>
    </>
  );
};
