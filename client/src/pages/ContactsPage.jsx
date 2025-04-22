import React from "react";
import MapCard from "../components/contactsPage/MapCard";
import ContactCard from "../components/contactsPage/ContactCard";
import styles from './css/ContactsPage.module.css';

const ContactsPage = () => (
  <>
    <div className={styles.container}>
      <h1 className={styles.header}>CONTACTOS</h1>
    </div>

    <div className={styles.pageGrid}>
      <MapCard
        title="Sala 3.03"
        addressLines={[
          "Pavilhão de Informática I",
          "Campus Alameda",
          "Av. António José de Almeida"
        ]}
        mapSrc="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2617.0053052397884!2d-9.138373757283224!3d38.737059977104856!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1933a3aaf6fbeb%3A0x3cf91d3b80a0520b!2sAv.+Rovisco+Pais+1%2C+1049-001+Lisboa!5e0!3m2!1spt-PT!2spt!4v1473459139674"
      />
      <MapCard
        title="Sala 1.18"
        addressLines={[
          "Campus Taguspark",
          "Av. Prof. Doutor Aníbal Cavaco Silva"
        ]}
        mapSrc="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3112.1489108761316!2d-9.30531258433926!3d38.737344963967004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1ecef46471ad41%3A0x928a2fedee483006!2sInstituto+Superior+T%C3%A9cnico+-+Taguspark!5e0!3m2!1spt-PT!2spt!4v1473458606512"
      />
    </div>

/* In client/src/pages/ContactsPage.module.css */
.contactsContainer {
  margin: 2rem 0;
}
        <ContactCard
          title="Email"
          content="neiist@tecnico.ulisboa.pt"
        />
        <ContactCard
          title="Correio"
					content={
						<>
							NEIIST (Núcleo Estudantil de Informática do IST)
							<br />
							Departamento de Engenharia Informática
							<br />
							Instituto Superior Técnico
							<br />
							Av. Rovisco Pais 1, 1049-001 LISBOA
						</>
					}
        />
      </div>
    </div>
  </>
);

export default ContactsPage;
