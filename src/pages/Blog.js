import React, { useState, useEffect } from 'react'
import NavBar from '../components/NavBar/NavBar'
import CardColumns from 'react-bootstrap/CardColumns'
import Card from 'react-bootstrap/Card'
import Footer from '../components/Footer/Footer'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'

var contentful = require('contentful')

const client = contentful.createClient({
    space: '2o7jx8ja37r4',
    accessToken: 'x0O62SjaVOT0-u8kYH31lCZdp-hDHiXoo6hDd1espeo'
})

const Blog = () => {
    const [posts, setPosts] = useState([])

    useEffect(() => {
        client.getEntries({ 'content_type': 'post' })
            .then((entries) => {
                console.log(entries.items)
                setPosts(entries.items)
            })
    }, [])

    return (
        <>
            <NavBar />
            <CardColumns>
                {
                    posts.map(post => {
                        return (
                            <Card key={post.sys.id}>
                                <Card.Img variant="top" src={post.fields.cover.fields.file.url} />
                                <Card.Body>
                                    <Card.Title>{post.fields.title}</Card.Title>
                                    <Card.Text>{post.fields.description}</Card.Text>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Button variant="outline-secondary" size="sm">{post.fields.type}</Button>
                                        <small className="text-muted">{post.fields.date}</small>
                                    </div>
                                </Card.Body>
                            </Card>
                        )
                    })
                }
            </CardColumns>
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