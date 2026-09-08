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

export interface TabsClassNames {
  root?: string;
  tabBar?: string;
  tabButton?: string;
  tabContent?: string;
}

export interface TabsProps extends Omit<React.ComponentPropsWithRef<"div">, "onChange"> {
  tabs: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (_id: string) => void;
  align?: "start" | "center" | "end";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  classNames?: TabsClassNames;
}

export function Tabs({
  tabs,
  value,
  defaultValue,
  onChange,
  align = "start",
  size = "md",
  fullWidth = false,
  className,
  classNames,
  ref,
  ...props
}: TabsProps) {
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
    <div
      ref={ref}
      className={cn(styles.tabsContainer, styles[`size-${size}`], className, classNames?.root)}
      {...props}>
      <nav
        className={cn(
          styles.tabBar,
          styles[`align-${align}`],
          fullWidth && styles.fullWidth,
          classNames?.tabBar
        )}
        role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              className={cn(
                styles.tabButton,
                styles[`tabButton-${size}`],
                isActive && styles.activeTab,
                fullWidth && styles.tabButtonFullWidth,
                classNames?.tabButton
              )}
              onClick={() => handleTabClick(tab.id)}>
              {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
              <span>{tab.name}</span>
            </button>
          );
        })}
      </nav>
      <div className={cn(styles.tabContent, classNames?.tabContent)} role="tabpanel">
        {activeContent}
      </div>
    </div>
  );
}
