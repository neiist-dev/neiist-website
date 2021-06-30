import React, { useState, useEffect, useContext } from 'react'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Card from 'react-bootstrap/Card'
import { Redirect, Link } from "react-router-dom"
import { UserDataContext } from '../App'
import axios from 'axios'

const MembersPage = () => {
    const { userData } = useContext(UserDataContext)
    const [member, setMember] = useState(null)

    const [error, setError] = useState(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        fetch(`http://localhost:5000/members/${userData.username}`)
            .then(res => res.json())
            .then(member => {
                setMember(member)
                setIsLoaded(true)
            },
                (err) => {
                    setIsLoaded(true)
                    setError(err)
                }
            )
    }, [])

    if (!isLoaded) return <div>Loading...</div>
    if (error) return <div>Error: {error.message}</div>
    if (!member) return <Register />
    if (member.isExpired) return <Renew />
    if (member.canVote) return <Vote />
    else return <CantVote />
}

const Register = () => {
    const { userData } = useContext(UserDataContext)

    return (
        <Button
            onClick={() => {
                axios.post(`http://localhost:5000/members/${userData.username}`)
            }}
        >
            REGISTAR
        </Button>
    )
}

const CantVote = () =>
    <p style={{ textAlign: "center" }}>
        AINDA NAO PODES VOTAR
    </p>

const Vote = () => {
    // const { userData } = useContext(UserDataContext)

    const [elections, setElections] = useState(null)
    const [error, setError] = useState(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        fetch('http://localhost:5000/elections')
            .then(res => res.json())
            .then(res => {
                setElections(res)
                setIsLoaded(true)
            },
                (err) => {
                    setIsLoaded(true)
                    setError(err)
                }
            )
    }, [])

    if (!isLoaded) return <div>Loading...</div>
    if (error) return <div>Error: {error.message}</div>
    if (elections) return (
        <>
            <h1 style={{ textAlign: "center", margin: 0 }}>{elections.length} Active Elections</h1>
            <div style={{ display: "flex", justifyContent: "center", alignContent: "space-around", flexWrap: "wrap", padding: "0 10px 10px 10px" }}>
                {
                    elections.map(election =>
                        <ElectionCard
                            key={election.id}
                            election={election}
                        />
                    )
                }
            </div>
        </>
    )
}

const ElectionCard = ({election}) => {

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const {name, startDate, endDate} = election

    return (
        <>
            <Card
                style={{ margin: "10px", width: "15rem", textAlign: "center" }}
                onClick={handleShow}
            >
                <Card.Body>
                    <Card.Title>{name}</Card.Title>
                </Card.Body>
            </Card >

            <Modal size="lg" show={show} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* <h2>ID</h2>
                    <p>{thesis.id}</p>
                    <h2>Objectives</h2>
                    <p>{thesis.objectives}</p>
                    <h2>Requirements</h2>
                    <p>{thesis.requirements}</p>
                    <h2>Observations</h2>
                    <p>{thesis.observations}</p>
                    <h2>Supervisors</h2>
                    {thesis.supervisors.map(supervisor => <p>{supervisor}</p>)}
                    <h2>Vacancies</h2>
                    <p>{thesis.vacancies}</p>
                    <h2>Location</h2>
                    <p>{thesis.location}</p>
                    {/* <p>Courses</p>
                    <p>{thesis.courses}</p>
                    <p>Status</p>
                    <p>{thesis.status}</p> */}
                    {/* <h2>Areas</h2>
                    <p>{areas.find(area => area.code === thesis.area1).long}</p>
                    <p>{areas.find(area => area.code === thesis.area2).long}</p> */}
                </Modal.Body>
            </Modal>
        </>
    )
}

const Renew = () => {
    const { userData } = useContext(UserDataContext)

    return (
        <Button
            onClick={() => {
                // axios.post(`http://localhost:5000/members/${userData.username}`)
            }}
        >
            RENOVAR
        </Button>
    )
}

export default MembersPage