import Image from "next/image";
import { getAllMemberships, getAllUsers, getAllTeams, getAllAdminBodies } from "@/utils/dbUtils";
import { getFirstAndLastName } from "@/utils/userUtils";
import teamImage from "@/assets/team.png";
import styles from "@/styles/pages/AboutUs.module.css";

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

function getAcademicYearStartYear(date: Date) {
  return date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
}

function getCurrentAcademicYearStartYear() {
  const now = new Date();
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
}

function getAcademicYear(m: RawMembership) {
  const start = new Date(m.from_date);
  const end = m.to_date ? new Date(m.to_date) : null;
  const currentAcademicYearStart = getCurrentAcademicYearStartYear();

  const startYear = getAcademicYearStartYear(start);
  let endYear: number;

  if (end) {
    endYear = getAcademicYearStartYear(end);
  } else {
    endYear = currentAcademicYearStart;
  }

  const years: string[] = [];
  for (let y = startYear; y <= endYear; y++) {
    years.push(`${y}/${y + 1}`);
  }
  return years;
}

function getAllAcademicYears(memberships: RawMembership[]) {
  if (memberships.length === 0) return [];

  let minYear = Infinity;
  let maxYear = -Infinity;

  const currentAcademicYearStart = getCurrentAcademicYearStartYear();

  memberships.forEach((m) => {
    const start = new Date(m.from_date);
    const end = m.to_date ? new Date(m.to_date) : null;
    const startYear = getAcademicYearStartYear(start);
    let endYear: number;
    if (end) {
      endYear = getAcademicYearStartYear(end);
    } else {
      endYear = currentAcademicYearStart;
    }
    if (startYear < minYear) minYear = startYear;
    if (endYear > maxYear) maxYear = endYear;
  });

  if (currentAcademicYearStart > maxYear) maxYear = currentAcademicYearStart;

  const years: string[] = [];
  for (let y = minYear; y <= maxYear; y++) {
    years.push(`${y}/${y + 1}`);
  }
  return years.reverse();
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

  const departmentInfoMap = new Map<
    string,
    { name: string; description: string; type: string; active: boolean }
  >();
  teams.forEach((team) =>
    departmentInfoMap.set(team.name, {
      name: team.name,
      description: team.description,
      type: "team",
      active: team.active,
    })
  );

  const allAcademicYears = getAllAcademicYears(membershipsRaw);
  const selectedYear =
    params?.year && allAcademicYears.includes(params.year) ? params.year : allAcademicYears[0];

  const memberships: Membership[] = membershipsRaw
    .filter((m) => getAcademicYear(m).includes(selectedYear))
    .map((m, idx) => {
      const user = users.find((u) => u.istid === m.user_istid);
      return {
        id: `${m.user_istid}-${m.department_name}-${m.role_name}-${idx}`,
        userNumber: m.user_istid,
        userName: m.user_name,
        userEmail: user?.email || "",
        userPhoto: user?.photo || "",
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

  const membersByDepartment: Record<string, Membership[]> = {};
  memberships.forEach((m) => {
    if (!membersByDepartment[m.departmentName]) membersByDepartment[m.departmentName] = [];
    membersByDepartment[m.departmentName].push(m);
  });

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
      {allDepartmentsWithMembers.map((dept) => (
        <div key={dept.name}>
          <h3 className={styles.departmentTitle}>{dept.name}</h3>
          <div className={styles.membersGrid}>
            {(membersByDepartment[dept.name] || []).map((member) => (
              <div key={member.id} className={styles.memberCard}>
                <Image
                  src={member.userPhoto}
                  alt={member.userName}
                  width={120}
                  height={120}
                  className={styles.memberPhoto}
                />
                <span className={styles.memberName}>{getFirstAndLastName(member.userName)}</span>
                <span className={styles.memberRole}>{member.roleName}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
