import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import axios from "axios";

const AdminAreasPage = () =>
  <>
    <ViewAreas />
    <UploadAreasButton />
  </>

const ViewAreas = () => {
  const [areas, setAreas] = useState(null);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_ROOT_API}/areas`)
      .then((res) => res.json())
      .then(
        (res) => {
          setAreas(res);
          setIsLoaded(true);
        },
        (err) => {
          setIsLoaded(true);
          setError(err);
        }
      );
  }, []);

  if (!isLoaded) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (areas)
    return (
      <div style={{ margin: "2rem 20vw 1rem 20vw" }}>
        <h1 style={{ textAlign: "center", margin: 0 }}>
          {areas.length} Áreas Disponíveis
        </h1>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignContent: "space-around",
            flexWrap: "wrap",
            padding: "0 10px 10px 10px",
          }}
        >
          {areas.map((area) => (
            <AreaCard key={area.id} area={area} />
          ))}
        </div>
      </div>
    );
};

const AreaCard = ({ area }) => {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Card
        style={{ margin: "10px", width: "15rem", textAlign: "center" }}
        onClick={handleShow}
      >
        <Card.Body>
          <Card.Title>{area.short}</Card.Title>
        </Card.Body>
      </Card>
      <AreaModal
        area={area}
        show={show}
        handleClose={handleClose}
      />
    </>
  );
};

const AreaModal = ({ area, show, handleClose }) =>
  <Modal size="lg" show={show} onHide={handleClose} centered>
    <Modal.Header closeButton>
      <Modal.Title>{area.short}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <h4>code</h4>
      <p>{area.code}</p>
      <h4>short</h4>
      <p>{area.short}</p>
      <h4>long</h4>
      <p>{area.long}</p>
    </Modal.Body>
  </Modal>

const UploadAreasButton = () => {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <div style={{ margin: "1rem 20vw 2rem 20vw", textAlign: "center" }}>
      <Button onClick={handleShow}>Carregar Áreas</Button>
      <UploadAreasModal show={show} handleClose={handleClose} />
    </div>
  );
};

const UploadAreasModal = ({ show, handleClose }) => {
  const [selectedFile, setSelectedFile] = useState();
  const [isFilePicked, setIsFilePicked] = useState(false);


  const handleChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setIsFilePicked(true);
  };

  const handleUploadAreas = () => {
    const formData = new FormData();
    formData.append("File", selectedFile);
    axios.post(`${process.env.REACT_APP_ROOT_API}/areas`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Carregar Áreas</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.File label="Áreas em formato json" onChange={handleChange} />
          </Form.Group>
          <Button
            variant="primary"
            onClick={() => {
              handleUploadAreas();
              handleClose();
            }}
          >
            Carregar Áreas
          </Button>
        </Form>
      </Modal.Body>
    </Modal >
  );
};

export default AdminAreasPage;
