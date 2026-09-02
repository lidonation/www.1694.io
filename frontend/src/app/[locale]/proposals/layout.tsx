'use client';
import { Background } from '@/components/atoms/Background';
import Footer from '@/components/atoms/Footer';
import { Header } from '@/components/atoms/Header';
import React from 'react';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Background>
      <Header />
      {children}
      <Footer />
    </Background>
  );
}

export default Layout;
