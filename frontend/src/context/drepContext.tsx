import { createContext, useContext, useMemo, useState, useEffect } from 'react';

interface DRepContext {
  step1Status: stepStatus["status"];
  step2Status: stepStatus["status"];
  step3Status: stepStatus["status"];
  step4Status: stepStatus["status"];
  isWalletListModalOpen: boolean;
  isNotDRepErrorModalOpen: boolean;
  currentLocale: string;
  drepId: number;
  setStep1Status: React.Dispatch<React.SetStateAction<stepStatus['status']>>;
  setStep2Status: React.Dispatch<React.SetStateAction<stepStatus['status']>>;
  setStep3Status: React.Dispatch<React.SetStateAction<stepStatus['status']>>;
  setStep4Status: React.Dispatch<React.SetStateAction<stepStatus['status']>>;
  setIsNotDRepErrorModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsWalletListModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentLocale: React.Dispatch<React.SetStateAction<string>>;
  setNewDrepId: React.Dispatch<React.SetStateAction<number>>;
  toggleModal: () => void;
}

interface Props {
  children: React.ReactNode;
}
export interface stepStatus {
  status:"success" | "active" | "pending";
}
const DRepContext = createContext<DRepContext>({} as DRepContext);
DRepContext.displayName = 'DRepContext';

function DRepProvider(props: Props) {
  const [isWalletListModalOpen, setIsWalletListModalOpen] = useState(false);
  const [isNotDRepErrorModalOpen, setIsNotDRepErrorModalOpen] = useState(false);
  const [drepId, setNewDrepId] = useState<number | null>(null);
  const [step1Status, setStep1Status] = useState<stepStatus["status"]>("pending");
  const [step2Status, setStep2Status] = useState<stepStatus["status"]>("pending");
  const [step3Status, setStep3Status] = useState<stepStatus["status"]>("pending");
  const [step4Status, setStep4Status] = useState<stepStatus["status"]>("pending");
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
      step1Status,
      step2Status,
      step3Status,
      step4Status,
      setStep1Status,
      setStep2Status,
      setStep3Status,
      setStep4Status,
      setIsWalletListModalOpen,
      setIsNotDRepErrorModalOpen,
      setCurrentLocale,
      toggleModal,
      setNewDrepId,
    }),
    [isWalletListModalOpen, isNotDRepErrorModalOpen, currentLocale, drepId, step1Status, step2Status, step3Status, step4Status],
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
