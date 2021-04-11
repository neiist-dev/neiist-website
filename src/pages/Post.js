import React, { useState, useEffect } from 'react'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import { useParams } from "react-router-dom"
import Card from 'react-bootstrap/Card'
import Markdown from "react-markdown"

const Post = ({ client }) => {
    const { id } = useParams();
    const [post, setPost] = useState(null)

    useEffect(() => {
        client.getEntries({ 'fields.link': `${id}`, 'content_type': 'post' })
            .then((entries) => {
                console.log(entries.items)
                setPost(entries.items[0])
            })
    })

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
                    {post.fields.author &&
                        <Card style={{ margin: "0 15rem", padding: "10px" }}>
                            <div style={{ display: "flex" }}>
                                {post.fields.author.fields.photo &&
                                    <Card.Img style={{ height: "7rem", width: "7rem", objectFit: "cover" }} src={post.fields.author.fields.photo.fields.file.url} />
                                }
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