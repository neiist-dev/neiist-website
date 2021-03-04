import React from 'react'
import NavBar from '../components/NavBar/NavBar'
import Footer from '../components/Footer/Footer'

const Post = () =>
    <>
        <NavBar />
        <h1>Post</h1>
        <Footer />
    </>

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