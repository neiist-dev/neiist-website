import React from 'react'

const ContactsPage = () =>
    <div style={{ margin: "10px 20vw" }}>
        <h1 style={{ textAlign: "center" }}>
            CONTACTOS
        </h1>
        <h2 style={{ textAlign: "center" }}>
            EMAIL
        </h2>
        <p>neiist@tecnico.ulisboa.pt</p>
        <h2 style={{ textAlign: "center" }}>
            TELEFONE
        </h2>
        <p>218417000 (extensão: 2572)</p>
        <h2 style={{ textAlign: "center" }}>
            SALAS
        </h2>
        <p>
            Laboratório 1
            Pavilhão de Informática 1
            Campus Alameda
            Av. António José de Almeida
        </p>
        <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2617.0053052397884!2d-9.138373757283224!3d38.737059977104856!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1933a3aaf6fbeb%3A0x3cf91d3b80a0520b!2sAv.+Rovisco+Pais+1%2C+1049-001+Lisboa!5e0!3m2!1spt-PT!2spt!4v1473459139674"
            width="400" height="300" frameborder="0" style={{ border: "0", marginRight: "30%" }} allowfullscreen></iframe>
        <p>
            Sala 1.18
            Campus Taguspark
            Av. Prof. Doutor Aníbal Cavaco Silva
        </p>
        <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3112.1489108761316!2d-9.30531258433926!3d38.737344963967004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1ecef46471ad41%3A0x928a2fedee483006!2sInstituto+Superior+T%C3%A9cnico+-+Taguspark!5e0!3m2!1spt-PT!2spt!4v1473458606512"
            width="400" height="300" frameborder="0" style={{border: "0", marginRight:"30%"}} allowfullscreen></iframe>
        <h2 style={{ textAlign: "center" }}>
            CORREIO
        </h2>
        <p>
            NEIIST (Núcleo Estudantil de Informática do IST)
            Departamento de Engenharia Informática
            Instituto Superior Técnico
            Av. Rovisco Pais 1, 1049-001 LISBOA
        </p>
    </div>

export default ContactsPage