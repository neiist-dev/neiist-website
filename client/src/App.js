import React, { useState, useContext } from 'react'

import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect
} from 'react-router-dom'

import Casa from './pages/Casa'
import Atividades from './pages/Atividades'
import QuemSomos from './pages/QuemSomos'
import Curso from './pages/Curso'
import Seccoes from './pages/Seccoes'
import Socios from './pages/Socios'
import Estatutos from './pages/Estatutos'
import Contactos from './pages/Contactos'
import Theses from './pages/ThesesPage'
import Thesis from './pages/ThesisPage'
import CarregarTeses from './pages/CarregarTeses'
import CarregarAreas from './pages/CarregarAreas'
import NewElectionPage from './pages/NewElectionPage'

import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'

export const UserDataContext = React.createContext();

const App = () => {
    const [userData, setUserData] = useState(null)

    return (
        <UserDataContext.Provider value={{userData, setUserData}}>
            <Router Router >
                <Switch>

                    <Route exact path='/'>
                        <Casa />
                    </Route>
                    <Route path='/atividades'>
                        <Atividades />
                    </Route>
                    <Route path='/quemsomos'>
                        <QuemSomos />
                    </Route>
                    <Route path='/curso'>
                        <Curso />
                    </Route>
                    <Route path='/seccoes'>
                        <Seccoes />
                    </Route>
                    <Route path='/estatutos'>
                        <Estatutos />
                    </Route>
                    <Route path='/contactos'>
                        <Contactos />
                    </Route>

                    <NonAdminRoute path='/socios'>
                        <Socios />
                    </NonAdminRoute>
                    <NonAdminRoute exact path="/theses">
                        <Theses />
                    </NonAdminRoute>
                    <NonAdminRoute path="/thesis/:id">
                        <Thesis />
                    </NonAdminRoute>

                    <AdminRoute path="/theses/upload">
                        <CarregarTeses />
                    </AdminRoute>
                    <AdminRoute path="/areas/upload">
                        <CarregarAreas />
                    </AdminRoute>
                    <AdminRoute path="/elections/new">
                        <NewElectionPage />
                    </AdminRoute>

                    <Route path='/*'>
                        <Redirect to='/' />
                    </Route>
                    
                </Switch>
            </Router >
        </UserDataContext.Provider>
    )
}

const NonAdminRoute = ({ children, ...props }) => {
    const { userData } = useContext(UserDataContext)

    return (
        <Route {...props}>
            {(userData && userData.isNonAdmin)
                ? children
                : <Redirect to='/' />
            }
        </Route >
    )
}

const AdminRoute = ({ children, ...props }) => {
    const { userData } = useContext(UserDataContext)

    return (
        <Route {...props}>
            {(userData && userData.isAdmin)
                ? children
                : <Redirect to='/' />
            }
        </Route >
    )
}

export default App