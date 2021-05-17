import React, { useState, useEffect } from 'react'
import NavBar from '../src/components/NavBar'
import Card from 'react-bootstrap/Card'
import Footer from '../src/components/Footer'
import Button from 'react-bootstrap/Button'

const Blog = ({ userData, setUserData }) => {
    const [posts, setPosts] = useState([])

    return (
        <>
            <NavBar userData={userData} setUserData={setUserData}/>
            <div style={{ display: "flex", justifyContent: "center", alignContent: "space-around", flexWrap: "wrap", padding: "10px" }}>
                {
                    posts.map(post => {
                        return (
                            <Card style={{ margin: "10px" }} key={post.sys.id}>
                                <Card.Img style={{ height: "20rem", width: "auto", objectFit: "cover" }} variant="top" src={post.fields.cover.fields.file.url} />
                                <Card.Body>
                                    <Card.Title>{post.fields.title}</Card.Title>
                                    <Card.Text>{post.fields.description}</Card.Text>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Button variant="outline-secondary" size="sm">{post.fields.type}</Button>
                                        <small className="text-muted">{post.fields.date}</small>
                                    </div>
                                    <a href={`/blog/${post.fields.link}`} class="stretched-link" target="_blank" rel="noreferrer" />
                                </Card.Body>
                            </Card>
                        )
                    })
                }
            </div>
            < Footer />
        </>
    )
}

export default Blog