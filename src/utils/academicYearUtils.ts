/**
 * Academic year
 * September 1st (YYYY-09-01) to July 31st of following year ((YYYY+1)-07-31).
 * Mandates concluding on or before handover dates (e.g. Aug 28, Aug 31, Sep 1) belong to outgoing term.
 */

export interface AcademicYearRange {
  start: Date;
  end: Date;
}

/**
 * Returns the Date range for a given academic year string in 'YYYY/YYYY+1' format.
 */
export function parseAcademicYearRange(academicYear: string): AcademicYearRange {
  const [startYearStr, endYearStr] = academicYear.split("/");
  const startYear = Number(startYearStr);
  const endYear = Number(endYearStr);

  return {
    start: new Date(`${startYear}-09-01T00:00:00.000Z`),
    end: new Date(`${endYear}-07-31T23:59:59.999Z`),
  };
}

/**
 * Determines the academic year ('YYYY/YYYY+1') for a given date.
 * September through December, or late August (day >= 15), belongs to starting year YYYY.
 * January through early August belongs to starting year YYYY - 1.
 */
export function getAcademicYearForDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  if (month >= 8 || (month === 7 && day >= 15)) {
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
}

/**
 * Returns the current active academic year.
 */
export function getCurrentAcademicYear(): string {
  return getAcademicYearForDate(new Date());
}

/**
 * Checks whether a membership tenure overlaps with an academic year.
 */
export function isMembershipInAcademicYear(
  startDate: string | Date,
  endDate: string | Date | null | undefined,
  academicYear: string
): boolean {
  const { start, end } = parseAcademicYearRange(academicYear);
  const from = new Date(startDate);
  const to = endDate ? new Date(endDate) : null;

  return from <= end && (to === null || to > start);
}
