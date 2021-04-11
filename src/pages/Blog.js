import React, { useState, useEffect } from 'react'
import NavBar from '../components/NavBar'
import Card from 'react-bootstrap/Card'
import Footer from '../components/Footer'
import Button from 'react-bootstrap/Button'

const Blog = ({ client }) => {
    const [posts, setPosts] = useState([])

    useEffect(() => {
        client.getEntries({ 'content_type': 'post' })
            .then((entries) => {
                console.log(entries.items)
                setPosts(entries.items)
            })
    })

    return (
        <>
            <NavBar />
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

/*
{
    posts.map(post => {
        return (
            <Card key={post.sys.id}>
                <Card.Img variant="top" src={post.fields.cover.fields.file.url} />
                <Card.Body>
                    <Card.Title>{post.fields.title}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">{post.fields.date}</Card.Subtitle>
                    <Card.Text>
                        <ReactMarkdown>
                            {post.fields.content}
                        </ReactMarkdown>
                    </Card.Text>
                </Card.Body>
            </Card>
        )
    })
}
*/