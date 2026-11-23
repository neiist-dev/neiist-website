import Image from "next/image";
import { BentoGrid, Button, Text } from "@neiist/ui";
import { FiExternalLink } from "react-icons/fi";
import lisbonNightLife from "@/assets/partnerships/lisbon_night_life.png";
import vitalBraining from "@/assets/partnerships/vital_braining.png";
import styles from "@/styles/components/homepage/Partnerships.module.css";
import { Dictionary } from "@/i18n/dictionaries";

function Partnerships({ dict }: { dict: Dictionary["partnerships"] }) {
  const items = [
    {
      id: "night_life_lisbon",
      title: dict.items.night_life_lisbon.title,
      description: dict.items.night_life_lisbon.description,
      image: (
        <Image
          src={lisbonNightLife}
          alt={dict.items.night_life_lisbon.title}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className={styles.containImage}
        />
      ),
      actions: (
        <a
          href="https://www.nightlifelisbon.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.actionLink}>
          <Button size="sm" variant="solid">
            {dict.visit_partner} <FiExternalLink />
          </Button>
        </a>
      ),
    },
    {
      id: "vital_braining",
      title: dict.items.vital_braining.title,
      description: (
        <Text size="sm" variant="muted">
          {dict.items.vital_braining.description}{" "}
          <a href="/vital_braining.pdf" target="_blank" rel="noopener noreferrer">
            {dict.items.vital_braining.details_link}
          </a>
          .
        </Text>
      ),
      image: (
        <Image
          src={vitalBraining}
          alt={dict.items.vital_braining.title}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
        />
      ),
      actions: (
        <a
          href="https://www.vitalmindclinic.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.actionLink}>
          <Button size="sm" variant="solid">
            {dict.visit_partner} <FiExternalLink />
          </Button>
        </a>
      ),
    },
  ];

  return (
    <section className={styles.partnerships}>
      <h1>{dict.title}</h1>
      <BentoGrid>
        {items.map((item) => (
          <BentoGrid.Item
            key={item.id}
            id={item.id}
            title={item.title}
            description={item.description}
            image={item.image}
            actions={item.actions}
          />
        ))}
      </BentoGrid>
    </section>
  );
}

export default Partnerships;
