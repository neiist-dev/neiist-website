"use client";

import { useState, useRef, useMemo } from "react";
import Image from "next/image";
import { useUser } from "@/context/UserContext";
import Search from "@/components/search/Search";
import { useSearch } from "@/hooks/useSearch";
import styles from "@/styles/components/photo-management/PhotoTeamMembers.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface Membership {
  id: string;
  userNumber: string;
  userName: string;
  departmentName: string;
  roleName: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  userEmail: string;
  userPhoto: string;
}

interface Department {
  name: string;
  active: boolean;
}

export default function PhotoTeamMembers({
  membersByDepartment,
  dict,
}: {
  membersByDepartment: Record<string, Membership[]>;
  departments: Department[];
  dict: Dictionary["photo_management"];
}) {
  const [editingPhotoIstid, setEditingPhotoIstid] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [members, setMembers] = useState(membersByDepartment);
  const { user, setUser } = useUser();

  const allMembersList = useMemo(() => Object.values(members).flat(), [members]);

  const {
    results: searchedMembers,
    query: search,
    setQuery: setSearch,
  } = useSearch<Membership>({
    data: allMembersList,
    fields: [
      { field: "userName", boost: 3 },
      { field: "userNumber", boost: 4 },
      "departmentName",
      "roleName",
    ],
    returnAllWhenEmpty: true,
  });

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const searchKeys = new Set(searchedMembers.map((m) => m.id));
    const grouped: Record<string, Membership[]> = {};
    Object.entries(members).forEach(([dept, memberships]) => {
      const filtered = memberships.filter((m) => searchKeys.has(m.id));
      if (filtered.length > 0) grouped[dept] = filtered;
    });
    return grouped;
  }, [search, searchedMembers, members]);

  const handlePhotoClick = (istid: string) => {
    setEditingPhotoIstid(istid);
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>, istid: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageInput = new FileReader();
    imageInput.onloadend = async () => {
      const base64 = (imageInput.result as string).split(",")[1];
      const response = await fetch(`/api/user/update/${istid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: base64 }),
      });
      if (response.ok) {
        const newPhotoUrl = `/api/user/photo/${istid}?custom&${Date.now()}`;
        setMembers((prev) => {
          const updated: typeof prev = {};
          Object.entries(prev).forEach(([dept, memberships]) => {
            updated[dept] = memberships.map((m) =>
              m.userNumber === istid ? { ...m, userPhoto: newPhotoUrl } : m
            );
          });
          return updated;
        });
        if (user && user.istid === istid) {
          setUser({ ...user, photo: newPhotoUrl });
        }
        // TODO: (SUCCESS) show success toast after the photo is updated.
      } else {
        // TODO: (ERROR) show error toast when the photo update fails.
      }
      setEditingPhotoIstid(null);
    };
    imageInput.readAsDataURL(file);
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={(e) => {
          if (editingPhotoIstid) handlePhotoChange(e, editingPhotoIstid);
        }}
      />
      <div className={styles.section}>
        <div className={styles.searchBar}>
          <Search
            className={styles.input}
            placeholder={dict.search_placeholder}
            value={search}
            onChange={setSearch}
          />
        </div>
        {Object.keys(filteredMembers).length === 0 ? (
          <div className={styles.emptyMessage}>{dict.empty}</div>
        ) : (
          Object.entries(filteredMembers).map(([dept, memberships]) => (
            <div key={dept}>
              <h3 className={styles.departmentName}>{dept}</h3>
              <div className={styles.membersList}>
                {memberships.map((membership) => (
                  <div key={membership.id} className={styles.memberCard}>
                    <div className={styles.changePhoto}>
                      <Image
                        className={styles.memberPhoto}
                        src={membership.userPhoto}
                        alt={membership.userName}
                        width={180}
                        height={180}
                        style={{ cursor: "pointer" }}
                        onClick={() => handlePhotoClick(membership.userNumber)}
                        title={dict.photo_tooltip}
                      />
                    </div>
                    <div className={styles.memberInfo}>
                      <div className={styles.memberName}>
                        {membership.userName} ({membership.userNumber})
                      </div>
                      <div className={styles.memberRoles}>{membership.roleName}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
