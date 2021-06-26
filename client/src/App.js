import React, { useState, useContext } from 'react'
import Layout from './components/Layout'

import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect
} from 'react-router-dom'

import CasaPage from './pages/CasaPage'
import AtividadesPage from './pages/AtividadesPage'
import QuemSomosPage from './pages/QuemSomosPage'
import CursoPage from './pages/CursoPage'
import SeccoesPage from './pages/SeccoesPage'
import MembersPage from './pages/MembersPage'
import EstatutosPage from './pages/EstatutosPage'
import ContactosPage from './pages/ContactosPage'
import ThesesPage from './pages/ThesesPage'
import CarregarTesesPage from './pages/CarregarTesesPage'
import CarregarAreasPage from './pages/CarregarAreasPage'
import NewElectionPage from './pages/NewElectionPage'

import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'

export const UserDataContext = React.createContext();

const App = () => {
    const [userData, setUserData] = useState(null)

    return (
        <UserDataContext.Provider value={{userData, setUserData}}>
            <Router Router >
                <Layout>
                    <Switch>

                        <Route exact path='/'>
                            <CasaPage />
                        </Route>
                        <Route path='/atividades'>
                            <AtividadesPage />
                        </Route>
                        <Route path='/quemsomos'>
                            <QuemSomosPage />
                        </Route>
                        <Route path='/curso'>
                            <CursoPage />
                        </Route>
                        <Route path='/seccoes'>
                            <SeccoesPage />
                        </Route>
                        <Route path='/estatutos'>
                            <EstatutosPage />
                        </Route>
                        <Route path='/contactos'>
                            <ContactosPage />
                        </Route>

                        <NonAdminRoute path='/socios'>
                            <MembersPage />
                        </NonAdminRoute>
                        <NonAdminRoute exact path="/theses">
                            <ThesesPage />
                        </NonAdminRoute>

                        <AdminRoute path="/theses/upload">
                            <CarregarTesesPage />
                        </AdminRoute>
                        <AdminRoute path="/areas/upload">
                            <CarregarAreasPage />
                        </AdminRoute>
                        <AdminRoute path="/elections/new">
                            <NewElectionPage />
                        </AdminRoute>

                        <Route path='/*'>
                            <Redirect to='/' />
                        </Route>
                        
                    </Switch>
                </Layout>
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