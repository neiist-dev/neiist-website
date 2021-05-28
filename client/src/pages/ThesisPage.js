import React, { useState, useEffect } from 'react'
import NavBar from '../components/NavBar'
import Card from 'react-bootstrap/Card'
import { useParams } from "react-router-dom"

const ThesisPage = ({ userData, setUserData }) => {
    const { id } = useParams()

    return (
        <>
            <NavBar userData={userData} setUserData={setUserData} />
            <Thesis id={id} />
        </>
    )
}

const Thesis = ({ id }) => {
    const [thesis, setThesis] = useState(null)
    const [areas, setAreas] = useState(null)
    const [error, setError] = useState(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        fetch(`http://localhost:5000/theses/${id}`)
            .then(res => res.json())
            .then(res => setThesis(res),
                (err) => {
                    setIsLoaded(true)
                    setError(err)
                }
            )
        fetch('http://localhost:5000/areas')
            .then(res => res.json())
            .then(res => {
                setAreas(res)
                setIsLoaded(true)
            },
                (err) => {
                    setIsLoaded(true)
                    setError(err)
                }
            )
    }, [id])

    if (!isLoaded) return <div>Loading...</div>
    if (error) return <div>Error: {error.message}</div>
    if (thesis) return (
        <div style={{ padding: "10px", }}>
            <Card style={{ margin: "10px 10rem" }}>
                <Card.Header as="h2">{thesis.title}</Card.Header>
                <Card.Body>
                    <Card.Text as="h5" >ID</Card.Text>
                    <Card.Text>{thesis.id}</Card.Text>
                    <Card.Text as="h5" >Objectives</Card.Text>
                    <Card.Text>{thesis.objectives}</Card.Text>
                    <Card.Text as="h5" >Requirements</Card.Text>
                    <Card.Text>{thesis.requirements}</Card.Text>
                    <Card.Text as="h5" >Observations</Card.Text>
                    <Card.Text>{thesis.observations}</Card.Text>
                    <Card.Text as="h5" >Supervisors</Card.Text>
                    {thesis.supervisors.map(supervisor => <Card.Text>{supervisor}</Card.Text>)}
                    <Card.Text as="h5" >Vacancies</Card.Text>
                    <Card.Text>{thesis.vacancies}</Card.Text>
                    <Card.Text as="h5" >Location</Card.Text>
                    <Card.Text>{thesis.location}</Card.Text>
                    {/* <Card.Text as="h5" >Courses</Card.Text>
                    <Card.Text>{thesis.courses}</Card.Text>
                    <Card.Text as="h5" >Status</Card.Text>
                    <Card.Text>{thesis.status}</Card.Text> */}
                    <Card.Text as="h5" >Areas</Card.Text>
                    <Card.Text>{areas.find(area => area.code === thesis.area1).long}</Card.Text>
                    <Card.Text>{areas.find(area => area.code === thesis.area2).long}</Card.Text>
                </Card.Body>
            </Card >
        </div>
    )
}

export default ThesisPage
