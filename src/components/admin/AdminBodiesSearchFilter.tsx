"use client";

import { useState, useMemo } from "react";
import styles from "@/styles/components/admin/AdminBodiesSearchFilter.module.css";
import Search from "@/components/search/Search";
import { useSearch } from "@/hooks/useSearch";
import type { Dictionary } from "@/i18n/dictionaries";

interface AdminBody {
  name: string;
  active?: boolean;
}

export default function AdminBodiesSearchFilter({
  initialAdminBodies,
  dict,
}: {
  initialAdminBodies: AdminBody[];
  dict: Dictionary["admin"]["bodies_management"];
}) {
  const [adminBodies] = useState<AdminBody[]>(initialAdminBodies);
  const [showInactive, setShowInactive] = useState(false);

  const baseAdminBodies = useMemo(() => {
    return showInactive
      ? adminBodies.filter((adminBody) => adminBody.active === false)
      : adminBodies.filter((adminBody) => adminBody.active !== false);
  }, [adminBodies, showInactive]);

  const {
    results: filteredAdminBodies,
    query: search,
    setQuery: setSearch,
  } = useSearch<AdminBody>({
    data: baseAdminBodies,
    fields: ["name"],
    returnAllWhenEmpty: true,
  });

  const removeAdminBody = async (name: string) => {
    await fetch("/api/admin/admin-bodies", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    // TODO: (SUCCESS) show success toast after the admin body is deactivated, and an error toast if this request fails.
    window.location.reload();
  };

  return (
    <>
      <div className={styles.sectionTitle}>{dict.section_title}</div>
      <div className={styles.searchBar}>
        <Search
          className={styles.input}
          placeholder={dict.search_placeholder}
          value={search}
          onChange={setSearch}
        />
        <button
          className={`${styles.filterBtn} ${!showInactive ? styles.active : ""}`}
          onClick={() => setShowInactive(false)}
          type="button">
          {dict.active}
        </button>
        <button
          className={`${styles.filterBtn} ${showInactive ? styles.active : ""}`}
          onClick={() => setShowInactive(true)}
          type="button">
          {dict.show_inactive}
        </button>
      </div>
      <div className={styles.listSection}>
        {filteredAdminBodies.length === 0 ? (
          <div className={styles.emptyMessage}>{dict.empty}</div>
        ) : (
          <div className={styles.list}>
            {filteredAdminBodies.map((body) => (
              <div key={body.name} className={styles.item}>
                <div className={styles.itemContent}>
                  <div className={styles.itemName}>{body.name}</div>
                  {body.active === false && (
                    <span className={styles.badge}>{dict.inactive_badge}</span>
                  )}
                </div>
                <button
                  onClick={() => removeAdminBody(body.name)}
                  className={styles.deleteButton}
                  title={dict.deactivate_title}
                  type="button">
                  {dict.deactivate}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
