"use client";

import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import styles from "@/styles/components/admin/AdminBodiesSearchFilter.module.css";

interface AdminBody {
  name: string;
  active?: boolean;
}

export default function AdminBodiesSearchFilter({
  initialAdminBodies,
  dict,
}: {
  initialAdminBodies: AdminBody[];
  dict: {
    section_title: string;
    search_placeholder: string;
    active: string;
    show_inactive: string;
    empty: string;
    inactive_badge: string;
    deactivate_title: string;
    deactivate: string;
  };
}) {
  const [adminBodies] = useState<AdminBody[]>(initialAdminBodies);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const fuse = useMemo(
    () =>
      new Fuse(adminBodies, {
        keys: ["name"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [adminBodies]
  );

  const filteredAdminBodies = useMemo(() => {
    let filtered = showInactive
      ? adminBodies.filter((adminBody) => adminBody.active === false)
      : adminBodies.filter((adminBody) => adminBody.active !== false);
    if (search.trim()) {
      const results = fuse.search(search.trim());
      filtered = filtered.filter((body) => results.some((r) => r.item.name === body.name));
    }
    return filtered;
  }, [adminBodies, search, showInactive, fuse]);

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
        <input
          className={styles.input}
          type="text"
          placeholder={dict.search_placeholder}
          value={search}
          onChange={(inputEvent) => setSearch(inputEvent.target.value)}
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
                  {body.active === false && <span className={styles.badge}>{dict.inactive_badge}</span>}
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
