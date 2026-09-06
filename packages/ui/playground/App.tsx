import React, { useEffect, useState } from "react";
import { Heading, Text, SearchInput, Container, Drawer } from "@neiist/ui";
import { COMPONENTS, CATEGORIES } from "./registry";
import { FiMenu } from "react-icons/fi";
import styles from "./App.module.css";
import { cn } from "../src/utils/cn";

interface SidebarContentProps {
  search: string;
  setSearch: (_v: string) => void;
  filteredComponents: typeof COMPONENTS;
  activeTab: string;
  setActiveTab: (_id: string) => void;
  setMobileDrawerOpen: (_open: boolean) => void;
}

function SidebarContent({
  search,
  setSearch,
  filteredComponents,
  activeTab,
  setActiveTab,
  setMobileDrawerOpen,
}: SidebarContentProps) {
  return (
    <>
      <div className={styles.sidebarHeader}>
        <Heading level={2} className={styles.sidebarTitle}>
          @neiist/ui
        </Heading>
        <Text variant="muted" className={styles.sidebarSubtitle}>
          Design System
        </Text>
      </div>

      <div className={styles.sidebarSearch}>
        <SearchInput placeholder="Search..." value={search} onChange={setSearch} />
      </div>

      <nav className={styles.sidebarNav}>
        {CATEGORIES.map((category) => {
          const items = filteredComponents.filter((comp) => comp.category === category);
          if (items.length === 0) return null;

          return (
            <div key={category} className={styles.navGroup}>
              <div className={styles.navGroupLabel}>{category}</div>
              <div className={styles.navGroupItems}>
                {items.map((comp) => {
                  const isActive = activeTab === comp.id;
                  return (
                    <button
                      key={comp.id}
                      onClick={() => {
                        setActiveTab(comp.id);
                        setMobileDrawerOpen(false);
                      }}
                      className={cn(styles.navButton, isActive && styles.navButtonActive)}>
                      {comp.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hashId = window.location.hash.replace("#", "").toLowerCase();
      if (COMPONENTS.some((comp) => comp.id === hashId)) {
        return hashId;
      }
    }
    return COMPONENTS[0].id;
  });
  const [search, setSearch] = useState("");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hashId = window.location.hash.replace("#", "").toLowerCase();
      if (COMPONENTS.some((comp) => comp.id === hashId)) {
        setActiveTab(hashId);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    if (typeof window !== "undefined") {
      window.location.hash = id;
    }
  };

  const activeComponent = COMPONENTS.find((comp) => comp.id === activeTab) || COMPONENTS[0];

  const filteredComponents = COMPONENTS.filter((comp) =>
    comp.label.toLowerCase().includes(search.toLowerCase())
  );

  const sidebarProps: SidebarContentProps = {
    search,
    setSearch,
    filteredComponents,
    activeTab,
    setActiveTab: handleSelectTab,
    setMobileDrawerOpen,
  };

  return (
    <div className={styles.layout}>
      {/* MOBILE HEADER */}
      <header className={styles.mobileHeader}>
        <button
          className={styles.hamburgerBtn}
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Open menu">
          <FiMenu />
        </button>
        <Heading level={2} className={styles.mobileTitle}>
          @neiist/ui
        </Heading>
      </header>

      {/* DESKTOP SIDEBAR */}
      <aside className={styles.sidebar}>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* MOBILE DRAWER */}
      <Drawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        position="left"
        size="sm"
        className={styles.drawerSidebar}>
        <SidebarContent {...sidebarProps} />
      </Drawer>

      {/* MAIN CONTENT */}
      <main className={styles.mainContent}>
        <Container size="lg" style={{ padding: 0 }}>
          {activeComponent.component}
        </Container>
      </main>
    </div>
  );
}
