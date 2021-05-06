import React from 'react'

import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect
} from 'react-router-dom'

import HomeOld from './pages/Home'
import HashCode from './pages/HashCode'
import About from './pages/About'
import Blog from './pages/Blog'
//import Post from './pages/Post'

import Casa from './pages/Casa'
import Atividades from './pages/Atividades'
import QuemSomos from './pages/QuemSomos'
import Curso from './pages/Curso'
import Seccoes from './pages/Seccoes'
import Socios from './pages/Socios'
import Estatutos from './pages/Estatutos'
import Contactos from './pages/Contactos'

import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'

const App = () => {

    return (
        <Router Router >
            <Switch>
                <Route exact path='/'>
                    <Casa/>
                </Route>
                <Route path='/atividades'>
                    <Atividades/>
                </Route>
                <Route path='/quemsomos'>
                    <QuemSomos/>
                </Route>
                <Route path='/curso'>
                    <Curso/>
                </Route>
                <Route path='/seccoes'>
                    <Seccoes/>
                </Route>
                <Route path='/socios'>
                    <Socios />
                </Route>
                <Route path='/estatutos'>
                    <Estatutos/>
                </Route>
                <Route path='/contactos'>
                    <Contactos/>
                </Route>

                <Route path='/sobre'>
                    <About />
                </Route>
                <Route path='/blog'>
                    <Blog />
                </Route>
                <Route path='/hash-code'>
                    <HashCode />
                </Route>
                <Route path='/homeold'>
                    <HomeOld />
                </Route>


                <Route path='/*'>
                    <Redirect to='/'/>
                </Route>
            </Switch>
        </Router >
    )
}

export default App