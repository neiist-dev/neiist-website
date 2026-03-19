"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { User, UserRole } from "@/types/user";
import { Membership } from "@/types/memberships";
import Fuse from "fuse.js";
import styles from "@/styles/components/admin/UsersSearchList.module.css";

interface Role {
  role_name: string;
  access: string;
  active: boolean;
}

interface UserWithMemberships extends User {
  memberships: Membership[];
}

export default function UsersSearchList({
  users,
  roles,
}: {
  users: UserWithMemberships[];
  roles: Role[];
}) {
  const [search, setSearch] = useState("");

  const [nameFilter, setNameFilter] = useState("");
  const [istIdFilter, setIstIdFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  
  const allDepartments = useMemo(() => {
    const departments = new Set<string>();
    users.forEach((user) => {
      user.memberships?.forEach((membership) => {
        departments.add(membership.departmentName);
      });
    });
    return Array.from(departments);
  }, [users]);

  const allRoles = useMemo(() => {
    const rolesSet = new Set<string>();
    users.forEach((user) => {
      user.memberships?.forEach((membership) => {
        rolesSet.add(membership.roleName);
      });
    });
    return Array.from(rolesSet);
  }, [users]);

  const manuallyFilteredUsers = useMemo(() => {
    return users.filter((user) => {

      if (nameFilter && !user.name.toLowerCase().includes(nameFilter.toLowerCase())) {
        return false;
      }
      if (istIdFilter && !user.istid.toLowerCase().includes(istIdFilter.toLowerCase())) {
        return false;
      }
      if (emailFilter && !user.email.toLowerCase().includes(emailFilter.toLowerCase())) {
        return false;
      }
      if (selectedRole) {
        const hasRole = user.memberships?.some(
          (membership) => membership.roleName === selectedRole
        );
        if (!hasRole) return false;
      }
      if (selectedDepartment) {
        const hasDepartment = user.memberships?.some(
          (membership) => membership.departmentName === selectedDepartment
        );
        if (!hasDepartment) return false;
      }
      return true;
    });
  }, [users, nameFilter, istIdFilter, emailFilter, selectedRole, selectedDepartment]);
 
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return manuallyFilteredUsers;
    return manuallyFilteredUsers.filter((user) => 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.istid.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [manuallyFilteredUsers, search]);

  const getAccessLevelForRole = (roleName: string): string => {
    const role = roles.find((role) => role.role_name === roleName);
    return role?.access || UserRole._GUEST;
  };

  const getAccessClass = (accessLevel: string): string => {
    return styles[accessLevel] || styles.guest;
  };

  return (
    <>
      <div className={styles.filtersSection}>
        <h3 className={styles.filterTitle}>Filtrar Utilizadores</h3>
        {/* Nome search */}
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Nome</label>
            <input
              className={styles.input}
              type="text"
              placeholder="Pesquisar por nome..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              list="name-suggestions"
            />
          <datalist id="name-suggestions">
            {users.slice(0, 5).map((user) => (
              <option key={user.istid} value={user.name} />
            ))}
          </datalist>
        </div>

        {/* IST ID search */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>IST ID</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Pesquisar por IST ID..."
            value={istIdFilter}
            onChange={(e) => setIstIdFilter(e.target.value)}
            list="istid-suggestions"
          />
          <datalist id="istid-suggestions">
            {users.slice(0, 5).map((user) => (
              <option key={user.istid} value={user.istid} />
            ))}
          </datalist>
        </div>
        {/* Email search */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Email</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Pesquisar por email..."
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            list="email-suggestions"
          />
          <datalist id="email-suggestions">
            {users.slice(0, 5).map((user) => (
              <option key={user.istid} value={user.email} />
            ))}
          </datalist>
        </div>

        {/* Cargo filter */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Cargo</label>
          <select
            className={styles.input}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}>
            <option value="">Todos os cargos</option>
            {allRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {/* Department filter */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Departamento</label>
          <select
            className={styles.input}
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}>
            <option value="">Todos os departamentos</option>
            {allDepartments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.activeFilters}> 
        {(nameFilter || istIdFilter || emailFilter || selectedRole || selectedDepartment) &&
          (<>
            <span className={styles.activeFilterLabel}>Filtros Ativos:</span>
            <button //limpa todos os filtros
              className={styles.clearButton}
              onClick={() => {
                setNameFilter("");
                setIstIdFilter("");
                setEmailFilter("");
                setSelectedRole("");
                setSelectedDepartment("");
              }}
            >
              Limpar Filtros
            </button>
          </>
          )}
      </div>

      <p className={styles.resultsCount}>
        {filteredUsers.length}{filteredUsers.length === 1 ? " resultado" : " resultados"}
        </p>
      </div>
      
      {filteredUsers.length === 0 ? (
        <p className={styles.emptyMessage}>Nenhum utilizador encontrado.</p>
      ) : (
        <div className={styles.itemsList}>
          {filteredUsers.map((user) => (
            <section key={user.istid} className={styles.item}>
              <Image
                src={user.photo}
                height={200}
                width={200}
                alt={`Foto de ${user.name}`}
                className={styles.userPhoto}
              />
              <div className={styles.itemContent}>
                <h4>
                  {user.name} <span className={styles.istid}>({user.istid})</span>
                </h4>
                <p className={styles.hideOnMobile}>
                  <strong>Email:</strong> {user.email}
                </p>
                {user.phone && (
                  <p className={styles.hideOnMobile}>
                    <strong>Telefone:</strong> {user.phone}
                  </p>
                )}
                {user.courses?.length > 0 && (
                  <p className={styles.hideOnMobile}>
                    <strong>Cursos:</strong> {user.courses.join(", ")}
                  </p>
                )}
                {user.memberships?.length > 0 && (
                  <>
                    <strong>Equipas/Órgãos:</strong>
                    <ul className={styles.membershipsList}>
                      {user.memberships.map((membership, id) => {
                        const accessLevel = getAccessLevelForRole(membership.roleName);
                        return (
                          <li key={id} className={styles.membershipItem}>
                            <span className={styles.teamName}>{membership.departmentName}</span>
                            <span className={styles.roleSeparator}>-</span>
                            <span>{membership.roleName}</span>
                            <span
                              className={`${styles.accessBadge} ${getAccessClass(accessLevel)}`}>
                              {accessLevel}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
