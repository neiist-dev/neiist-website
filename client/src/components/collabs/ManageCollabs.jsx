import React, { useState, useEffect} from 'react';

import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import Offcanvas from "react-bootstrap/Offcanvas";
import FloatingLabel from 'react-bootstrap/FloatingLabel';

import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';

import Select from 'react-select';
import LoadSpinner from "../../hooks/loadSpinner.jsx";
import style from '../../pages/css/CollabsPage.module.css';

import DivPersonCard from "./CollabCard";
import { FcDownload } from 'react-icons/fc';
import { summarizeName } from '../functions/dataTreatment.jsx';
import { getCollabImage, allTeamNames } from "../functions/collabsGeneral.jsx";
import { downloadCurrentCollabsFile } from '../functions/exportXLSX.js';
import { fetchAllCollabs } from '../../Api.service.js';

import axios from 'axios';

const ManageCollabs = ({ selectedKey }) => {
  const [allMembers, setAllMembers] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [viewAddCollabModal, setViewAddCollabModal] = useState(false);
  const [viewRemCollabModal, setViewRemCollabModal] = useState(false);

  useEffect(() => {
    if (selectedKey == 1 && !isLoaded) {
      fetchAllCollabs()
        .then((allCollabs) => {
          setAllMembers(allCollabs);
          setIsLoaded(true);
        });
    }
  }, [selectedKey, isLoaded])

  return (
    <>
    {(!isLoaded) && <LoadSpinner />}
    {(isLoaded && allMembers) &&
      <>
        <h3>Active Members: <Badge style={{scale: '1'}} bg="success">{allMembers.length}</Badge></h3>
        <InitialButtons
          setViewAddCollabModal={setViewAddCollabModal}
          setViewRemCollabModal={setViewRemCollabModal}
        />
        <CreateCollaboratorModal show={()=>viewAddCollabModal} handleClose={()=>{setViewAddCollabModal(false)}} setIsLoaded={setIsLoaded}/>
        <CreateCollaboratorRemovalModal show={()=>viewRemCollabModal} handleClose={()=>{setViewRemCollabModal(false)}} setIsLoaded={setIsLoaded} allMembers={allMembers}/>
        <div className={style.teamsDiv}>
          {allMembers.map((x, index) => (
            <DivPersonCard
              key={index}
              name={x.name ? summarizeName(x.name) : x.username}
              image={getCollabImage(summarizeName(x.name), x.username)}
              social={x.role}

              teams={x.teams}
              showTeams={true}
            />))}
        </div>
      </>
    }
    </>
  )
};

const InitialButtons = ({ setViewAddCollabModal, setViewRemCollabModal }) => (
  <div className={style.manageCollabButtons}>
    <Button onClick={() => setViewAddCollabModal(true)}>
      <Badge bg="dark">+</Badge> Add Collab
    </Button>
    <Button onClick={() => setViewRemCollabModal(true)}>
      <Badge bg="dark">-</Badge> Remove Collab
    </Button>
    <Button>
      <Badge bg="dark">{"<->"}</Badge> Modify Team
    </Button>
    <Button onClick={downloadCurrentCollabsFile}>
      <Badge bg="light">
        <FcDownload />
      </Badge>{" "}
      Export Collabs
    </Button>
  </div>
);

const CreateCollaboratorRemovalModal = ({ show, handleClose, setIsLoaded, allMembers}) => {
  const [username, setUsername] = useState('');

  const options = allMembers?.map((member) => (
    {value: `${member.username}`, label: `${
        member.name ? member.username + ' - ' + member.name : member.username
      }`}
  ));

  return (
    <Offcanvas placement="start" show={show} onHide={handleClose}>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Remover Colaborador</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Form.Group className="mb-3">
          <Form.Label>Nome</Form.Label>
          <Select onChange={(e) => {setUsername(e.value)}} options={options}/>
        </Form.Group>

        <Button onClick={()=> {
          axios.post(`/api/collabs/remove/${username}`).then(()=>{
            handleClose();
            setUsername('');
            setIsLoaded(false);
          })}}
        bg="success">OK</Button>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

const CreateCollaboratorModal = ({ show, handleClose, setIsLoaded }) => {
  const [data, setData] = useState({
    'username': '',
    'campus': 'A',
    'teams': ''
  });

  const options = Object.entries(allTeamNames).map(([teamCode,teamName]) => (
    {value: `${teamCode}`, label: `${teamName}`}
  ))

  return (
    <Offcanvas placement="start" show={show} onHide={handleClose}>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Novo Colaborador</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Form.Group className="mb-3">
          <Row>
            <Col>
              <FloatingLabel controlId="floatingInput" label="IST-ID">
                <Form.Control onChange={(e) => setData({...data,username: e.target.value})} type="text" placeholder="IST1XXXXXX" />
              </FloatingLabel>
            </Col>
            <Col>
              <FloatingLabel controlId="floatingSelect" label="Campus">
                <Form.Select onChange={(e) => setData({...data,campus: e.target.value})} aria-label="Floating label select">
                  <option value="A">Alameda</option>
                  <option value="T">Taguspark</option>
                </Form.Select>
              </FloatingLabel>
            </Col>
          </Row>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Equipas</Form.Label>
          <Select onChange={(e)=>setData({...data,teams: e.map(u => u.value).join(",")})} isMulti options={options}/>
        </Form.Group>

        <Button onClick={()=> {
          const newCollabInformation = {
            campus: data.campus,
            teams: data.teams,
          };

          axios.post(`/api/collabs/add/${data.username}`, newCollabInformation).then(()=>{
            handleClose();
            setData({
              'username': '',
              'campus': 'A',
              'teams': ''
            });
            setIsLoaded(false);
          })}}
        bg="success">OK</Button>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default ManageCollabs;