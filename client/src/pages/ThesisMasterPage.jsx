import React, { useState, useEffect } from 'react';
import ToggleButton from 'react-bootstrap/ToggleButton';
import Modal from 'react-bootstrap/Modal';
import Card from 'react-bootstrap/Card';

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
    fetch('/api/areas')
      .then((res) => res.json())
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

  if (!isLoaded) return <div>...</div>;
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignContent: 'space-around',
            padding: '10px 10px 0 10px',
          }}
        >
          {areas.map((area) => (
            <ToggleButton
              key={area.code}
              type="checkbox"
              checked={checkedAreas.includes(area.code)}
              onChange={() => {
                if (!checkedAreas.includes(area.code)) {
                  if (checkedAreas.length === 0 || checkedAreas.length === 1) {
                    setCheckedAreas([...checkedAreas, area.code]);
                  }
                  if (checkedAreas.length === 2) {
                    setCheckedAreas([checkedAreas[1], area.code]);
                  }
                }
                if (checkedAreas.includes(area.code)) {
                  setCheckedAreas(checkedAreas.filter((a) => a !== area.code));
                }
              }}
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
        </div>
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
    const checkedAreasString = checkedAreas.join(',');
    fetch(`/api/theses/${checkedAreasString}`)
      .then((res) => res.json())
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
  }, [checkedAreas]);

  if (!isLoaded) return <div>...</div>;
  if (error) {
    return (
      <div>
        Erro:
        {error.message}
      </div>
    );
  }
  if (theses) {
    return (
      <>
        <h1 style={{ textAlign: 'center', margin: 0 }}>
          {theses.length}
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
          {theses.map((thesis) => (
            <ThesisCard
              key={thesis.id}
              id={thesis.id}
              title={thesis.title}
              theses={theses}
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
  id, title, theses, areas,
}) => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const thisThesis = theses.find((thesis) => thesis.id === id);

  return (
    <>
      <Card
        style={{ margin: '10px', width: '15rem', textAlign: 'center' }}
        onClick={handleShow}
      >
        <Card.Body>
          <Card.Title>{title}</Card.Title>
        </Card.Body>
      </Card>

      <Modal size="lg" show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{thisThesis.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h2>ID</h2>
          <p>{thisThesis.id}</p>
          <h2>Objectives</h2>
          <p>{thisThesis.objectives}</p>
          <h2>Requirements</h2>
          <p>{thisThesis.requirements}</p>
          <h2>Observations</h2>
          <p>{thisThesis.observations}</p>
          <h2>Supervisors</h2>
          {thisThesis.supervisors.map((supervisor) => (
            <p key={supervisor}>{supervisor}</p>
          ))}
          <h2>Vacancies</h2>
          <p>{thisThesis.vacancies}</p>
          <h2>Location</h2>
          <p>{thisThesis.location}</p>
          <h2>Areas</h2>
          <p>{areas.find((area) => area.code === thisThesis.area1).long}</p>
          <p>{areas.find((area) => area.code === thisThesis.area2).long}</p>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ThesisMasterPage;
