import Link from 'next/link';
import { FaChevronLeft } from 'react-icons/fa';
import React from 'react';

const BackButton: React.FC = () => (
  <Link href="/blog" aria-label="Voltar" className="p-2 rounded hover:bg-muted transition-colors cursor-pointer mr-7 flex items-center">
    <FaChevronLeft className="w-5 h-5" />
  </Link>
);

export default BackButton;
