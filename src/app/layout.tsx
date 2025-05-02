import { ReactNode } from 'react'
import NavBar from '../components/NavBar/NavBar';
import Footer from '../components/Footer';
import { Metadata } from 'next'
import { UserDataProvider } from '../context/UserDataContext';
import "../styles/globals.css";

export const metadata: Metadata = {
  title: 'NEIIST',
  description: 'Núcleo Estudantil de de Informática do Insituto Superior Técnico',
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UserDataProvider>
          <NavBar />
            <main>{children}</main>
          <Footer />
        </UserDataProvider>
      </body>
    </html>
  )
}