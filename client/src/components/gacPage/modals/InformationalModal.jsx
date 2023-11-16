import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

import style from '../../../pages/css/GacPage.module.css';
import { fenixPhoto } from "../../functions/dataTreatment.jsx";
import LoadSpinner from "../../../hooks/loadSpinner.jsx";
import { fetchMember } from "../../../Api.service.js";

import axios from 'axios';

export const CreateMoreInfoModal = ({ show, handleClose, username }) => {
  const [error, setError] = useState(null);
  const [member, setMember] = useState(null);
  const [remove, setRemove] = useState(true);
  const [changedEmail, setChangedEmail] = useState(null);
  const [disableEmail, setDisableEmail] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setError(null);
    if (username !== null) {
      fetchMember(username)
        .then((member) => {
          setMember(member);
          setIsLoaded(true);
          setChangedEmail(member.email);
        })
        .catch((err) => {
          setIsLoaded(true);
          setError(err);
        });
    }
  }, [username]);

  const handleUpdate = async (e, username) => {
    e.preventDefault();
    const resp = await axios.post(`/api/mag/update/email/${username}`, {
      changedEmail,
    });
    if (resp) {
      setDisableEmail(!disableEmail);
      window.location.reload(false);
    }
  };

  if (member)
    return (
      <Modal size="lg" show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title className={style.modalTitle}>
            INFORMAÇÂO DE {String(member.username).toUpperCase()}
            <Button
              className={style.btnEditEmail}
              onClick={() => {
                setDisableEmail(!disableEmail);
              }}
            >
              Editar Email
            </Button>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!isLoaded && <LoadSpinner />}
          {error && <div>Error: {error}</div>}
          {member !== null && isLoaded && (
            <div className={style.infoCard}>
              <div
                className={style.infoCard_img}
                style={{
                  backgroundImage: `url(${fenixPhoto(member.username)})`,
                }}
              />
              <div className={style.infoCard_info}>
                <b>
                  {member.username} <br />
                  <p>{member.name}</p>
                  <br />
                  <p style={{ fontSize: "18px", color: "darkblue" }}>
                    ({member.courses})
                  </p>
                  <br />
                  <Form
                    onSubmit={(e) => {
                      handleUpdate(e, member.username);
                    }}
                  >
                    <fieldset disabled={disableEmail}>
                      <Form.Control
                        id="disabledEmailInput"
                        type="email"
                        className={
                          disableEmail
                            ? style.ControlDisable
                            : style.ControlActive
                        }
                        value={changedEmail}
                        onChange={(event) =>
                          setChangedEmail(event.target.value)
                        }
                      />
                    </fieldset>
                  </Form>
                  <br />
                </b>
                <div id={style.tableDiv}>
                  <table>
                    <thead>
                      <tr>
                        <th>Registo</th>
                        <th>Sócio Eleitor</th>
                        <th style={{ width: "45%" }}>Renovação</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th>{member.registerDate}</th>
                        <th>{member.canVoteDate}</th>
                        <th>
                          {member.renewStartDate} - {member.renewEndDate}
                        </th>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <br />
                <div style={{ display: "flex", gap: "10px" }}>
                  {member.status === "Renovar" && remove && (
                    <Button
                      style={{
                        backgroundColor: "orange",
                        borderColor: "orange",
                      }}
                      onClick={() => {
                        axios
                          .put(`/api/members/${member.username}`, {
                            name: member.name,
                            email: member.email,
                            courses: member.courses,
                          })
                          .then((res) => {
                            if (res) window.location.reload();
                          });
                      }}
                    >
                      Renovar
                    </Button>
                  )}
                  {member.status !== "NaoSocio" && (
                    <DeleteButton
                      member={member}
                      handleClose={handleClose}
                      remove={remove}
                      setRemove={setRemove}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    );
};

const DeleteButton = ({ member, handleClose, remove, setRemove }) => {
  const [memberToRemove, setmemberToRemove] = useState("");

  const handleSubmit = (event, username, member) => {
    event.preventDefault();
    if (username === member.username)
      axios.put(`/api/mag/delete/${username}`).then(() => {
        handleClose();
        window.location.reload(false);
      });
  };

  return (
    <div>
      <Button
        style={
          remove
            ? {
                backgroundColor: "darkRed",
                borderColor: "darkRed",
                color: "white",
                float: "left",
                width: "100px",
              }
            : memberToRemove === member.username
            ? {
                backgroundColor: "darkGreen",
                borderColor: "darkGreen",
                color: "white",
                position: "absolute",
                float: "right",
                right: "0",
                width: "100px",
              }
            : {
                backgroundColor: "darkRed",
                borderColor: "darkRed",
                color: "white",
                position: "absolute",
                float: "right",
                right: "0",
                width: "100px",
              }
        }
        onClick={(event) => {
          if (memberToRemove === member.username)
            handleSubmit(event, memberToRemove, member);
          else setRemove(!remove);
        }}
      >
        Delete
      </Button>
      <div>
        <Form
          onSubmit={(event) => {
            handleSubmit(event, memberToRemove, member);
          }}
        >
          <fieldset disabled={remove}>
            <Form.Control
              id="disabledTextInput"
              type="Text"
              style={
                remove
                  ? { display: "none", visibility: "hidden" }
                  : { float: "right", width: "400px" }
              }
              placeholder={"Para Remover o sócio, digite: " + member.username}
              value={memberToRemove}
              onChange={(event) => setmemberToRemove(event.target.value)}
            />
          </fieldset>
        </Form>
      </div>
    </div>
  );
};
