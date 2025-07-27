"use client";

import { useState, useRef, useMemo } from "react";
import Image from "next/image";
import { useUser } from "@/context/UserContext";
import styles from "@/styles/components/photo-management/PhotoTeamMembers.module.css";

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
}: {
  membersByDepartment: Record<string, Membership[]>;
  departments: Department[];
}) {
  const [search, setSearch] = useState("");
  const [editingPhotoIstid, setEditingPhotoIstid] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [members, setMembers] = useState(membersByDepartment);
  const { user, setUser } = useUser();

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const s = search.trim().toLowerCase();
    const filtered: Record<string, Membership[]> = {};
    Object.entries(members).forEach(([dept, memberships]) => {
      const filteredMemberships = memberships.filter(
        (m) =>
          m.userName.toLowerCase().includes(s) ||
          m.userNumber.toLowerCase().includes(s) ||
          m.userEmail.toLowerCase().includes(s)
      );
      if (filteredMemberships.length) filtered[dept] = filteredMemberships;
    });
    return filtered;
  }, [search, members]);

  const handlePhotoClick = (istid: string) => {
    setEditingPhotoIstid(istid);
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>, istid: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const res = await fetch(`/api/user/update/${istid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: base64 }),
      });
      if (res.ok) {
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
      }
      setEditingPhotoIstid(null);
    };
    reader.readAsDataURL(file);
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
          <input
            className={styles.input}
            type="text"
            placeholder="Pesquisar por nome, ISTID ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {Object.keys(filteredMembers).length === 0 ? (
          <div className={styles.emptyMessage}>Nenhum membro encontrado.</div>
        ) : (
          Object.entries(filteredMembers).map(([dept, memberships]) => (
            <div key={dept}>
              <h3 style={{ margin: "2rem 0 1rem 0" }}>{dept}</h3>
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
                        title="Clique para alterar a foto"
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
