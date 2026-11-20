import Link from "next/link";
import React from "react";
import styles from "@/styles/components/layout/navbar/NavItem.module.css";
import highlightStyles from "@/styles/components/homepage/CloudAnnouncement.module.css";

interface NavItemProps {
  href: string;
  label: string;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ href, label, onClick }) => {
  const isNews = label === "Notícias" || label === "News";

  if (isNews) {
    return (
      <div>
        <span className={highlightStyles.pulse}>
          <span className={highlightStyles.pulseRing} />
          <span className={highlightStyles.pulseDot} />
        </span>
        <Link href={href} className={styles.navLink} onClick={onClick}>
          {label}
        </Link>
      </div>
    );
  }

  return (
    <Link href={href} className={styles.navLink} onClick={onClick}>
      {label}
    </Link>
  );
};

export { NavItem };
