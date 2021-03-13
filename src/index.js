import React from 'react'
import ReactDOM from 'react-dom'

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
import './index.css'

ReactDOM.render(
  <Router>
    <Switch>
      <Route exact path='/' component={Home} />
      <Route path='/sobre' component={About} />
      <Route path='/hash-code' component={HashCode} />
      <Route exact path='/blog' component={Blog} />
      <Route path='/blog/:id' component={Post} />
      <Route path='/*'><Redirect to='/' /></Route>
    </Switch>
  </Router>,
  document.getElementById('root')
)

