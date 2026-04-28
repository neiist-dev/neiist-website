"use client";

import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import { User } from "@/types/user";
import { Membership } from "@/types/memberships";
import { useUser } from "@/context/UserContext";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import styles from "@/styles/components/admin/MembershipsSearchList.module.css";

interface Department {
  name: string;
  active: boolean;
}

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export default function MembershipsSearchList({
  memberships: initialMemberships,
  users,
  departments,
  dict,
}: {
  memberships: Membership[];
  users: Partial<User>[];
  departments: Department[];
  dict:{
    add_member_title: string;
    select_user: string;
    select_department: string;
    select_role: string;
    adding: string;
    add_member: string;
    existing_members_title: string;
    search_placeholder: string;
    active: string;
    show_inactive: string;
    empty: string;
    change_photo: string;
    change_photo_inactive: string;
    department_label: string;
    role_label: string;
    email_label: string;
    since_label: string;
    until_label: string;
    active_badge: string;
    inactive_badge: string;
    remove: string;
    confirm_remove: string;
    errors: {
      add_member: string;
      remove_member: string;
    };
    confirm_dialog: {
      confirm: string;
      cancel: string;
    };
  };
}) {
  const [memberships, setMemberships] = useState(initialMemberships);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [newMembership, setNewMembership] = useState({
    userNumber: "",
    departmentName: "",
    roleName: "",
  });
  const [roles, setRoles] = useState<{ role_name: string; access: string; active: boolean }[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{
    userNumber: string;
    departmentName: string;
    roleName: string;
  } | null>(null);
  const [editingPhotoIstid, setEditingPhotoIstid] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user, setUser } = useUser();

  const filteredMemberships = useMemo(() => {
    const base = memberships.filter((membership) =>
      showInactive ? !membership.isActive : membership.isActive
    );

    const rawQuery = search.trim();
    if (!rawQuery) return base;

    const normalizedQuery = normalizeText(rawQuery);

    const istWithPrefix = /^ist\d+$/i.test(rawQuery);
    const digitsOnly = /^\d{5,10}$/.test(rawQuery);

    if (istWithPrefix || digitsOnly) {
      const digits = rawQuery.replace(/[^0-9]/g, "");

      const exact = base.filter(
        (membership) => (membership.userNumber || "").replace(/[^0-9]/g, "") === digits
      );
      if (exact.length > 0) return exact;

      return base.filter((membership) =>
        (membership.userNumber || "").replace(/[^0-9]/g, "").startsWith(digits)
      );
    }

    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

    return base
      .filter((membership) => {
        const searchableText = normalizeText(
          `${membership.userName} ${membership.userEmail} ${membership.departmentName} ${membership.roleName}`
        );
        const textTokens = searchableText.split(/\s+/).filter(Boolean);

        return queryTokens.every((qToken) => textTokens.some((token) => token.startsWith(qToken)));
      })
      .sort((a, b) => a.userName.localeCompare(b.userName));
  }, [memberships, search, showInactive]);

  const handleDepartmentChange = async (departmentName: string) => {
    setNewMembership({ ...newMembership, departmentName, roleName: "" });
    if (departmentName) {
      const response = await fetch(
        `/api/admin/roles?department=${encodeURIComponent(departmentName)}`
      );
      if (response.ok) {
        const data = await response.json();
        setRoles(Array.isArray(data) ? data.filter((r: { active: boolean }) => r.active) : []);
      } else {
        setRoles([]);
      }
    } else {
      setRoles([]);
    }
  };

  const addMembership = async () => {
    setError("");
    if (!newMembership.userNumber || !newMembership.departmentName || !newMembership.roleName)
      return;
    setAdding(true);
    try {
      const response = await fetch("/api/admin/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          istid: newMembership.userNumber,
          departmentName: newMembership.departmentName,
          roleName: newMembership.roleName,
        }),
      });
      if (response.ok) {
        const refreshed = await fetch("/api/admin/memberships");
        if (refreshed.ok) {
          const data = await refreshed.json();
          setMemberships(Array.isArray(data) ? data : []);
        }
        setNewMembership({ userNumber: "", departmentName: "", roleName: "" });
        setRoles([]);
        // TODO: (SUCCESS) show success toast after the member is added.
      } else {
        const error = await response.json();
        // TODO: (ERROR)
        setError(error.error || dict.errors.add_member);
      }
    } catch {
      // TODO: (ERROR)
      setError(dict.errors.add_member);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveClick = (userNumber: string, departmentName: string, roleName: string) => {
    setPendingRemove({ userNumber, departmentName, roleName });
    setConfirmOpen(true);
  };

  const confirmRemove = async () => {
    if (!pendingRemove) return;
    setError("");
    setConfirmOpen(false);
    try {
      const response = await fetch("/api/admin/memberships", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          istid: pendingRemove.userNumber,
          departmentName: pendingRemove.departmentName,
          roleName: pendingRemove.roleName,
        }),
      });
      if (response.ok) {
        const refreshed = await fetch("/api/admin/memberships");
        if (refreshed.ok) {
          const data = await refreshed.json();
          setMemberships(Array.isArray(data) ? data : []);
        }
        // TODO: (SUCCESS) show success toast after the member is removed.
      } else {
        const error = await response.json();
        // TODO: (ERROR)
        setError(error.error || dict.errors.remove_member);
      }
    } catch {
      // TODO: (ERROR)
      setError(dict.errors.remove_member);
    } finally {
      setPendingRemove(null);
    }
  };

  const cancelRemove = () => {
    setConfirmOpen(false);
    setPendingRemove(null);
  };

  const handlePhotoClick = (istid: string) => {
    setEditingPhotoIstid(istid);
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>, istid: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const photoData = new FileReader();
    photoData.onloadend = async () => {
      const base64 = (photoData.result as string).split(",")[1];
      const response = await fetch(`/api/user/update/${istid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: base64 }),
      });
      if (response.ok) {
        const newPhotoUrl = `/api/user/photo/${istid}?custom&${Date.now()}`;
        setMemberships((prev) =>
          prev.map((membership) =>
            membership.userNumber === istid ? { ...membership, userPhoto: newPhotoUrl } : membership
          )
        );
        if (user && user.istid === istid) {
          setUser({ ...user, photo: newPhotoUrl });
        }
        // TODO: (SUCCESS) show success toast after the member photo is updated.
      } else {
        // TODO: (ERROR) show error toast when updating the member photo fails.
      }
      setEditingPhotoIstid(null);
    };
    photoData.readAsDataURL(file);
  };

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        message={dict.confirm_remove}
        onConfirm={confirmRemove}
        onCancel={cancelRemove}
        dict={dict.confirm_dialog}
      />

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={(e) => {
          if (editingPhotoIstid) handlePhotoChange(e, editingPhotoIstid);
        }}
      />
      <section className={styles.section}>
        <h3>{dict.add_member_title}</h3>
        <div className={styles.addMemberForm}>
          <select
            value={newMembership.userNumber}
            onChange={(inputEvent) =>
              setNewMembership({ ...newMembership, userNumber: inputEvent.target.value })
            }
            className={styles.input}
            disabled={adding}>
            <option value="">{dict.select_user}</option>
            {users.map((user) => (
              <option key={user.istid} value={user.istid}>
                {user.name} ({user.istid}) - {user.email}
              </option>
            ))}
          </select>
          <select
            value={newMembership.departmentName}
            onChange={(inputEvent) => handleDepartmentChange(inputEvent.target.value)}
            className={styles.input}
            disabled={adding}>
            <option value="">{dict.select_department}</option>
            {departments.map((dept) => (
              <option key={dept.name} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
          <select
            value={newMembership.roleName}
            onChange={(inputEvent) =>
              setNewMembership({ ...newMembership, roleName: inputEvent.target.value })
            }
            className={styles.input}
            disabled={adding || !newMembership.departmentName}>
            <option value="">{dict.select_role}</option>
            {roles.map((role) => (
              <option key={role.role_name} value={role.role_name}>
                {role.role_name} ({role.access})
              </option>
            ))}
          </select>
          <button
            onClick={addMembership}
            disabled={
              adding ||
              !newMembership.userNumber ||
              !newMembership.departmentName ||
              !newMembership.roleName
            }
            className={styles.addMemberBtn}>
            {adding ? dict.adding : dict.add_member}
          </button>
        </div>
        {/* TODO: replace this inline error with a toast and remove this fallback once Sonner is implemented here. */}
        {error && <div className={styles.error}>{error}</div>}
      </section>

      <section className={styles.section}>
        <h3>{dict.existing_members_title}</h3>
        <div className={styles.searchBar}>
          <input
            className={styles.input}
            type="text"
            placeholder={dict.search_placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className={`${styles.filterBtn} ${!showInactive ? styles.active : ""}`}
            onClick={() => setShowInactive(false)}>
            {dict.active}
          </button>
          <button
            className={`${styles.filterBtn} ${showInactive ? styles.active : ""}`}
            onClick={() => setShowInactive(true)}>
            {dict.show_inactive}
          </button>
        </div>
        {filteredMemberships.length === 0 ? (
          <div className={styles.emptyMessage}>{dict.empty}</div>
        ) : (
          <div className={styles.membersList}>
            {filteredMemberships.map((membership) => (
              <div key={membership.id} className={styles.memberCard}>
                <div className={membership.isActive ? styles.changePhoto : undefined}>
                  <Image
                    className={styles.memberPhoto}
                    src={membership.userPhoto}
                    alt={membership.userName}
                    width={160}
                    height={160}
                    style={{ cursor: membership.isActive ? "pointer" : "not-allowed" }}
                    onClick={() => {
                      if (membership.isActive) handlePhotoClick(membership.userNumber);
                    }}
                    title={
                      membership.isActive
                        ? dict.change_photo
                        : dict.change_photo_inactive
                    }
                  />
                </div>
                <div className={styles.memberInfo}>
                  <div className={styles.memberName}>
                    {membership.userName} ({membership.userNumber})
                  </div>
                  <div>
                    <strong>{dict.department_label}</strong> {membership.departmentName}
                  </div>
                  <div>
                    <strong>{dict.role_label}</strong> {membership.roleName}
                  </div>
                  <div>
                    <strong>{dict.email_label}</strong> {membership.userEmail}
                  </div>
                  <div>
                    <strong>{dict.since_label}</strong>{" "}
                    {new Date(membership.startDate).toLocaleDateString("pt-PT")}
                    {membership.endDate && (
                      <>
                        {" "}
                        <strong>{dict.until_label}</strong>{" "}
                        {new Date(membership.endDate).toLocaleDateString("pt-PT")}
                      </>
                    )}
                  </div>
                </div>
                <div className={styles.memberActions}>
                  <span className={styles.badge}>{membership.isActive ? dict.active_badge : dict.inactive_badge}</span>
                  <button
                    onClick={() =>
                      handleRemoveClick(
                        membership.userNumber,
                        membership.departmentName,
                        membership.roleName
                      )
                    }
                    className={styles.deleteBtn}>
                    {dict.remove}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
