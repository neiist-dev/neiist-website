"use client";

import React, { useEffect, useState } from "react";
import { Squash } from "hamburger-react";
import Image, { type StaticImageData } from "next/image";
import { FiUsers } from "react-icons/fi";
import styles from "@/styles/components/about-us/Hero.module.css";
import { Team } from "@/types/memberships";

interface HeroProps {
  teams: Team[];
  teamImage: string | StaticImageData;
  teamsTitle?: string;
  description?: string;
}
const iconMap: Record<string, React.ElementType> = {
  FiUsers,
};

export default function Hero({
  teams,
  teamImage,
  teamsTitle = "As Nossas Equipas",
  description,
}: HeroProps) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setSelectedTeam(null);
  };

  useEffect(() => {
    if (!selectedTeam) return;
    const handleScroll = () => setSelectedTeam(null);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [selectedTeam]);

  return (
    <div className={styles.hero}>
      <div className={styles.header}>
        <div className={styles.intro}>
          <div className={styles.title}>
            <p>
              <span className={styles.primary}>Qu</span>
              <span className={styles.secondary}>em </span>
              <span className={styles.tertiary}>So</span>
              <span className={styles.quaternary}>mos?</span>
            </p>
          </div>
          <p className={styles.description}>{description}</p>
        </div>
        <div className={styles.blobs}>
          <svg
            width="572"
            height="398"
            viewBox="0 0 572 398"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M377.559 381.487C600.785 304.762 579.94 226.446 559.605 151.238C559.204 149.755 558.492 148.239 557.619 146.974C423.841 -46.8398 221.646 375.181 277.621 168.233C338 -54.9998 130.156 -26.7165 26.2052 86.7316C-72.9994 195 129.606 466.711 377.559 381.487Z"
              fill="#35D1FA"
            />
          </svg>
          <svg
            width="616"
            height="326"
            viewBox="0 0 616 326"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M199.5 41.5C2.2189 112.748 -50 140 50.5 238.5C308 477 225.61 97.6013 346.5 225.5C450 335 583 373 610 246C640.189 104 547 -84 199.5 41.5Z"
              fill="#2863FD"
            />
          </svg>

          <Image alt="NEIIST Team" className={styles.teamImage} src={teamImage} />
        </div>
      </div>

      <div className={styles.teamsSection}>
        <h2 className={styles.teamsTitle}>{teamsTitle}</h2>
        <div className={styles.teamsGrid}>
          {teams.map((team) => {
            const Icon = iconMap[team.icon] || FiUsers;
            return (
              <div
                key={team.name}
                className={styles.teamBox}
                tabIndex={0}
                aria-label={`Equipa ${team.name}`}
                onClick={() => setSelectedTeam(team)}
                role="button">
                <Icon className={styles.icon} />
                <h3 className={styles.teamName}>{team.name}</h3>
              </div>
            );
          })}
        </div>
      </div>

      {selectedTeam && (
        <div className={styles.overlayContainer} onClick={handleOverlayClick}>
          <div className={styles.overlay} data-open>
            <button
              className={styles.close}
              onClick={() => setSelectedTeam(null)}
              aria-label="Fechar">
              <Squash
                toggled={true}
                toggle={() => setSelectedTeam(null)}
                size={20}
                color="currentColor"
              />
            </button>
            <h3 className={styles.overlayTitle}>{selectedTeam.name}</h3>
            <p className={styles.overlayDescription}>{selectedTeam.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
