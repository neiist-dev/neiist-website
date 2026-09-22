"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { Membership } from "@/types/memberships";
import { useUser } from "@/context/UserContext";
import { SearchInput, Select, Button, Badge } from "@neiist/ui";
import { useSearch } from "@/hooks/useSearch";
import { FaCamera } from "react-icons/fa";
import MemberAvatar from "@/components/layout/MemberAvatar";
import { toast } from "sonner";
import styles from "@/styles/components/management/ManagementTabs.module.css";
import photoStyles from "@/styles/components/management/PhotosTab.module.css";
import type { Dictionary } from "@/i18n/dictionaries";
import { getYearMembershipsAction } from "@/actions/admin/memberships";

interface Department {
  name: string;
  active: boolean;
  department_type?: string;
  display_order?: number;
}

interface PhotosTabProps {
  memberships: Membership[];
  departments: Department[];
  academicYears?: string[];
  currentAcademicYear?: string;
  dict: Dictionary;
}

export default function PhotosTab({
  memberships: initialMemberships,
  departments,
  academicYears = [],
  currentAcademicYear = "",
  dict,
}: PhotosTabProps) {
  const pDict = dict.photo_management;
  const [selectedYear, setSelectedYear] = useState<string>(
    currentAcademicYear || academicYears[0] || ""
  );
  const [memberships, setMemberships] = useState<Membership[]>(initialMemberships);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [editingPhotoIstid, setEditingPhotoIstid] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user, setUser } = useUser();

  // Fetch memberships when academic year changes
  useEffect(() => {
    let ignore = false;
    async function fetchYearMemberships() {
      if (selectedYear === currentAcademicYear) {
        setMemberships(initialMemberships);
        return;
      }
      try {
        const data = await getYearMembershipsAction(selectedYear);
        if (!ignore && Array.isArray(data)) {
          setMemberships(data);
        }
      } catch {
        // keep current memberships
      }
    }
    fetchYearMemberships();
    return () => {
      ignore = true;
    };
  }, [selectedYear, currentAcademicYear, initialMemberships]);

  // Departments available for selected year
  const availableDepartments = useMemo(() => {
    const isCurrent = selectedYear === currentAcademicYear;
    const activeDeptNamesInYear = new Set(memberships.map((m) => m.departmentName));
    return departments
      .filter((d) => activeDeptNamesInYear.has(d.name) || (isCurrent && d.active))
      .sort((a, b) => {
        const orderA = a.display_order ?? 999;
        const orderB = b.display_order ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
  }, [departments, selectedYear, currentAcademicYear, memberships]);

  // Reset selected department if no longer in year
  useEffect(() => {
    if (selectedDept && !availableDepartments.some((d) => d.name === selectedDept)) {
      setSelectedDept("");
    }
  }, [availableDepartments, selectedDept]);

  const deptFilteredMembers = useMemo(() => {
    return memberships.filter((m) => {
      if (selectedDept && m.departmentName !== selectedDept) return false;
      return true;
    });
  }, [memberships, selectedDept]);

  const uniqueMembers = useMemo(() => {
    const map = new Map<
      string,
      { member: Membership; roles: { departmentName: string; roleName: string }[] }
    >();
    for (const deptMember of deptFilteredMembers) {
      const existing = map.get(deptMember.userNumber);
      if (!existing) {
        map.set(deptMember.userNumber, {
          member: deptMember,
          roles: [{ departmentName: deptMember.departmentName, roleName: deptMember.roleName }],
        });
      } else if (
        !existing.roles.some(
          (role) =>
            role.departmentName === deptMember.departmentName &&
            role.roleName === deptMember.roleName
        )
      ) {
        existing.roles.push({
          departmentName: deptMember.departmentName,
          roleName: deptMember.roleName,
        });
      }
    }
    return Array.from(map.values()).map((user) => ({
      ...user,
      userName: user.member.userName,
      userNumber: user.member.userNumber,
      searchRoles: user.roles.map((role) => `${role.departmentName} ${role.roleName}`).join(" "),
    }));
  }, [deptFilteredMembers]);

  const {
    results: filteredMembers,
    query: search,
    setQuery: setSearch,
  } = useSearch({
    data: uniqueMembers,
    fields: ["userName", "userNumber", "searchRoles"],
    returnAllWhenEmpty: true,
  });

  const triggerUpload = (istid: string) => {
    setEditingPhotoIstid(istid);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPhotoIstid) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch(`/api/user/update/${editingPhotoIstid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photo: base64 }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to upload photo");
        }

        const newPhotoUrl = `/api/user/photo/${editingPhotoIstid}?custom&t=${Date.now()}`;
        setMemberships((prev) =>
          prev.map((member) =>
            member.userNumber === editingPhotoIstid ? { ...member, userPhoto: newPhotoUrl } : member
          )
        );

        if (user && user.istid === editingPhotoIstid) {
          setUser({ ...user, photo: newPhotoUrl });
        }

        toast.success(pDict.photo_updated);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : pDict.photo_error);
      } finally {
        setIsUploading(false);
        setEditingPhotoIstid(null);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <section aria-label={pDict.title}>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className={photoStyles.hiddenFileInput}
        onChange={handlePhotoFileChange}
      />

      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <div className={styles.searchInputWrapper}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={pDict.search_placeholder}
              clearLabel={pDict.clear_search}
            />
          </div>

          {academicYears.length > 0 && (
            <div className={styles.selectWrapper}>
              <Select
                options={academicYears.map((year) => ({ label: year, value: year }))}
                value={selectedYear}
                onChange={setSelectedYear}
                placeholder={pDict.select_year}
              />
            </div>
          )}

          <div className={styles.selectWrapper}>
            <Select
              options={[
                { label: pDict.all_departments, value: "" },
                ...availableDepartments.map((department) => ({
                  label: department.name,
                  value: department.name,
                })),
              ]}
              value={selectedDept}
              onChange={setSelectedDept}
              placeholder={pDict.all_departments}
            />
          </div>
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className={styles.emptyState}>{pDict.empty}</div>
      ) : (
        <div className={photoStyles.photoGrid}>
          {filteredMembers.map(({ member: membership, roles }) => (
            <article key={membership.userNumber} className={photoStyles.photoCard}>
              <MemberAvatar name={membership.userName} photo={membership.userPhoto} size="lg" />
              <h4>{membership.userName}</h4>
              <p>{membership.userNumber}</p>
              <div className={photoStyles.badges}>
                {roles.map((role) => (
                  <Badge
                    key={`${role.departmentName}-${role.roleName}`}
                    variant="outline"
                    size="sm"
                    title={`${role.departmentName} • ${role.roleName}`}>
                    <strong>{role.departmentName}</strong>
                    <span>•</span>
                    <span>{role.roleName}</span>
                  </Badge>
                ))}
              </div>
              <div className={photoStyles.cardAction}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => triggerUpload(membership.userNumber)}
                  disabled={isUploading}
                  aria-label={(pDict.photo_change_for || "Change photo for {name}").replace(
                    "{name}",
                    membership.userName
                  )}>
                  <FaCamera />
                  {pDict.change_photo}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
