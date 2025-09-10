"use client";

import { useState, useRef, useMemo } from "react";
import Image from "next/image";
import { useUser } from "@/context/UserContext";
import Fuse from "fuse.js";
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

  const fuse = useMemo(() => {
    const allMembers = Object.values(members).flat();
    return new Fuse(allMembers, {
      keys: ["userName", "userNumber", "userEmail"],
      threshold: 0.4,
      ignoreLocation: true,
    });
  }, [members]);

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const results = fuse.search(search.trim()).map((r) => r.item);
    const grouped: Record<string, Membership[]> = {};
    Object.entries(members).forEach(([dept, memberships]) => {
      grouped[dept] = memberships.filter((m) => results.includes(m));
      if (grouped[dept].length === 0) delete grouped[dept];
    });
    return grouped;
  }, [search, members, fuse]);

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
          <input
            className={styles.input}
            type="text"
            placeholder="Pesquisar por nome, ISTID ou email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {Object.keys(filteredMembers).length === 0 ? (
          <div className={styles.emptyMessage}>Nenhum membro encontrado.</div>
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
