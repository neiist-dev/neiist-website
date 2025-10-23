import {
  getAllMemberships,
  getAllTeams,
  getAllAdminBodies,
  getDepartmentRoleOrder,
  getAllUsers,
} from "@/utils/dbUtils";
import { getFirstAndLastName } from "@/utils/userUtils";
import teamImage from "@/assets/team.png";
import styles from "@/styles/pages/AboutUs.module.css";
import MemberCard from "@/components/about-us/MemberCard";
import YearSelector from "@/components/about-us/YearSelector";
import Hero from "@/components/about-us/Hero";

function getAcademicYearRange(year: string) {
  const [startYear, endYear] = year.split("/").map(Number);
  return {
    start: new Date(`${startYear}-09-01`),
    end: new Date(`${endYear}-07-31`),
  };
}

function isMembershipInAcademicYear(membership: any, year: string) {
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

function getAllAcademicYears(memberships: any[]) {
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

const ADMIN_PRIORITY = ["Direção", "Conselho Fiscal", "Mesa da Assembleia Geral"];

export default async function AboutPage({
  searchParams,
}: {
  searchParams?: Promise<{ year?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const [memberships, teams, adminBodies, users] = await Promise.all([
    getAllMemberships(),
    getAllTeams(),
    getAllAdminBodies(),
    getAllUsers(),
  ]);

  const userMap = new Map(users.map((u: any) => [u.istid, u]));

  const allAcademicYears = getAllAcademicYears(memberships);
  let selectedYear =
    params?.year && allAcademicYears.includes(params.year) ? params.year : allAcademicYears[0];

  const filteredMemberships = memberships
    .filter((membership: any) => isMembershipInAcademicYear(membership, selectedYear))
    .map((membership: any) => {
      const user = userMap.get(membership.userNumber);
      return {
        ...membership,
        userName: user?.name ?? "",
        userPhoto: user?.photo,
        github: user?.github ?? undefined,
        linkedin: user?.linkedin ?? undefined,
      };
    });

  const departmentNamesWithMembers = Array.from(
    new Set(filteredMemberships.map((membership: any) => membership.departmentName))
  );
  const teamsWithMembers = teams
    .filter((team: any) => departmentNamesWithMembers.includes(team.name))
    .map((team: any) => ({
      name: team.name,
      description: team.description,
      icon: "FiUsers",
    }));
  const allDepartmentsWithMembers = [...adminBodies, ...teams].filter((d: any) =>
    departmentNamesWithMembers.includes(d.name)
  );

  const membersByDepartmentAndRole: Record<string, Record<string, any[]>> = {};
  filteredMemberships.forEach((membership: any) => {
    if (!membersByDepartmentAndRole[membership.departmentName])
      membersByDepartmentAndRole[membership.departmentName] = {};
    if (!membersByDepartmentAndRole[membership.departmentName][membership.roleName])
      membersByDepartmentAndRole[membership.departmentName][membership.roleName] = [];
    membersByDepartmentAndRole[membership.departmentName][membership.roleName].push(membership);
  });

  const roleOrders: Record<string, string[]> = {};
  await Promise.all(
    allDepartmentsWithMembers.map(async (department: any) => {
      const order = await getDepartmentRoleOrder(department.name);
      roleOrders[department.name] = order
        .sort((a: any, b: any) => a.position - b.position)
        .map((role: any) => role.role_name);
    })
  );

  const sortedDepartmentsWithMembers = [
    ...ADMIN_PRIORITY.map((name) =>
      allDepartmentsWithMembers.find((dep) => dep.name === name)
    ).filter(Boolean),
    ...allDepartmentsWithMembers.filter((dep) => !ADMIN_PRIORITY.includes(dep.name)),
  ];

  return (
    <section className={styles.page}>
      <Hero
        teams={teamsWithMembers}
        teamImage={teamImage}
        description={`A equipa do NEIIST é composta por ${filteredMemberships.length} estudantes do Instituto Superior Técnico, motivados e interessados em ajudar todos os alunos da sua instituição que têm interesse nas mais diversas áreas da Informática. Fundado em 2004 todos os membros do NEIIST contribuem com o seu esforço, dedicação e tempo para organizarem uma ampla variedade de atividades que visam auxiliar a comunidade académica a ter o melhor percurso e proveito académico possível. O nosso objetivo é fomentar o interesse pela Informática e pelas suas áreas afins, promovendo o contacto entre alunos, professores, profissionais e empresas, bem como dinamizando atividades que contribuam para o crescimento técnico, científico e humano da comunidade estudantil. A nossa visão é ser uma referência no apoio e na integração dos estudantes do Departamento de Engenharia Informática, impulsionando a inovação, a colaboração e a excelência no ensino e na prática da Engenharia Informática.`}
      />

      <h2 className={styles.title} />
      <YearSelector years={allAcademicYears} selectedYear={selectedYear} />

      {sortedDepartmentsWithMembers.map((department: any) => (
        <div key={department.name}>
          <h3 className={styles.departmentTitle}>{department.name}</h3>
          <div className={styles.grid}>
            {roleOrders[department.name]?.map((roleName: string) =>
              membersByDepartmentAndRole[department.name][roleName]?.map((member: any) => (
                <MemberCard
                  key={member.id}
                  name={getFirstAndLastName(member.userName)}
                  role={roleName}
                  image={member.userPhoto}
                  githuburl={member.github}
                  linkdinurl={member.linkedin}
                  username={member.github}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
