import React from "react";
import Image, { StaticImageData } from "next/image";
import styles from "@/styles/components/homepage/Partnerships.module.css";

// Monetary Partners
import auren from "@/assets/partnerships/monetary/auren.png";
import deloitte from "@/assets/partnerships/monetary/deloitte.png";
import basedInLisbon from "@/assets/partnerships/monetary/based_in_lisbon.png";

// Non-Monetary Partners
import lage2 from "@/assets/partnerships/non-monetary/lage2.png";
import aiesec from "@/assets/partnerships/non-monetary/aiesec.png";
import magma from "@/assets/partnerships/non-monetary/magma.png";

const Partnerships: React.FC = () => {
  const monetaryPartners = [
    { href: "https://auren.com/pt/", src: auren, alt: "Auren", scale: "1.0" },
    {
      href: "https://www.deloitte.com/",
      src: deloitte,
      alt: "Deloitte",
      scale: "1.0",
    },
    {
      href: "https://www.basedinlisbon.xyz/",
      src: basedInLisbon,
      alt: "Based in Lisbon",
      scale: "0.9",
    },
  ];

  const nonMonetaryPartners = [
    {
      href: "https://lage2.ist.utl.pt/",
      src: lage2,
      alt: "LAGE2",
      scale: "0.75",
    },
    { href: "https://aiesec.org/", src: aiesec, alt: "AIESEC", scale: "1.0" },
    {
      href: "https://magmastudio.pt/",
      src: magma,
      alt: "Magma Studio",
      scale: "1.0",
    },
  ];

  const renderPartners = (
    partners: {
      href: string;
      src: StaticImageData;
      alt: string;
      scale: string;
    }[]
  ) =>
    partners.map((partner, index) => (
      <a key={index} href={partner.href} target="_blank" rel="noopener noreferrer">
        <Image
          src={partner.src}
          alt={partner.alt}
          style={{ transform: `scale(${partner.scale})` }}
          className={styles.logo}
        />
      </a>
    ));

  return (
    <div className={styles.partnerships}>
      <h1 className={styles.title}>Parcerias</h1>
      <h2>Parcerias Monetárias</h2>
      <div className={styles.row}>{renderPartners(monetaryPartners)}</div>
      <h2>Parcerias Não Monetárias</h2>
      <div className={styles.row}>{renderPartners(nonMonetaryPartners)}</div>
    </div>
  );
};

export default Partnerships;
