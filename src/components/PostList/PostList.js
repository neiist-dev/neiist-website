import React, { useState, useEffect } from 'react'
var contentful = require('contentful')

const client = contentful.createClient({
    space: '2o7jx8ja37r4',
    accessToken: 'x0O62SjaVOT0-u8kYH31lCZdp-hDHiXoo6hDd1espeo'
})

const PostList = () => {
    const [posts, setPosts] = useState()

    useEffect(() => {
        client.getEntries({
            'content_type': 'post'
        })
            .then((entries) => {
                console.log(entries);
            })
    }, [])

    return null
}

export default PostList

/*import React from "react"
import { Link } from "react-router-dom"
import Markdown from "react-markdown"

const PostList = () => {
    const excerptList = postlist.map(post => {
        return post.content.split(" ").slice(0, 20).join(" ") + "..."
    })
    return (
        <div className="postlist">
            <h1 className="title">All Posts</h1>
            {postlist.length &&
                postlist.map((post, i) => {
                    return (
                        <div key={i} className="post-card">
                            <h2><Link className="links" to={`/blog/post/${post.id}`}>{post.title}</Link></h2>
                            <small>Published on {post.date} by {post.author}</small>
                            <hr />
                            <Markdown source={excerptList[i]} escapeHtml={false} />
                            <small><Link className="links" to={`/blog/post/${post.id}`}>Read more</Link></small>
                        </div>
                    )
                })
            }
        </div>
    )
}*/