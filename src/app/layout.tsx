import { ReactNode } from 'react';
import { Metadata } from 'next';
import { Secular_One } from 'next/font/google';
import { ThemeProvider } from '../provider/ThemeProvider';
import NavBar from '../components/NavBar/NavBar';
import Footer from '../components/Footer';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'NEIIST',
  description: 'Núcleo Estudantil de de Informática do Insituto Superior Técnico',
};

const secularOne = Secular_One({
  subsets: ['latin'],
  weight: '400',
  style: 'normal',
  display: 'swap',
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <NavBar />
          <main className={secularOne.className}>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
