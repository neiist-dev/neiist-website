import React from 'react';

const ContactsPage = () => (
  <>

    <div style={{ margin: '2rem 6em 1rem 6em' }}>
      <h1 style={{ textAlign: 'center' }}>CONTACTOS</h1>
    </div>

    <div style={{ margin: '1rem 6em', textAlign: 'center' }}>
      <h2>EMAIL</h2>
      <p>neiist@tecnico.ulisboa.pt</p>
    </div>

    <div style={{ margin: '1rem 6em', textAlign: 'center' }}>
      <h2>TELEFONE</h2>
      <p>218417000 (extensão: 2572)</p>
    </div>

    <div style={{ margin: '1rem 6em', textAlign: 'center' }}>
      <h2>SALAS</h2>

      <div style={{ display: 'inline-block', marginRight: '1rem' }}>
        <p>
          Biblioteca, Sala 0.04
          <br />
          Pavilhão de Informática 2
          <br />
          Campus Alameda
          <br />
          Av. António José de Almeida
        </p>
        <iframe
          title="NEIIST Alameda"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2617.0053052397884!2d-9.138373757283224!3d38.737059977104856!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1933a3aaf6fbeb%3A0x3cf91d3b80a0520b!2sAv.+Rovisco+Pais+1%2C+1049-001+Lisboa!5e0!3m2!1spt-PT!2spt!4v1473459139674"
          width="400"
          height="300"
          frameBorder="0"
        />
      </div>

      <div style={{ display: 'inline-block', marginLeft: '1rem' }}>
        <p>
          Sala 1.18
          <br />
          Campus Taguspark
          <br />
          Av. Prof. Doutor Aníbal Cavaco Silva
        </p>
        <iframe
          title="NEIIST Taguspark"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3112.1489108761316!2d-9.30531258433926!3d38.737344963967004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1ecef46471ad41%3A0x928a2fedee483006!2sInstituto+Superior+T%C3%A9cnico+-+Taguspark!5e0!3m2!1spt-PT!2spt!4v1473458606512"
          width="400"
          height="300"
          frameBorder="0"
        />
      </div>

    </div>

    <div style={{ margin: '1rem 6em 2rem 6em', textAlign: 'center' }}>
      <h2 style={{ textAlign: 'center' }}>CORREIO</h2>
      <p>
        NEIIST (Núcleo Estudantil de Informática do IST)
        <br />
        Departamento de Engenharia Informática
        <br />
        Instituto Superior Técnico
        <br />
        Av. Rovisco Pais 1, 1049-001 LISBOA
      </p>
    </div>
  </>
);

export default ContactsPage;
