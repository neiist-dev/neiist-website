import Link from "next/link";
import styles from "@/styles/components/homepage/CloudAnnouncement.module.css";
import { FiArrowRight } from "react-icons/fi";
import { cn } from "@neiist/ui";
import React from "react";

export interface CloudAnnouncementProps {
  title: React.ReactNode;
  actionText?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  pulse?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function CloudAnnouncement({
  title,
  actionText,
  href,
  onClick,
  pulse = true,
  className,
  children,
}: CloudAnnouncementProps) {
  const content = children || (
    <>
      {pulse && (
        <span className={styles.pulse}>
          <span className={styles.pulseRing} />
          <span className={styles.pulseDot} />
        </span>
      )}
      <span className={styles.cloudTitle}>{title}</span>
      {actionText && (
        <span className={styles.cloudCta}>
          {actionText} <FiArrowRight />
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(styles.cloud, className)}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(styles.cloud, className)}>
      {content}
    </button>
  );
}
