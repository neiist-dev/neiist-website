import { Suspense } from "react";
import Image from "next/image";
import { getFirstAndLastName } from "@/utils/userUtils";
import teamImage from "@/assets/team.png";
import styles from "@/styles/pages/AboutUs.module.css";
import { MemberCard } from "@neiist/ui";
import YearSelector from "@/components/about-us/YearSelector";
import Hero from "@/components/about-us/Hero";
import JoinUs from "@/components/about-us/JoinsUs";
import Campuses from "@/components/about-us/Campuses";
import { Membership, Team, Description } from "@/types/memberships";
import {
  getAcademicYears,
  getMembershipsForAcademicYear,
  getAllTeams,
  getAllAdminBodies,
  getDepartmentRoleOrders,
  getDepartmentDisplayOrder,
} from "@/lib/db/repositories/team.repository";
import { getCurrentAcademicYear } from "@/utils/academicYearUtils";
import GlobalLoading from "@/app/loading";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

type Department = {
  name: string;
  description?: Description;
};

interface PageProps {
  params: LocaleParams;
  searchParams: Promise<{ year?: string }>;
}

async function AboutUsContent({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).about_us_page;
  const { year } = await searchParams;

  const dbYears = await getAcademicYears();
  const allAcademicYears = dbYears.length > 0 ? dbYears : [getCurrentAcademicYear()];
  const selectedYear = year && allAcademicYears.includes(year) ? year : allAcademicYears[0];

  const [memberships, rawTeams, rawAdminBodies, departmentOrderList] = await Promise.all([
    getMembershipsForAcademicYear(selectedYear),
    getAllTeams(),
    getAllAdminBodies(),
    getDepartmentDisplayOrder(),
  ]);

  const teams: Team[] = rawTeams.map((team) => ({
    name: team.name,
    description: team.description,
    icon: "FiUsers",
  }));

  const adminBodies: Department[] = rawAdminBodies.map((body) => ({
    name: body.name,
  }));

  const departmentNamesWithMembers = Array.from(
    new Set(memberships.map((membership) => membership.departmentName))
  );
  const teamsWithMembers: Team[] = teams.filter((team) =>
    departmentNamesWithMembers.includes(team.name)
  );
  const allDepartmentsWithMembers: Department[] = [...adminBodies, ...teams].filter((d) =>
    departmentNamesWithMembers.includes(d.name)
  );

  const membersByDepartmentAndRole: Record<string, Record<string, Membership[]>> = {};
  memberships.forEach((membership) => {
    if (!membersByDepartmentAndRole[membership.departmentName])
      membersByDepartmentAndRole[membership.departmentName] = {};
    if (!membersByDepartmentAndRole[membership.departmentName][membership.roleName])
      membersByDepartmentAndRole[membership.departmentName][membership.roleName] = [];
    membersByDepartmentAndRole[membership.departmentName][membership.roleName].push(membership);
  });

  const deptNamesWithMembers = allDepartmentsWithMembers.map((d) => d.name);
  const rawRoleOrders = await getDepartmentRoleOrders(deptNamesWithMembers);
  const roleOrders: Record<string, string[]> = {};
  deptNamesWithMembers.forEach((name) => {
    roleOrders[name] = rawRoleOrders
      .filter((ro) => ro.department_name === name)
      .sort((a, b) => a.position - b.position)
      .map((ro) => ro.role_name);
  });

  const deptOrderMap = new Map(
    departmentOrderList.map((d, idx) => [d.name, d.display_order ?? idx])
  );
  const sortedDepartmentsWithMembers: Department[] = [...allDepartmentsWithMembers].sort((a, b) => {
    const orderA = deptOrderMap.get(a.name) ?? 999;
    const orderB = deptOrderMap.get(b.name) ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name, locale);
  });

  const uniqueIstids = [...new Set(memberships.map((m) => m.userNumber))];

  return (
    <section className={styles.page}>
      <Hero
        teams={teamsWithMembers}
        teamImage={teamImage}
        dict={dict.hero}
        description={dict.hero.description.replace("{count}", String(uniqueIstids.length))}
        locale={locale}
      />
      <Campuses dict={dict.campuses} />
      <JoinUs dict={dict.join_us} />
      <YearSelector
        years={allAcademicYears}
        selectedYear={selectedYear}
        dict={dict.year_selector}
      />

      {sortedDepartmentsWithMembers.map((department) => (
        <section key={department.name} aria-labelledby={`dept-${department.name}`}>
          <h3 id={`dept-${department.name}`} className={styles.departmentTitle}>
            {department.name}
          </h3>
          <div className={styles.grid}>
            {roleOrders[department.name]?.map((roleName) =>
              membersByDepartmentAndRole[department.name][roleName]?.map((member) => (
                <MemberCard
                  key={member.id}
                  name={getFirstAndLastName(member.userName)}
                  role={roleName}
                  image={
                    member.userPhoto ? (
                      <Image
                        src={member.userPhoto}
                        alt={`${member.userName} photo`}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 250px"
                        style={{ objectFit: "cover" }}
                      />
                    ) : undefined
                  }
                  githubUrl={member.github}
                  linkedinUrl={member.linkedin}
                  username={member.linkedin}
                />
              ))
            )}
          </div>
        </section>
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
