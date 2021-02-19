import React from 'react'
import styled from 'styled-components'
import logo from './logo.png'

const StyledNavBar = styled.div`  
  display: flex;
  align-items: center;

  @media screen and (max-width: 500px) {
    flex-direction: column;
  }
`

const Button = styled.a`
  text-decoration: none;
  padding: 0.5rem;
  border-bottom: 2px solid white;
  color: black;

  &:hover {
        border-bottom-color: rgb(0, 191, 253);
    }

  @media screen and (max-width: 500px) {
    text-align: center;
    width: 30%;
  }
`

const NavBar = () =>
  <StyledNavBar>
    <Button href="/sobre">
      Sobre
    </Button>
    <Button href="fixme">
      Thesis Master
    </Button>
    <Button href="/hash-code">
      Hash Code
    </Button>
    <Button href="/blog">
      Blog
    </Button>
  </StyledNavBar>

export default NavBar

/*
  <Logo href="/">
    <img src={logo} height="40" alt="" />
  </Logo>
*/
