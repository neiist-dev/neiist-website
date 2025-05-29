import { Secular_One } from 'next/font/google';
import { ReactNode } from 'react';
import NavBar from '../components/navbar/NavBar';
import Footer from '../components/Footer';
import '@/styles/globals.css';

const secularOne = Secular_One({
  subsets: ['latin'],
  weight: '400',
  style: 'normal',
  display: 'swap',
});

export const metadata = {
  title: 'NEIIST',
  description: 'Núcleo Estudantil de Informática do Instituto Superior Técnico',
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={secularOne.className}>
        <NavBar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
