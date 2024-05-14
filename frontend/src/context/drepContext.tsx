import { createContext, useContext, useMemo, useState, useEffect } from 'react';

interface DRepContext {
  isWalletListModalOpen: boolean;
  isNotDRepErrorModalOpen: boolean;
  currentLocale: string;
  drepId: number;
  setIsNotDRepErrorModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsWalletListModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentLocale: React.Dispatch<React.SetStateAction<string>>;
  setNewDrepId: React.Dispatch<React.SetStateAction<number>>;
  toggleModal: () => void;
}

interface Props {
  children: React.ReactNode;
}

const DRepContext = createContext<DRepContext>({} as DRepContext);
DRepContext.displayName = 'DRepContext';

function DRepProvider(props: Props) {
  const [isWalletListModalOpen, setIsWalletListModalOpen] = useState(false);
  const [isNotDRepErrorModalOpen, setIsNotDRepErrorModalOpen] = useState(false);
  const [drepId, setNewDrepId] = useState<number | null>(null);
  //will fix later
  const [currentLocale, setCurrentLocale] = useState<string | null>('en');
  const toggleModal = () => {
    setIsWalletListModalOpen((prev) => !prev);
  };

  const value = useMemo(
    () => ({
      isWalletListModalOpen,
      isNotDRepErrorModalOpen,
      currentLocale,
      drepId,
      setIsWalletListModalOpen,
      setIsNotDRepErrorModalOpen,
      setCurrentLocale,
      toggleModal,
      setNewDrepId,
    }),
    [isWalletListModalOpen, isNotDRepErrorModalOpen, currentLocale, drepId],
  );

  return <DRepContext.Provider value={value} {...props} />;
}

function useDRepContext() {
  const context = useContext(DRepContext);

  if (!context) {
    throw new Error('useDRepContext must be used within a DRepProvider');
  }

  return context;
}

export { DRepProvider, useDRepContext };
