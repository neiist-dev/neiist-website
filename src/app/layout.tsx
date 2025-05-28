import Head from 'next/head';
import { Secular_One } from 'next/font/google';
import { ReactNode } from 'react';
import NavBar from '../components/navbar/NavBar';
import { ThemeProvider } from '../context/ThemeContext';
import Footer from '../components/Footer';
import '@/styles/globals.css';

const secularOne = Secular_One({
  subsets: ['latin'],
  weight: '400',
  style: 'normal',
  display: 'swap',
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        <title>NEIIST</title>
        <meta
          name="description"
          content="Núcleo Estudantil de Informática do Instituto Superior Técnico"
        />
      </Head>
      <body>
        <ThemeProvider  attribute="class" defaultTheme="system" enableSystem>
          <NavBar />
          <main className={secularOne.className}>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
