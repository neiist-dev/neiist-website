import Image from "next/image";
import { BentoGrid, Button } from "@neiist/ui";
import { FiExternalLink } from "react-icons/fi";
import lisbonNightLife from "@/assets/partnerships/lisbon_night_life.png";
import vitalBraining from "@/assets/partnerships/vital_braining.png";
import styles from "@/styles/components/homepage/Partnerships.module.css";
import { Dictionary } from "@/i18n/dictionaries";

function Partnerships({ dict }: { dict: Dictionary["partnerships"] }) {
  const partners = [
    {
      id: "vital_braining",
      title: dict.items.vital_braining.title,
      description: (
        <>
          {dict.items.vital_braining.description}{" "}
          <a href="/vital_braining.pdf" target="_blank" rel="noopener noreferrer">
            {dict.items.vital_braining.details_link}
          </a>
          .
        </>
      ),
      logo: vitalBraining,
      background: "#C2CCC2",
      href: "https://www.vitalmindclinic.com/",
    },
    {
      id: "night_life_lisbon",
      title: dict.items.night_life_lisbon.title,
      description: dict.items.night_life_lisbon.description,
      logo: lisbonNightLife,
      href: "https://www.nightlifelisbon.com/",
    },
  ];

  return (
    <section className={styles.partnerships}>
      <h1>{dict.title}</h1>
      <BentoGrid>
        {partners.map((partner) => (
          <BentoGrid.Item
            key={partner.id}
            id={partner.id}
            title={partner.title}
            description={partner.description}
            image={
              <Image
                src={partner.logo}
                alt={partner.title}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            }
            imageFit="contain"
            imageBackground={partner.background}
            actions={
              <a
                href={partner.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionLink}>
                <Button size="sm" variant="solid">
                  {dict.visit_partner} <FiExternalLink />
                </Button>
              </a>
            }
          />
        ))}
      </BentoGrid>
    </section>
  );
}

export default Partnerships;
