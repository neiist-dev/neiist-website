import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import styles from "@/styles/components/about-us/YearSelector.module.css";

interface YearSelectorProps {
  years: string[];
  selectedYear: string;
  visible?: number;
}

function formatYearDisplay(year: string) {
  if (year.includes("/")) {
    const [mainYear, subYear] = year.split("/");
    return { mainYear, subYear };
  }
  const yearNum = Number.parseInt(year, 10);
  const subYear = ((yearNum + 1) % 100).toString().padStart(2, "0");
  return { mainYear: year, subYear };
}

export default function YearSelector({ years, selectedYear, visible = 5 }: YearSelectorProps) {
  const total = years.length;
  const v = Math.max(1, Math.min(visible, 5));
  const idx = Math.max(0, years.indexOf(selectedYear));

  const maxStart = Math.max(0, total - v);
  const half = Math.floor(v / 2);
  const start = Math.min(Math.max(0, idx - half), maxStart);
  const end = Math.min(start + v, total);
  const windowYears = years.slice(start, end);

  const canPrev = idx < total - 1;
  const canNext = idx > 0;
  const prevYear = canPrev ? years[idx + 1] : undefined;
  const nextYear = canNext ? years[idx - 1] : undefined;

  const hrefFor = (year: string) => ({ query: { year } });

  return (
    <nav className={styles.container} aria-label="Academic year selector">
      <Link
        href={prevYear ? hrefFor(prevYear) : "#"}
        aria-label="Previous year"
        aria-disabled={!canPrev}
        tabIndex={canPrev ? 0 : -1}
        className={`${styles.arrowButton} ${!canPrev ? styles.disabled : ""}`}>
        <FiChevronLeft aria-hidden="true" />
      </Link>

      <div className={styles.yearList}>
        {windowYears.map((year) => {
          const { mainYear, subYear } = formatYearDisplay(year);
          const isSelected = year === selectedYear;
          return (
            <Link
              key={year}
              href={hrefFor(year)}
              aria-current={isSelected ? "page" : undefined}
              className={`${styles.yearButton} ${isSelected ? styles.selected : ""}`}>
              <span className={styles.yearText}>
                <span className={styles.mainYear}>{mainYear}</span>
                <span className={styles.subYear}>/{subYear}</span>
              </span>
            </Link>
          );
        })}
      </div>

      <Link
        href={nextYear ? hrefFor(nextYear) : "#"}
        aria-label="Next year"
        aria-disabled={!canNext}
        tabIndex={canNext ? 0 : -1}
        className={`${styles.arrowButton} ${!canNext ? styles.disabled : ""}`}>
        <FiChevronRight aria-hidden="true" />
      </Link>
    </nav>
  );
}
