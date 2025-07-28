import { getAllMemberships, getAllUsers, getAllTeams, getAllAdminBodies } from "@/utils/dbUtils";
import styles from "@/styles/pages/AboutUs.module.css";
import teamImage from "@/assets/team.png";
import Image from "next/image";

interface RawMembership {
  user_istid: string;
  user_name: string;
  department_name: string;
  role_name: string;
  from_date: string;
  to_date: string | null;
  active: boolean;
}

interface ProcessedMembership {
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

function getFirstAndLastName(fullName: string) {
  if (!fullName) return "";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function getAcademicYear(m: RawMembership) {
  const startDate = new Date(m.from_date);
  const endDate = m.to_date ? new Date(m.to_date) : null;
  if (!endDate) return "2025/2026";
  return `${startDate.getFullYear()}/${endDate.getFullYear()}`;
}

function getAllAcademicYears(memberships: RawMembership[]) {
  const years = new Set<string>();
  memberships.forEach((m) => years.add(getAcademicYear(m)));
  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

export const revalidate = 3600;

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

  const memberships: ProcessedMembership[] = membershipsRaw
    .filter((m) => getAcademicYear(m) === selectedYear)
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

  const teamsWithMembers = Array.from(departmentInfoMap.values()).filter(
    (d) => d.active && d.type === "team" && memberships.some((m) => m.departmentName === d.name)
  );

  const adminBodiesWithMembers = adminBodies
    .filter((ab) => ab.active && memberships.some((m) => m.departmentName === ab.name))
    .map((ab) => ({ name: ab.name, type: "admin_body" as const, active: ab.active }));

  const teamsForDisplay = teamsWithMembers.map((team) => ({
    name: team.name,
    type: "team" as const,
    active: team.active,
  }));

  const allDepartmentsWithMembers = [...adminBodiesWithMembers, ...teamsForDisplay].sort((a, b) => {
    if (a.type === "admin_body" && b.type === "team") return -1;
    if (a.type === "team" && b.type === "admin_body") return 1;
    return a.name.localeCompare(b.name);
  });

  const membersByDepartment: Record<string, ProcessedMembership[]> = {};
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
