import React, { useState, useEffect } from 'react'
import NavBar from '../components/NavBar'
import ToggleButton from 'react-bootstrap/ToggleButton'
import Card from 'react-bootstrap/Card'
import { Link } from "react-router-dom"

const ThesesPage = ({ userData, setUserData }) => {
    const [checkedAreas, setCheckedAreas] = useState([])

    return (
        <>
            <NavBar userData={userData} setUserData={setUserData} />
            <Areas checkedAreas={checkedAreas} setCheckedAreas={setCheckedAreas} />
            <Theses checkedAreas={checkedAreas} />
        </>
    )
}

const Areas = ({ checkedAreas, setCheckedAreas }) => {
    const [areas, setAreas] = useState(null)
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
    )
}

const Theses = ({ checkedAreas }) => {
    const [classifiedTheses, setClassifiedTheses] = useState(null)
    const [error, setError] = useState(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        fetch('http://localhost:5000/theses/' + checkedAreas.join("/"))
            .then(res => res.json())
            .then(res => {
                setClassifiedTheses(res)
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
    if (classifiedTheses) return (
        <>
            <h1 style={{ textAlign: "center", margin: 0 }}>{classifiedTheses.length} Thesis Proposals</h1>
            <div style={{ display: "flex", justifyContent: "center", alignContent: "space-around", flexWrap: "wrap", padding: "0 10px 10px 10px" }}>
                {
                    classifiedTheses.map(thesis =>
                        <ThesisCard
                            key={thesis.id}
                            id={thesis.id}
                            title={thesis.title}
                            area1={thesis.areas[0]}
                            area2={thesis.areas[1]}
                        />
                    )
                }
            </div>
        </>
    )
}

const ThesisCard = ({ id, title, area1, area2 }) =>
    <Card style={{ margin: "10px", width: "15rem", textAlign: "center" }}>
        <Card.Body>
            <Card.Title>{title}</Card.Title>
            <Link className="stretched-link" to={`/thesis/${id}`} />
        </Card.Body>
    </Card >

export default ThesesPage

