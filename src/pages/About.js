import React, { useState, useEffect } from 'react'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import Card from 'react-bootstrap/Card'

var contentful = require('contentful')

const client = contentful.createClient({
    space: '2o7jx8ja37r4',
    accessToken: 'x0O62SjaVOT0-u8kYH31lCZdp-hDHiXoo6hDd1espeo'
})

const About = () => {
    const [members, setMembers] = useState([])

    useEffect(() => {
        client.getEntries({ 'content_type': 'member' })
            .then((entries) => {
                console.log(entries.items)
                setMembers(entries.items)
            })
    })

    return (
        <>
            <NavBar />
            <h1 style={{ textAlign: "center", margin: "10px" }}>A Equipa</h1>
            <div style={{ display: "flex", justifyContent: "center", alignContent: "space-around", flexWrap: "wrap", padding: "10px" }}>
                {
                    members.map(member => {
                        return (
                            <Card style={{ margin: "10px", textAlign: "center" }} key={member.sys.id}>
                                <Card.Img style={{ height: "10rem", width: "auto", objectFit: "cover" }} variant="top" src={member.fields.photo.fields.file.url} />
                                <Card.Body>
                                    <Card.Text>{member.fields.firstName}</Card.Text>
                                    <Card.Text>{member.fields.lastName}</Card.Text>
                                </Card.Body>
                            </Card>
                        )
                    })
                }
            </div>
            <Footer />
        </>
    );
}

export default About
