import Image from "next/image";
import {
  getAllMemberships,
  getAllUsers,
  getAllTeams,
  getAllAdminBodies,
  getDepartmentRoleOrder,
} from "@/utils/dbUtils";
import { getFirstAndLastName } from "@/utils/userUtils";
import teamImage from "@/assets/team.png";
import styles from "@/styles/pages/AboutUs.module.css";

function getAcademicYearRange(year: string) {
  const [startYear, endYear] = year.split("/").map(Number);
  return {
    start: new Date(`${startYear}-09-01`),
    end: new Date(`${endYear}-07-31`),
  };
}

function isMembershipInAcademicYear(m: RawMembership, year: string) {
  const { start, end } = getAcademicYearRange(year);
  const from = new Date(m.from_date);
  const to = m.to_date ? new Date(m.to_date) : null;
  return from <= end && (to === null || to >= start);
}

function getAcademicYearStartYear(date: Date) {
  return date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
}

function getCurrentAcademicYearStartYear() {
  const now = new Date();
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
}

function getAllAcademicYears(memberships: RawMembership[]) {
  if (memberships.length === 0) return [];
  let minYear = Infinity,
    maxYear = -Infinity;
  const currentAcademicYearStart = getCurrentAcademicYearStartYear();
  memberships.forEach((m) => {
    const start = new Date(m.from_date);
    const end = m.to_date ? new Date(m.to_date) : null;
    const startYear = getAcademicYearStartYear(start);
    const endYear = end ? getAcademicYearStartYear(end) : currentAcademicYearStart;
    if (startYear < minYear) minYear = startYear;
    if (endYear > maxYear) maxYear = endYear;
  });
  if (currentAcademicYearStart > maxYear) maxYear = currentAcademicYearStart;
  const years: string[] = [];
  for (let y = minYear; y <= maxYear; y++) years.push(`${y}/${y + 1}`);
  return years.reverse();
}

interface RawMembership {
  user_istid: string;
  user_name: string;
  department_name: string;
  role_name: string;
  from_date: string;
  to_date: string | null;
  active: boolean;
}

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

export default async function AboutPage({
  searchParams,
}: {
  searchParams?: Promise<{ year?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const [membershipsRaw, users, teams, adminBodies] = await Promise.all([
    getAllMemberships(),
    getAllUsers(),
    getAllTeams(),
    getAllAdminBodies(),
  ]);

  const allAcademicYears = getAllAcademicYears(membershipsRaw);
  const selectedYear =
    params?.year && allAcademicYears.includes(params.year) ? params.year : allAcademicYears[0];

  const memberships: Membership[] = membershipsRaw
    .filter((m) => isMembershipInAcademicYear(m, selectedYear))
    .map((m, idx) => {
      const user = users.find((u) => u.istid === m.user_istid);
      return {
        id: `${m.user_istid}-${m.department_name}-${m.role_name}-${idx}`,
        userNumber: m.user_istid,
        userName: m.user_name,
        userEmail: user?.email || "",
        userPhoto: user?.photo || "/default_user.png",
        departmentName: m.department_name,
        roleName: m.role_name,
        startDate: m.from_date,
        endDate: m.to_date ?? undefined,
        isActive: m.active,
      };
    });

  const departmentNamesWithMembers = Array.from(new Set(memberships.map((m) => m.departmentName)));
  const teamsWithMembers = teams
    .filter((team) => departmentNamesWithMembers.includes(team.name))
    .map((team) => ({
      name: team.name,
      description: team.description,
      type: "team" as const,
      active: team.active,
    }));
  const adminBodiesWithMembers = adminBodies
    .filter((ab) => departmentNamesWithMembers.includes(ab.name))
    .map((ab) => ({
      name: ab.name,
      type: "admin_body" as const,
      active: ab.active,
    }));
  const allDepartmentsWithMembers = [...adminBodiesWithMembers, ...teamsWithMembers].sort(
    (a, b) => {
      if (a.type === "admin_body" && b.type === "team") return -1;
      if (a.type === "team" && b.type === "admin_body") return 1;
      return a.name.localeCompare(b.name);
    }
  );

  const membersByDepartmentAndRole: Record<string, Record<string, Membership[]>> = {};
  memberships.forEach((m) => {
    if (!membersByDepartmentAndRole[m.departmentName])
      membersByDepartmentAndRole[m.departmentName] = {};
    if (!membersByDepartmentAndRole[m.departmentName][m.roleName])
      membersByDepartmentAndRole[m.departmentName][m.roleName] = [];
    membersByDepartmentAndRole[m.departmentName][m.roleName].push(m);
  });

  const roleOrders: Record<string, string[]> = {};
  await Promise.all(
    allDepartmentsWithMembers.map(async (dept) => {
      const order = await getDepartmentRoleOrder(dept.name);
      roleOrders[dept.name] = order
        .sort((a, b) => a.position - b.position)
        .map((r) => r.role_name);
    })
  );

  const totalMembers = memberships.length;

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
        {teamsWithMembers.map((dept) => (
          <div key={dept.name} className={styles.teamCard}>
            <h3 className={styles.teamCardTitle}>{dept.name}</h3>
            <p className={styles.teamCardDescription}>{dept.description}</p>
          </div>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>Membros {selectedYear}</h2>
      {allDepartmentsWithMembers.map((dept) => {
        const allRolesWithMembers = Object.keys(membersByDepartmentAndRole[dept.name] || {});
        const hierarchy = roleOrders[dept.name] || [];
        const rolesToShow = [
          ...hierarchy,
          ...allRolesWithMembers.filter((role) => !hierarchy.includes(role)),
        ];

        return (
          <div key={dept.name}>
            <h3 className={styles.departmentTitle}>{dept.name}</h3>
            <div className={styles.membersGrid}>
              {rolesToShow.flatMap((role) =>
                (membersByDepartmentAndRole[dept.name]?.[role] || []).map((member) => (
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
