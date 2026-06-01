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
import { Membership, Team } from "@/types/memberships";
import { User } from "@/types/user";
import { getLocale, getDictionary, t } from "@/lib/i18n";


type Department = {
  name: string;
  description?: string;
  displayName?: string;
};

type RoleOrderItem = {
  role_name: string;
  position: number;
};

type EnrichedMembership = Membership & {
  github?: string;
  linkedin?: string;
};

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

const ADMIN_PRIORITY = ["Direção", "Conselho Fiscal", "Mesa da Assembleia Geral"];

export default async function AboutPage({
  searchParams,
}: {
  searchParams?: Promise<{ year?: string }>;
}) {
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  const params = searchParams ? await searchParams : {};
  const [memberships, rawTeams, rawAdminBodies, users]: [
    Membership[],
    Array<{ name: string; description: string; active: boolean }>,
    Array<{ name: string; active: boolean }>,
    User[],
  ] = await Promise.all([getAllMemberships(), getAllTeams(), getAllAdminBodies(), getAllUsers()]);

  const teamNameMap: Record<string, string> =
    (dict.about_us_page && (dict.about_us_page as any).hero?.teams_names) || {};
  const teamDescMap: Record<string, string> =
    (dict.about_us_page && (dict.about_us_page as any).hero?.team_descriptions) || {};
  const roleNameMap: Record<string, string> =
    (dict.about_us_page && (dict.about_us_page as any).roles_names) || {};

  const teams: Team[] = rawTeams.map((team) => ({
    name: team.name,
    displayName: teamNameMap[team.name] ?? team.name,
    description:
      teamDescMap[team.name] ??
      (typeof (team as any).description === "object"
        ? ((team as any).description[locale] ?? (team as any).description.default ?? team.description)
        : team.description),
    icon: "FiUsers",
  }));

  const adminBodies: Department[] = rawAdminBodies.map((body) => ({
    name: body.name,
    displayName: teamNameMap[body.name] ?? body.name,
  }));

  const userMap = new Map(users.map((u) => [u.istid, u]));

  const allAcademicYears = getAllAcademicYears(memberships);
  const selectedYear =
    params?.year && allAcademicYears.includes(params.year) ? params.year : allAcademicYears[0];

  const filteredMemberships: EnrichedMembership[] = memberships
    .filter((membership) => isMembershipInAcademicYear(membership, selectedYear))
    .map((membership) => {
      const user = userMap.get(membership.userNumber);
      return {
        ...membership,
        github: user?.github,
        linkedin: user?.linkedin,
      };
    });

  const departmentNamesWithMembers = Array.from(
    new Set(filteredMemberships.map((membership) => membership.departmentName))
  );
  const teamsWithMembers: Team[] = teams.filter((team) =>
    departmentNamesWithMembers.includes(team.name)
  );
  const allDepartmentsWithMembers: Department[] = [...adminBodies, ...teams].filter((d) =>
    departmentNamesWithMembers.includes(d.name)
  );

  const membersByDepartmentAndRole: Record<string, Record<string, EnrichedMembership[]>> = {};
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
      const order: RoleOrderItem[] = await getDepartmentRoleOrder(department.name);
      roleOrders[department.name] = order
        .sort((a, b) => a.position - b.position)
        .map((role) => role.role_name);
    })
  );

  const sortedDepartmentsWithMembers: Department[] = [
    ...(ADMIN_PRIORITY.map((name) =>
      allDepartmentsWithMembers.find((dep) => dep.name === name)
    ).filter(Boolean) as Department[]),
    ...allDepartmentsWithMembers.filter((dep) => !ADMIN_PRIORITY.includes(dep.name)),
  ];

  const uniqueIstids = [...new Set(filteredMemberships.map((m) => m.userName))];
  const memberCount = String(uniqueIstids.length);

  return (
    <section className={styles.page}>
      <Hero
        teams={teamsWithMembers}
        teamImage={teamImage}
        heroDict={dict.about_us_page.hero}
        description={t(dict.about_us_page.hero.description, { count: memberCount })}
      />

      <h2 className={styles.title} />
      <YearSelector years={allAcademicYears} selectedYear={selectedYear} dict={dict.about_us_page.year_selector}/>

      {sortedDepartmentsWithMembers.map((department) => (
        <div key={department.name}>
          <h3 className={styles.departmentTitle}>{department.displayName ?? department.name}</h3>
          <div className={styles.grid}>
            {roleOrders[department.name]?.map((roleName) =>
              membersByDepartmentAndRole[department.name][roleName]?.map((member) => (
                <MemberCard
                  key={member.id}
                  name={getFirstAndLastName(member.userName)}
                  role={roleNameMap[roleName] ?? roleName}
                  image={member.userPhoto}
                  githuburl={member.github}
                  linkdinurl={member.linkedin}
                  username={member.linkedin}
                  dict={dict.member_card}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
