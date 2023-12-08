import React, { useState, useEffect } from 'react';
import LoadSpinner from "../hooks/loadSpinner.jsx";
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import Modal from 'react-bootstrap/Modal';
import Card from 'react-bootstrap/Card';
import { fetchThesis, fetchThesisAreas } from '../Api.service.js';

const ThesisMasterPage = () => {
  const [areas, setAreas] = useState(null);
  const [checkedAreas, setCheckedAreas] = useState([]);

  return (
    <>
      <Areas
        areas={areas}
        setAreas={setAreas}
        checkedAreas={checkedAreas}
        setCheckedAreas={setCheckedAreas}
      />
      <Theses areas={areas} checkedAreas={checkedAreas} />
    </>
  );
};

const Areas = ({
  areas, setAreas, checkedAreas, setCheckedAreas,
}) => {
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetchThesisAreas()
      .then(
        (areasRes) => {
          setAreas(areasRes);
          setIsLoaded(true);
        },
        (err) => {
          setIsLoaded(true);
          setError(err);
        },
      );
  }, []);

  const handleChange = (area) => setCheckedAreas(area);

  if (!isLoaded) return <LoadSpinner />;
  if (error) {
    return (
      <div>
        Erro:
        {error.message}
      </div>
    );
  }
  if (areas) {
    return (
      <>
        <h1 style={{ textAlign: 'center', margin: 0 }}>
          {areas.length}
          {' '}
          Áreas
        </h1>
        <ToggleButtonGroup
          type="checkbox"
          value={checkedAreas}
          onChange={handleChange}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignContent: 'space-around',
            padding: '10px 10px 0 10px',
          }}
        >
          {areas.map((area) => (
            <ToggleButton
              id={`toggle-${area.code}`}
              value={area.code}
              key={area.code}
              style={{
                margin: '10px',
                width: '15rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {area.long}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </>
    );
  }
  return <div>Não foi possível carregar as áreas.</div>;
};

const Theses = ({ areas, checkedAreas }) => {
  const [theses, setTheses] = useState(null);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetchThesis()
      .then(
        (res) => {
          setTheses(res);
          setIsLoaded(true);
        },
        (err) => {
          setIsLoaded(true);
          setError(err);
        },
      );
  }, []);

  if (!isLoaded) return <LoadSpinner />;
  if (error) {
    return (
      <div>
        Erro:
        {error.message}
      </div>
    );
  }
  if (theses) {
    let filteredTheses;
    if (checkedAreas.length === 0) {
      filteredTheses = theses;
    } else if (checkedAreas.length === 1) {
      filteredTheses = theses.filter((thesis) => checkedAreas.includes(thesis.area1)
        || checkedAreas.includes(thesis.area2));
    } else {
      filteredTheses = theses.filter((thesis) => checkedAreas.includes(thesis.area1)
        && checkedAreas.includes(thesis.area2));
    }

    return (
      <>
        <h1 style={{ textAlign: 'center', margin: 0 }}>
          {filteredTheses.length}
          {' '}
          Propostas de Tese
        </h1>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignContent: 'space-around',
            flexWrap: 'wrap',
            padding: '0 10px 10px 10px',
          }}
        >
          {filteredTheses.map((thesis) => (
            <ThesisCard
              key={thesis.id}
              id={thesis.id}
              thesis={thesis}
              areas={areas}
            />
          ))}
        </div>
      </>
    );
  }
  return <div>Não foi possível carregar as teses.</div>;
};

const ThesisCard = ({
  thesis, areas,
}) => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Card
        style={{ margin: '10px', width: '15rem', textAlign: 'center' }}
        onClick={handleShow}
      >
        <Card.Body>
          <Card.Title>{thesis.title}</Card.Title>
        </Card.Body>
      </Card>

      <Modal size="lg" show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{thesis.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h2>ID</h2>
          <p>{thesis.id}</p>
          <h2>Objectives</h2>
          <p>{thesis.objectives}</p>
          <h2>Requirements</h2>
          <p>{thesis.requirements}</p>
          <h2>Observations</h2>
          <p>{thesis.observations}</p>
          <h2>Supervisors</h2>
          {thesis.supervisors.map((supervisor) => (
            <p key={supervisor}>{supervisor}</p>
          ))}
          <h2>Vacancies</h2>
          <p>{thesis.vacancies}</p>
          <h2>Location</h2>
          <p>{thesis.location}</p>
          <h2>Areas</h2>
          <p>{areas.find((area) => area.code === thesis.area1).long}</p>
          <p>{areas.find((area) => area.code === thesis.area2).long}</p>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ThesisMasterPage;
