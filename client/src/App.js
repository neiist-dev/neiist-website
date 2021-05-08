import React, { useState } from 'react'

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
import ThesisMaster from './pages/ThesisMaster'
import Theses from './pages/ThesesPage'
import Thesis from './pages/ThesisPage'

import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'

const App = () => {
    const [userData, setUserData] = useState(null)

    return (
        <Router Router >
            <Switch>
                <Route exact path='/'>
                    <Casa userData={userData} setUserData={setUserData}/>
                </Route>
                <Route path='/atividades'>
                    <Atividades userData={userData} setUserData={setUserData}/>
                </Route>
                <Route path='/quemsomos'>
                    <QuemSomos userData={userData} setUserData={setUserData}/>
                </Route>
                <Route path='/curso'>
                    <Curso userData={userData} setUserData={setUserData}/>
                </Route>
                <Route path='/seccoes'>
                    <Seccoes userData={userData} setUserData={setUserData}/>
                </Route>
                <Route path='/socios'>
                    <Socios userData={userData} setUserData={setUserData}/>
                </Route>
                <Route path='/estatutos'>
                    <Estatutos userData={userData} setUserData={setUserData}/>
                </Route>
                <Route path='/contactos'>
                    <Contactos userData={userData} setUserData={setUserData}/>
                </Route>
                <Route path="/thesismaster">
                    <ThesisMaster userData={userData} setUserData={setUserData} />
                </Route>
                {userData &&
                    <Route path="/theses">
                        <Theses userData={userData} setUserData={setUserData} />
                    </Route>
                }
                {userData &&
                    <Route path="/thesis/:id">
                        <Thesis userData={userData} setUserData={setUserData} />
                    </Route>
                }

                <Route path='/sobre'>
                    <About userData={userData} setUserData={setUserData}/>
                </Route>
                <Route path='/blog'>
                    <Blog userData={userData} setUserData={setUserData}/>
                </Route>
                <Route path='/hash-code'>
                    <HashCode userData={userData} setUserData={setUserData}/>
                </Route>
                <Route path='/homeold'>
                    <HomeOld userData={userData} setUserData={setUserData}/>
                </Route>


                <Route path='/*'>
                    <Redirect to='/'/>
                </Route>
            </Switch>
        </Router >
    )
}

export default App