import React, { useState, useEffect } from 'react'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import { useParams } from "react-router-dom"
import Card from 'react-bootstrap/Card'
import Markdown from "react-markdown"

var contentful = require('contentful')

const client = contentful.createClient({
    space: '2o7jx8ja37r4',
    accessToken: 'x0O62SjaVOT0-u8kYH31lCZdp-hDHiXoo6hDd1espeo'
})

const Post = () => {
    let { id } = useParams();

    const [post, setPost] = useState(null)

    useEffect(() => {
        client.getEntries({ 'fields.link': `${id}`, 'content_type': 'post' })
            .then((entries) => {
                console.log(entries.items)
                setPost(entries.items[0])
            })
    }, [])

    const renderers = {
        //This custom renderer changes how images are rendered
        //we use it to constrain the max width of an image to its container
        image: ({
            alt,
            src,
            title,
        }: {
            alt?: string;
            src?: string;
            title?: string;
        }) => (
            <img
                alt={alt}
                src={src}
                title={title}
                style={{
                    display: "block",
                    marginLeft: "auto",
                    marginRight: "auto",
                    maxWidth: "50vw"
                }} />
        ),
    };

    return (
        <>
            <NavBar />
            {post &&
                <div style={{ margin: "10px" }}>
                    <h1 style={{ padding: "10px", textAlign: "center" }}>{post.fields.title}</h1>
                    <div style={{ padding: "10px", margin: "0 15rem" }}>
                        <Markdown source={post.fields.content} renderers={renderers} escapeHtml={false} />
                    </div>
                    {
                        post.fields.author &&
                        <Card style={{ margin: "0 15rem", padding: "10px" }}>
                            <div style={{ display: "flex" }}>
                                <Card.Img style={{ height: "7rem", width: "7rem", objectFit: "cover" }} src={post.fields.author.fields.photo.fields.file.url} />
                                <Card.Body>
                                    <Card.Title>{post.fields.author.fields.name}</Card.Title>
                                    <Card.Text>{post.fields.author.fields.description}</Card.Text>
                                </Card.Body>
                            </div>
                        </Card>
                    }
                </div >
            }
            <Footer />
        </>
    )
}

export default Post

/*import React from "react"
import { Redirect } from "react-router-dom"
import Markdown from "react-markdown"
import NavigationBar from '../components/NavigationBar/NavigationBar'
import postlist from "../posts.json"

const Post = (props) => {
    const validId = parseInt(props.match.params.id)
    if (!validId) {
        return <Redirect to="/blog" />
    }
    const fetchedPost = {}
    let postExists = false
    postlist.forEach((post, i) => {
        if (validId === post.id) {
            fetchedPost.title = post.title ? post.title : "No title given"
            fetchedPost.date = post.date ? post.date : "No date given"
            fetchedPost.author = post.author ? post.author : "No author given"
            fetchedPost.content = post.content ? post.content : "No content given"
            postExists = true
        }
    })
    if (postExists === false) {
        return <Redirect to="/blog" />
    }
    return (
        <>
            <NavigationBar />
            <div style={{ width: "40%", margin: "auto" }}>
                <h2>{fetchedPost.title}</h2>
                <small>Published on {fetchedPost.date} by {fetchedPost.author}</small>
                <hr />
                <Markdown source={fetchedPost.content} escapeHtml={false} />
            </div>
        </>
    )
}*/