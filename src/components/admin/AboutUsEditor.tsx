"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { User } from "@/types/user";
import { Membership, Role, RawRole } from "@/types/memberships";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";
import YearSelector from "@/components/about-us/YearSelector";
import memberCardStyles from "@/styles/components/about-us/MemberCard.module.css";
import styles from "@/styles/pages/AboutUs.module.css";

function getAcademicYearRange(year: string) {
  const [startYear, endYear] = year.split("/").map(Number);
  return {
    start: new Date(`${startYear}-09-01`),
    end: new Date(`${endYear}-07-31`),
  };
}

function isMembershipInAcademicYear(membership: Membership, year: string) {
  const { start, end } = getAcademicYearRange(year);
  const from = new Date(membership.startDate);
  const to = membership.endDate ? new Date(membership.endDate) : null;
  return from <= end && (to === null || to >= start);
}

function getAcademicYearStartYear(date: Date) {
  return date.getMonth() >= 7 ? date.getFullYear() : date.getFullYear() - 1;
}

function getCurrentAcademicYearStartYear() {
  const now = new Date();
  return getAcademicYearStartYear(now);
}

function getAllAcademicYears(memberships: Membership[]) {
  if (memberships.length === 0) return [];
  let minYear = Infinity,
    maxYear = -Infinity;
  const currentAcademicYearStart = getCurrentAcademicYearStartYear();
  memberships.forEach((membership) => {
    const start = new Date(membership.startDate);
    const end = membership.endDate ? new Date(membership.endDate) : null;
    const startYear = getAcademicYearStartYear(start);
    const endYear = end ? getAcademicYearStartYear(end) : currentAcademicYearStart;
    if (startYear < minYear) minYear = startYear;
    if (endYear > maxYear) maxYear = endYear;
  });
  if (currentAcademicYearStart > maxYear) maxYear = currentAcademicYearStart;
  const years: string[] = [];
  for (let year = minYear; year <= maxYear; year++) years.push(`${year}/${year + 1}`);
  return years.reverse();
}

export default function AboutUsEditor({
  departments,
  memberships,
  users,
}: {
  departments: { name: string; description?: string; department_type?: string; active?: boolean }[];
  memberships: Membership[];
  users: User[];
}) {
  const allAcademicYears = getAllAcademicYears(memberships);
  const [selectedYear, setSelectedYear] = useState(allAcademicYears[0]);
  const [roleOrders, setRoleOrders] = useState<Record<string, string[]>>({});

  const filteredMemberships = memberships.filter((membership) =>
    isMembershipInAcademicYear(membership, selectedYear)
  );

  const departmentsWithMembers = departments.filter((department) =>
    filteredMemberships.some((membership) => membership.departmentName === department.name)
  );

  const membersByDepartmentAndRole: Record<string, Record<string, Membership[]>> = {};
  filteredMemberships.forEach((membership) => {
    if (!membersByDepartmentAndRole[membership.departmentName])
      membersByDepartmentAndRole[membership.departmentName] = {};
    if (!membersByDepartmentAndRole[membership.departmentName][membership.roleName])
      membersByDepartmentAndRole[membership.departmentName][membership.roleName] = [];
    membersByDepartmentAndRole[membership.departmentName][membership.roleName].push(membership);
  });

  useEffect(() => {
    departmentsWithMembers.forEach((department) => {
      Promise.all([
        fetch(`/api/admin/roles?department=${encodeURIComponent(department.name)}`).then((res) =>
          res.json()
        ),
        fetch(`/api/admin/role-hierarchy?department=${encodeURIComponent(department.name)}`).then(
          (res) => res.json()
        ),
      ]).then(([allRolesRaw, orderRaw]) => {
        const allRoles: Role[] = (allRolesRaw as RawRole[])
          .map((role) => ({
            roleName: role.roleName ?? role.role_name,
            access: role.access,
          }))
          .filter((role): role is Role => typeof role.roleName === "string");

        let orderedRoles = allRoles.map((role) => role.roleName);

        if (orderRaw && orderRaw.length > 0) {
          type OrderItem = { roleName?: string; role_name?: string; position: number };
          const order = (orderRaw as OrderItem[]).map((r) => ({
            roleName: r.roleName ?? r.role_name,
            position: r.position,
          }));

          orderedRoles = order
            .sort((a, b) => a.position - b.position)
            .map((role) => role.roleName)
            .filter(
              (role): role is string =>
                typeof role === "string" && allRoles.some((aRole) => aRole.roleName === role)
            );
          orderedRoles = [
            ...orderedRoles,
            ...allRoles.map((role) => role.roleName).filter((role) => !orderedRoles.includes(role)),
          ];
        }
        setRoleOrders((prev) => ({ ...prev, [department.name]: orderedRoles }));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, departmentsWithMembers.length, filteredMemberships.length, users.length]);

  async function saveOrder(departmentName: string, newRoles: string[]) {
    await fetch("/api/admin/role-hierarchy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departmentName, roles: newRoles }),
    });
  }

  function handleDragEnd(departmentName: string, event: DragEndEvent) {
    const roles = roleOrders[departmentName] || [];
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = roles.indexOf(active.id as string);
    const newIndex = roles.indexOf(over.id as string);
    const newOrder = arrayMove(roles, oldIndex, newIndex);
    setRoleOrders((prev) => ({ ...prev, [departmentName]: newOrder }));
    saveOrder(departmentName, newOrder);
  }

  return (
    <section className={styles.page}>
      <h2 className={styles.title}>Pré-visualização da Página Sobre nós</h2>
      <div style={{ marginBottom: "2rem" }}>
        <YearSelector
          {...({
            years: allAcademicYears,
            selectedYear: selectedYear,
            visible: 5,
            onChange: setSelectedYear,
          } as any)}
        />
      </div>
      {departmentsWithMembers.map((dept) => {
        const roles = roleOrders[dept.name] || [];
        return (
          <div key={dept.name} className={styles.departmentSection}>
            <h3 className={styles.departmentTitle}>{dept.name}</h3>
            {dept.description && (
              <p className={styles.teamCardDescription}>{dept.description}</p>
            )}
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={(event) => handleDragEnd(dept.name, event)}
            >
              <SortableContext items={roles}>
                <div className={styles.membersGrid}>
                  {roles
                    .filter((role) => !!role)
                    .map((role) => {
                      const safeRole = role || "unknown";
                      const members = membersByDepartmentAndRole[dept.name]?.[safeRole] || [];
                      if (members.length === 0) {
                        return (
                          <SortableRoleCard
                            key={safeRole + "-empty"}
                            id={safeRole}
                            name="Sem membro"
                            photo="/default_user.png"
                            role={safeRole}
                            isGeneric
                          />
                        );
                      }
                      return members.map((member) => (
                        <SortableRoleCard
                          key={safeRole + "-" + member.id}
                          id={safeRole}
                          name={member.userName}
                          photo={member.userPhoto}
                          role={safeRole}
                        />
                      ));
                    })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        );
      })}
    </section>
  );
}

function SortableRoleCard({
  id,
  name,
  photo,
  role,
  isGeneric = false,
}: {
  id: string;
  name: string;
  photo: string;
  role: string;
  isGeneric?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={memberCardStyles.container}
      style={{
        opacity: isDragging ? 0.5 : 1,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        cursor: "grab",
        background: isGeneric ? "#f3f3f3" : undefined,
      }}
      {...attributes}
      {...listeners}
    >
      <div className={memberCardStyles.imageCard}>
        <Image
          alt={`${name} photo`}
          className={memberCardStyles.cardImage}
          src={photo}
          fill
        />
      </div>
      <div className={memberCardStyles.name}>
        <p className={memberCardStyles.nameText}>{name}</p>
      </div>
      <div className={memberCardStyles.role}>
        <p className={memberCardStyles.roleText}>{role}</p>
      </div>
    </div>
  );
}
