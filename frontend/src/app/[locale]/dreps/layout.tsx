'use client';
import { Background } from '@/components/atoms/Background';
import Footer from '@/components/atoms/Footer';
import Header from '@/components/atoms/Header';
import { ChooseWalletModal } from '@/components/organisms';
import { NotDRepErrorModal } from '@/components/organisms/NotDRepErrorModal';
import { useDRepContext } from '@/context/drepContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isWalletListModalOpen, isNotDRepErrorModalOpen } = useDRepContext();
  return (
    <Background>
      <Header />
      {/* blur container wrapper */}
      {isWalletListModalOpen && (
        <div className="blur-container fixed z-50 flex h-full w-full items-center justify-center">
          <ChooseWalletModal />
        </div>
      )}
      {isNotDRepErrorModalOpen && (
        <div className="blur-container fixed z-50 flex h-full w-full items-center justify-center">
          <NotDRepErrorModal />
        </div>
      )}
      {children}
      <Footer />
    </Background>
  );
}
