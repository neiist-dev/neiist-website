import { ReactNode } from 'react'
import Footer from '../components/Footer';
import NavBar from '../components/NavBar/NavBar';
import { Metadata } from 'next'
import "../styles/globals.css";
import { ThemeProvider } from '../provider/ThemeProvider';

export const metadata: Metadata = {
  title: 'NEIIST',
  description: 'Núcleo Estudantil de de Informática do Insituto Superior Técnico',
}

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" >
      <body>
        <ThemeProvider>
          <NavBar />
            <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}