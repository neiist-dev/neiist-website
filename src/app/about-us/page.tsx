import Image from "next/image";
import {
  getAllMemberships,
  getAllTeams,
  getAllAdminBodies,
  getDepartmentRoleOrder,
} from "@/utils/dbUtils";
import { getFirstAndLastName } from "@/utils/userUtils";
import { Membership } from "@/types/memberships";
import teamImage from "@/assets/team.png";
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
  return date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
}

function getCurrentAcademicYearStartYear() {
  const now = new Date();
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
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

export default async function AboutPage({
  searchParams,
}: {
  searchParams?: Promise<{ year?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const [memberships, teams, adminBodies] = await Promise.all([
    getAllMemberships(),
    getAllTeams(),
    getAllAdminBodies(),
  ]);

  const allAcademicYears = getAllAcademicYears(memberships);
  const selectedYear =
    params?.year && allAcademicYears.includes(params.year) ? params.year : allAcademicYears[0];

  const filteredMemberships: Membership[] = memberships.filter((membership) =>
    isMembershipInAcademicYear(membership, selectedYear)
  );

  const departmentNamesWithMembers = Array.from(
    new Set(filteredMemberships.map((membership) => membership.departmentName))
  );
  const teamsWithMembers = teams
    .filter((team) => departmentNamesWithMembers.includes(team.name))
    .map((team) => ({
      name: team.name,
      description: team.description,
      type: "team" as const,
      active: team.active,
    }));
  const adminBodiesWithMembers = adminBodies
    .filter((adminBody) => departmentNamesWithMembers.includes(adminBody.name))
    .map((adminBody) => ({
      name: adminBody.name,
      type: "admin_body" as const,
      active: adminBody.active,
    }));
  const allDepartmentsWithMembers = [...adminBodiesWithMembers, ...teamsWithMembers].sort(
    (a, b) => {
      if (a.type === "admin_body" && b.type === "team") return -1;
      if (a.type === "team" && b.type === "admin_body") return 1;
      return a.name.localeCompare(b.name);
    }
  );

  const membersByDepartmentAndRole: Record<string, Record<string, Membership[]>> = {};
  filteredMemberships.forEach((membership) => {
    if (!membersByDepartmentAndRole[membership.departmentName])
      membersByDepartmentAndRole[membership.departmentName] = {};
    if (!membersByDepartmentAndRole[membership.departmentName][membership.roleName])
      membersByDepartmentAndRole[membership.departmentName][membership.roleName] = [];
    membersByDepartmentAndRole[membership.departmentName][membership.roleName].push(membership);
  });

  const roleOrders: Record<string, string[]> = {};
  await Promise.all(
    allDepartmentsWithMembers.map(async (department) => {
      const order = await getDepartmentRoleOrder(department.name);
      roleOrders[department.name] = order
        .sort((a, b) => a.position - b.position)
        .map((role) => role.role_name);
    })
  );

  const totalMembers = filteredMemberships.length;

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Quem somos?</h1>
      <div className={styles.introRow}>
        <p className={styles.introText}>
          A equipa do NEIIST é composta por {totalMembers} estudantes do Instituto Superior Técnico,
          motivados e interessados em ajudar todos os alunos da instituição que têm interesse nas
          mais diversas áreas da Informática. Todos os colaboradores contribuem com a sua dedicação
          e tempo para organizar uma ampla variedade de atividades que visam auxiliar a comunidade
          académica a ter o melhor percurso e projeto académico possível.
        </p>
        <Image
          src={teamImage}
          alt="Equipa NEIIST"
          width={400}
          height={300}
          className={styles.teamImage}
        />
      </div>

      <div className={styles.timelineRow}>
        <span className={styles.timelineLabel}>Ano letivo:</span>
        {allAcademicYears.map((year) => {
          const isSelected = year === selectedYear;
          const urlParams = new URLSearchParams();
          urlParams.set("year", year);
          return (
            <a
              key={year}
              href={`?${urlParams.toString()}`}
              className={styles.timelineButton}
              data-selected={isSelected}>
              {year}
            </a>
          );
        })}
      </div>

      <h2 className={styles.sectionTitle}>As nossas equipas</h2>
      <div className={styles.teamsGrid}>
        {teamsWithMembers.map((department) => (
          <div key={department.name} className={styles.teamCard}>
            <h3 className={styles.teamCardTitle}>{department.name}</h3>
            <p className={styles.teamCardDescription}>{department.description}</p>
          </div>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>Membros {selectedYear}</h2>
      {allDepartmentsWithMembers.map((department) => {
        const allRolesWithMembers = Object.keys(membersByDepartmentAndRole[department.name] || {});
        const hierarchy = roleOrders[department.name] || [];
        const rolesToShow = [
          ...hierarchy,
          ...allRolesWithMembers.filter((role) => !hierarchy.includes(role)),
        ];

        return (
          <div key={department.name}>
            <h3 className={styles.departmentTitle}>{department.name}</h3>
            <div className={styles.membersGrid}>
              {rolesToShow.flatMap((role) =>
                (membersByDepartmentAndRole[department.name]?.[role] || []).map((member) => (
                  <div key={member.id} className={styles.memberCard}>
                    <Image
                      src={member.userPhoto}
                      alt={member.userName}
                      width={120}
                      height={120}
                      className={styles.memberPhoto}
                    />
                    <span className={styles.memberName}>
                      {getFirstAndLastName(member.userName)}
                    </span>
                    <span className={styles.memberRole}>{member.roleName}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
