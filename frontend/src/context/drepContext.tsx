import { createContext, useContext, useMemo, useState, useEffect } from "react";

interface DRepContext {
  isWalletListModalOpen: boolean;
  currentLocale: string;
  setIsWalletListModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentLocale: React.Dispatch<React.SetStateAction<string>>;
  toggleModal: () => void;
}

interface Props {
  children: React.ReactNode;
}

const DRepContext = createContext<DRepContext>({} as DRepContext);
DRepContext.displayName = "DRepContext";

function DRepProvider(props: Props) {
  const [isWalletListModalOpen, setIsWalletListModalOpen] = useState(false);
  //will fix later
  const [currentLocale, setCurrentLocale] = useState<string | null>('en');
  const toggleModal = () => {
    setIsWalletListModalOpen((prev) => !prev);
  };

  const value = useMemo(
    () => ({
      isWalletListModalOpen,
      currentLocale,
      setIsWalletListModalOpen,
      setCurrentLocale,
      toggleModal,
    }),
    [isWalletListModalOpen, currentLocale]
  );

  return <DRepContext.Provider value={value} {...props} />;
}

function useDRepContext() {
  const context = useContext(DRepContext);

  if (!context) {
    throw new Error("useDRepContext must be used within a DRepProvider");
  }

  return context;
}

export { DRepProvider, useDRepContext };
