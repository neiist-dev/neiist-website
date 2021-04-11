import React from 'react'

import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect
} from 'react-router-dom'

import Home from './pages/Home'
import HashCode from './pages/HashCode'
import About from './pages/About'
import Blog from './pages/Blog'
import Post from './pages/Post'

import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'

const contentful = require("contentful")

const App = () => {
    const client = contentful.createClient({
        space: process.env.REACT_APP_CONTENTFUL_SPACE,
        accessToken: process.env.REACT_APP_CONTENTFUL_ACCESSTOKEN
    })

    return (
        <Router Router >
            <Switch>
                <Route exact path='/' component={Home} />
                <Route path='/sobre'>
                    <About client={client} />
                </Route>
                <Route path='/hash-code'>
                    <HashCode client={client} />
                </Route>
                <Route exact path='/blog'>
                    <Blog client={client} />
                </Route>
                <Route path='/blog/:id'>
                    <Post client={client} />
                </Route>
                <Route path='/*'>
                    <Redirect to='/' />
                </Route>
            </Switch>
        </Router >
    )
}

export default App