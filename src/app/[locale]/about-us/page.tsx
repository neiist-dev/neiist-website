import { Suspense } from "react";
import { getFirstAndLastName } from "@/utils/userUtils";
import teamImage from "@/assets/team.png";
import styles from "@/styles/pages/AboutUs.module.css";
import MemberCard from "@/components/about-us/MemberCard";
import YearSelector from "@/components/about-us/YearSelector";
import Hero from "@/components/about-us/Hero";
import JoinUs from "@/components/about-us/JoinsUs";
import { Membership, Team } from "@/types/memberships";
import { User } from "@/types/user";
import {
  getAllMemberships,
  getAllTeams,
  getAllAdminBodies,
  getDepartmentRoleOrder,
} from "@/lib/db/repositories/team.repository";
import { getAllUsers } from "@/lib/db/repositories/user.repository";
import GlobalLoading from "@/app/loading";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

type Department = {
  name: string;
  description?: string;
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
  memberships.forEach((m) => {
    const fromYear = getAcademicYearStartYear(new Date(m.startDate));
    const toYear = m.endDate
      ? getAcademicYearStartYear(new Date(m.endDate))
      : currentAcademicYearStart;
    if (fromYear < minYear) minYear = fromYear;
    if (toYear > maxYear) maxYear = toYear;
  });
  if (minYear === Infinity) return [];
  const years: string[] = [];
  for (let year = minYear; year <= maxYear; year++) years.push(`${year}/${year + 1}`);
  return years.reverse();
}

const ADMIN_PRIORITY = ["Direção", "Conselho Fiscal", "Mesa da Assembleia Geral"];

interface PageProps {
  params: LocaleParams;
  searchParams: Promise<{ year?: string }>;
}

async function AboutUsContent({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).about_us_page;
  const { year } = await searchParams;

  const [memberships, rawTeams, rawAdminBodies, users]: [
    Membership[],
    Array<{ name: string; description: string; active: boolean }>,
    Array<{ name: string; active: boolean }>,
    User[],
  ] = await Promise.all([getAllMemberships(), getAllTeams(), getAllAdminBodies(), getAllUsers()]);

  const teams: Team[] = rawTeams.map((team) => ({
    name: team.name,
    description: team.description,
    icon: "FiUsers",
  }));

  const adminBodies: Department[] = rawAdminBodies.map((body) => ({
    name: body.name,
  }));

  const userMap = new Map(users.map((u) => [u.istid, u]));

  const allAcademicYears = getAllAcademicYears(memberships);
  const selectedYear = year && allAcademicYears.includes(year) ? year : allAcademicYears[0];

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

  return (
    <section className={styles.page}>
      <Hero
        teams={teamsWithMembers}
        teamImage={teamImage}
        dict={dict.hero}
        description={dict.hero.description.replace("{count}", String(uniqueIstids.length))}
      />

      <JoinUs dict={dict.join_us} />
      <YearSelector
        years={allAcademicYears}
        selectedYear={selectedYear}
        dict={dict.year_selector}
      />

      {sortedDepartmentsWithMembers.map((department) => (
        <div key={department.name}>
          <h3 className={styles.departmentTitle}>{department.name}</h3>
          <div className={styles.grid}>
            {roleOrders[department.name]?.map((roleName) =>
              membersByDepartmentAndRole[department.name][roleName]?.map((member) => (
                <MemberCard
                  key={member.id}
                  name={getFirstAndLastName(member.userName)}
                  role={roleName}
                  image={member.userPhoto}
                  githuburl={member.github}
                  linkdinurl={member.linkedin}
                  username={member.linkedin}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

export default function AboutPage(props: PageProps) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <AboutUsContent {...props} />
    </Suspense>
  );
}
