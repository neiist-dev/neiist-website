import { getAllDepartments, getAllMemberships, getAllUsers } from "@/utils/dbUtils";
import AboutUsEditor from "@/components/admin/AboutUsEditor";
import { Membership } from "@/types/memberships";
import { getLocale, getDictionary} from "@/lib/i18n";

export default async function AboutUsManager({
  searchParams,
}: {
  searchParams?: { year?: string };
}) {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const departments = await getAllDepartments();
  const memberships: Membership[] = await getAllMemberships();
  const users = await getAllUsers();

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

  const allAcademicYears = getAllAcademicYears(memberships);
  const selectedYear =
    searchParams?.year && allAcademicYears.includes(searchParams.year)
      ? searchParams.year
      : allAcademicYears[0];

  return (
    <AboutUsEditor
      departments={departments}
      memberships={memberships}
      users={users}
      selectedYear={selectedYear}
      dict={{
        ...dict.about_us_page.year_selector, 
        ...dict.about_us_page.editor
      }}
    />
  );
}
