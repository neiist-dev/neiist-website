import React, { useState, useEffect } from 'react'
import ToggleButton from 'react-bootstrap/ToggleButton'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Card from 'react-bootstrap/Card'
import { Link } from "react-router-dom"

const ThesisMasterPage = () => {
    const [areas, setAreas] = useState(null)
    const [checkedAreas, setCheckedAreas] = useState([])

    return (
        <>
            <Areas
                areas={areas}
                setAreas={setAreas}
                checkedAreas={checkedAreas}
                setCheckedAreas={setCheckedAreas}
            />
            <Theses
                areas={areas}
                checkedAreas={checkedAreas}
            />
        </>
    )
}

const Areas = ({ areas, setAreas, checkedAreas, setCheckedAreas }) => {
    const [error, setError] = useState(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        fetch('http://localhost:5000/areas')
            .then(res => res.json())
            .then(areasRes => {
                setAreas(areasRes)
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
    if (areas) return (
        <>
            <h1 style={{ textAlign: "center", margin: 0 }}>{areas.length} Areas</h1>
            <div style={{ display: "flex", justifyContent: "center", alignContent: "space-around", padding: "10px 10px 0 10px" }}>
                {
                    areas.map((area) =>
                        <ToggleButton
                            key={area.code}
                            type="checkbox"
                            checked={checkedAreas.includes(area.code)}
                            onChange={() => {
                                if (!checkedAreas.includes(area.code)) {
                                    if (checkedAreas.length === 0 || checkedAreas.length === 1)
                                        setCheckedAreas([...checkedAreas, area.code])
                                    if (checkedAreas.length === 2)
                                        setCheckedAreas([checkedAreas[1], area.code])
                                }
                                if (checkedAreas.includes(area.code))
                                    setCheckedAreas(checkedAreas.filter(a => a !== area.code))
                            }}
                            style={{ margin: "10px", width: "15rem", display: "flex", justifyContent: "center", alignItems: "center" }}
                        >
                            {area.long}
                        </ToggleButton>
                    )
                }
            </div >
        </>
    )
}

const Theses = ({ areas, checkedAreas }) => {
    const [theses, setTheses] = useState(null)
    const [error, setError] = useState(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        let queryParameters = ''
        if(checkedAreas)
            for (let i = 0; i < checkedAreas.length; i++)
                queryParameters += (i === 0 ? '?' : '&') + 'areas[]=' + checkedAreas[i]

        fetch('http://localhost:5000/theses/' + queryParameters)
            .then(res => res.json())
            .then(res => {
                setTheses(res)
                setIsLoaded(true)
            },
                (err) => {
                    setIsLoaded(true)
                    setError(err)
                }
            )
    }, [checkedAreas])

    if (!isLoaded) return <div>Loading...</div>
    if (error) return <div>Error: {error.message}</div>
    if (theses) return (
        <>
            <h1 style={{ textAlign: "center", margin: 0 }}>{theses.length} Thesis Proposals</h1>
            <div style={{ display: "flex", justifyContent: "center", alignContent: "space-around", flexWrap: "wrap", padding: "0 10px 10px 10px" }}>
                {
                    theses.map(thesis =>
                        <ThesisCard
                            key={thesis.id}
                            id={thesis.id}
                            title={thesis.title}
                            theses={theses}
                            areas={areas}
                        />
                    )
                }
            </div>
        </>
    )
}

const ThesisCard = ({ id, title, theses, areas }) => {
    const [show, setShow] = useState(false);
    
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    
    const thesis = theses.find(thesis => thesis.id === id)

    return (
        <>
            <Card
                style={{ margin: "10px", width: "15rem", textAlign: "center" }}
                onClick={handleShow}
            >
                <Card.Body>
                    <Card.Title>{title}</Card.Title>
                </Card.Body>
            </Card >

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
                    {thesis.supervisors.map(supervisor => <p>{supervisor}</p>)}
                    <h2>Vacancies</h2>
                    <p>{thesis.vacancies}</p>
                    <h2>Location</h2>
                    <p>{thesis.location}</p>
                    {/* <p>Courses</p>
                    <p>{thesis.courses}</p>
                    <p>Status</p>
                    <p>{thesis.status}</p> */}
                    <h2>Areas</h2>
                    <p>{areas.find(area => area.code === thesis.area1).long}</p>
                    <p>{areas.find(area => area.code === thesis.area2).long}</p>
                </Modal.Body>
            </Modal>
        </>
    )
}

export default ThesisMasterPage

