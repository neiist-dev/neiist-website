"use client";

import React from "react";
import styles from "./Tabs.module.css";
import { cn } from "../../utils/cn";
import { useControllableState } from "../../utils/useControllableState";

export interface TabItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface TabsProps extends Omit<React.ComponentPropsWithRef<"div">, "onChange"> {
  tabs: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (_id: string) => void;
}

export function Tabs({ tabs, value, defaultValue, onChange, className, ref, ...props }: TabsProps) {
  const [activeTab, setActiveTab] = useControllableState({
    prop: value,
    defaultProp: defaultValue || tabs[0]?.id,
    onChange,
  });

  const handleTabClick = (id: string) => {
    setActiveTab(id);
  };

  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div ref={ref} className={cn(styles.tabsContainer, className)} {...props}>
      <nav className={styles.tabBar} role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              className={cn(styles.tabButton, isActive && styles.activeTab)}
              onClick={() => handleTabClick(tab.id)}>
              {tab.icon && <span>{tab.icon}</span>}
              {tab.name}
            </button>
          );
        })}
      </nav>
      <div className={styles.tabContent} role="tabpanel">
        {activeContent}
      </div>
    </div>
  );
}
