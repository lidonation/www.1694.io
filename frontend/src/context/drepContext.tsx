import { ChooseWalletModal } from '@/components/organisms';
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { SharedState, useSharedContext } from './sharedContext';
import { UserLoginModal } from '@/components/organisms/UserLoginModal';
import {
  compareDRepIDs,
  decodeToken,
  getItemFromLocalStorage,
  removeItemFromLocalStorage,
  setItemToLocalStorage,
} from '@/lib';
import { getSingleDRepViaVoterId } from '@/services/requests/getSingleDrepViaVoterId';
import { deleteItemFromIndexedDB, getItemFromIndexedDB } from '@/lib/indexedDb';
import { getDRepRegStatus } from '@/services/requests/getDRepRegStatus';
import { getDRepMetadata } from '@/services/requests/getDRepMetadata';
import { blake2bHex } from 'blakejs';
import { getSession } from '@/services/requests/getSession';
import {
  ActionModal,
  ActionModalProps,
} from '@/components/organisms/ActionModal';
import { usePathname } from 'next/navigation';
import { SingleDRep } from '../../types/api';
import { useGetOwnership } from '@/hooks/useGetOwnership';

export type StepStatus = 'success' | 'active' | 'pending' | 'update';

interface Steps {
  profile: StepStatus;
  signatures: StepStatus;
  socials: StepStatus;
  review: StepStatus;
}

interface DRepContext extends SharedState {
  steps: Steps;
  updateStep: (step: keyof Steps, status: StepStatus) => void;
  isLoggedIn: boolean;
  loginModalOpen: boolean;
  hideCloseButtonOnLoginModal: boolean;
  isWalletListModalOpen: boolean;
  hideCloseButtonOnWalletListModal: boolean;
  isNotDRepErrorModalOpen: boolean;
  currentLocale: string;
  drepId: number;
  isDRepRegistered: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  persistLogin: () => void;
  logout: () => void;
  currentRegistrationStep: number;
  setCurrentRegistrationStep: React.Dispatch<React.SetStateAction<number>>;
  setIsNotDRepErrorModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsWalletListModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setHideCloseButtonOnWalletListModal: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  setCurrentLocale: React.Dispatch<React.SetStateAction<string>>;
  setNewDrepId: React.Dispatch<React.SetStateAction<number>>;
  setLoginModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setHideCloseButtonOnLoginModal: React.Dispatch<React.SetStateAction<boolean>>;
  metadataJsonLd: any;
  setMetadataJsonLd: React.Dispatch<React.SetStateAction<any>>;
  metadataJsonHash: any;
  setMetadataJsonHash: React.Dispatch<React.SetStateAction<any>>;
  handleRefresh: () => Promise<void>;
  signatureId: any;
  setSignatureId: React.Dispatch<React.SetStateAction<any>>;
  drepToBeClaimed: string | null;
  drepEntityToBeClaimed: SingleDRep | null;
  drepClaimMismatch: boolean;
  setDrepClaimMismatch: React.Dispatch<React.SetStateAction<boolean>>;
  setDrepToBeClaimed: React.Dispatch<React.SetStateAction<string | null>>;
  handleActionModalOpen: (props: ActionModalProps) => void;
  handleActionModalClose: () => void;
  handleCleanup: () => void;
}

interface Props {
  children: React.ReactNode;
}

export interface currentRegistrationStep {
  step: number;
}
const DRepContext = createContext<DRepContext>({} as DRepContext);
DRepContext.displayName = 'DRepContext';

function DRepProvider(props: Props) {
  const [isWalletListModalOpen, setIsWalletListModalOpen] = useState(false);
  const [
    hideCloseButtonOnWalletListModal,
    setHideCloseButtonOnWalletListModal,
  ] = useState(false);
  const { sharedState, updateSharedState } = useSharedContext();
  const [drepToBeClaimed, setDrepToBeClaimed] = useState<string | null>(null);
  const [drepEntityToBeClaimed, setDrepEntityToBeClaimed] =
    useState<SingleDRep | null>(null);
  const [drepClaimMismatch, setDrepClaimMismatch] = useState(false);
  const [isNotDRepErrorModalOpen, setIsNotDRepErrorModalOpen] = useState(false);
  const [metadataJsonLd, setMetadataJsonLd] = useState(null);
  const [signatureId, setSignatureId] = useState(null);
  const [metadataJsonHash, setMetadataJsonHash] = useState(null);
  const [isDRepRegistered, setIsDRepRegistered] = useState(false);
  const [currentRegistrationStep, setCurrentRegistrationStep] =
    useState<currentRegistrationStep['step']>(1);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionModalProps, setActionModalProps] =
    useState<ActionModalProps | null>(null);
  const [drepId, setNewDrepId] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [hideCloseButtonOnLoginModal, setHideCloseButtonOnLoginModal] =
    useState(false);
  const { ownership } = useGetOwnership({
    drepId: drepToBeClaimed,
    voterId: sharedState?.dRepIDBech32,
  });
  const [steps, setSteps] = useState<Steps>({
    profile: 'pending',
    signatures: 'pending',
    socials: 'pending',
    review: 'pending',
  });

  const pathname = usePathname();
  //will fix later
  const [currentLocale, setCurrentLocale] = useState<string | null>('en');

  const updateStep = useCallback((step: keyof Steps, status: StepStatus) => {
    setSteps((prev) => ({ ...prev, [step]: status }));
  }, []);

  useEffect(() => {
    updateSharedState({
      isWalletListModalOpen,
      isNotDRepErrorModalOpen,
      isLoggedIn,
      isLoginModalOpen: loginModalOpen,
      hideCloseButtonOnLoginModal: hideCloseButtonOnLoginModal,
    });
  }, [
    isWalletListModalOpen,
    isNotDRepErrorModalOpen,
    isLoggedIn,
    loginModalOpen,
    hideCloseButtonOnLoginModal,
  ]);

  useEffect(() => {
    const drepToBeClaimed = getItemFromLocalStorage('drepToBeClaimed');
    if (drepToBeClaimed) {
      setDrepToBeClaimed(drepToBeClaimed);
    }
  }, []);

  useEffect(() => {
    persistLogin();
  }, [sharedState?.stakeKey]);

  useEffect(() => {
    handleDrepProfileCreationState();
  }, [drepToBeClaimed]);

  useEffect(() => {
    if (drepToBeClaimed) {
      setItemToLocalStorage('drepToBeClaimed', drepToBeClaimed);
    }
  }, [drepToBeClaimed]);

  useEffect(() => {
    // check if drepId is not the same as the one in the shared state and ownership is false
    if (
      !compareDRepIDs(drepToBeClaimed, sharedState?.dRepIDBech32) &&
      ownership &&
      ownership.result === false
    ) {
      // verified under two parameters,
      setDrepClaimMismatch(true);
    }
  }, [ownership, drepToBeClaimed, sharedState?.dRepIDBech32]);

  const handleCleanup = () => {
    //list of items to be cleared on unmount
    setMetadataJsonHash(null);
    setMetadataJsonLd(null);
    setNewDrepId(null);
    setDrepToBeClaimed(null);
    setDrepEntityToBeClaimed(null);
    setDrepClaimMismatch(false);
    setIsDRepRegistered(false);
    setSteps({
      profile: 'pending',
      signatures: 'pending',
      socials: 'pending',
      review: 'pending',
    });
    if (!getItemFromLocalStorage('isUpdating')) {
      deleteItemFromIndexedDB('metadataJsonLd');
      deleteItemFromIndexedDB('metadataJsonHash');
    }
  };

  const handleRefresh = async () => {
    const locallySavedJsonld = await getItemFromIndexedDB('metadataJsonLd');
    const locallySavedHash = await getItemFromIndexedDB('metadataJsonHash');
    if (locallySavedHash) {
      setMetadataJsonHash(locallySavedHash);
    }
    if (locallySavedJsonld) {
      setMetadataJsonLd(locallySavedJsonld);
    }
  };

  const handleDrepProfileCreationState = async () => {
    try {
      let metadataJsonLd = null;
      const drepId = drepToBeClaimed;
      if (!drepId) return;

      const isDRepRegistered = await getDRepRegStatus(drepId);
      if (!isDRepRegistered) return;
      setIsDRepRegistered(true);

      const drep = await getSingleDRepViaVoterId(drepId);
      if (drep?.drep_id) {
        setNewDrepId(drep?.drep_id);
      }
      if (drep?.signature_signature) {
        updateStep('signatures', 'success');
      }
      setDrepEntityToBeClaimed(drep);

      try {
        const res = await getDRepMetadata(drep?.view);
        if (res) {
          metadataJsonLd = res;
          setMetadataJsonLd(res);
          const jsonHash = blake2bHex(
            JSON.stringify(metadataJsonLd),
            undefined,
            32,
          );
          setMetadataJsonHash(jsonHash);
        }
      } catch (e) {
        if (e.response?.status === 404) {
          console.log('Metadata not found');
        } else {
          console.log(e);
        }
      }

      if (!metadataJsonLd && pathname.includes('/workflow/profile/update')) {
        const locallySavedJsonld = await getItemFromIndexedDB('metadataJsonLd');
        const locallySavedHash = await getItemFromIndexedDB('metadataJsonHash');
        if (locallySavedHash) setMetadataJsonHash(locallySavedHash);
        if (locallySavedJsonld) {
          metadataJsonLd = locallySavedJsonld;
          setMetadataJsonLd(locallySavedJsonld);
        }
      }

      if (!metadataJsonLd) return;
      const metadataBody = metadataJsonLd?.body;

      if (metadataBody?.givenName || metadataBody?.bio || metadataBody?.email) {
        updateStep('profile', 'success');
      }
      if (metadataBody?.references?.length > 0) {
        const currentSocialLinks = ['x', 'github', 'instagram', 'facebook'];
        const hasSocialLinks = metadataBody.references.some((ref: any) =>
          currentSocialLinks.includes(ref?.label?.['@value'] || ref?.label),
        );
        if (hasSocialLinks) updateStep('socials', 'success');
      }
      if (metadataBody) updateStep('review', 'success');
    } catch (error) {
      console.log(error);
    }
  };

  const persistLogin = async () => {
    const token = getItemFromLocalStorage('token_1694');
    if (token) {
      const {
        decoded: { exp, ...rest },
      } = decodeToken(token);
      const { signature, key } = rest as any;
      //check if token is expired
      if (exp < Date.now() / 1000) {
        setIsLoggedIn(false);
        removeItemFromLocalStorage('token_1694');
        removeItemFromLocalStorage('signatures');
        return;
      }
      if (!sharedState?.stakeKey) {
        setIsLoggedIn(true);
        updateSharedState({ loginCredentials: { signature, key } });
        return;
      }
      //get session data from backend
      const sessionData = await getSession({
        payload: { signature, key, stakeKey: sharedState?.stakeKey },
      });
      setSignatureId(sessionData?.id);
      setIsLoggedIn(true);
      updateSharedState({ loginCredentials: { signature, key } });
    }
  };

  const handleActionModalOpen = useCallback(
    (props: ActionModalProps) => {
      setActionModalProps(props);
      setIsActionModalOpen(true);
    },
    [setActionModalProps, setIsActionModalOpen],
  );

  const handleActionModalClose = useCallback(() => {
    setActionModalProps(null);
    setIsActionModalOpen(false);
  }, [setActionModalProps, setIsActionModalOpen]);

  const logout = useCallback(async () => {
    removeItemFromLocalStorage('token_1694');
    removeItemFromLocalStorage('signatures');
    setSignatureId(null);
    setIsLoggedIn(false);
  }, []);

  const value = useMemo(
    () => ({
      steps,
      updateStep,
      isWalletListModalOpen,
      isNotDRepErrorModalOpen,
      currentLocale,
      drepId,
      signatureId,
      setSignatureId,
      isLoggedIn,
      metadataJsonLd,
      isDRepRegistered,
      setMetadataJsonLd,
      metadataJsonHash,
      setMetadataJsonHash,
      currentRegistrationStep,
      loginModalOpen,
      hideCloseButtonOnWalletListModal,
      hideCloseButtonOnLoginModal,
      setIsLoggedIn,
      setIsWalletListModalOpen,
      setHideCloseButtonOnWalletListModal,
      setIsNotDRepErrorModalOpen,
      setHideCloseButtonOnLoginModal,
      setCurrentLocale,
      setCurrentRegistrationStep,
      handleRefresh,
      setNewDrepId,
      persistLogin,
      logout,
      setLoginModalOpen,
      drepToBeClaimed,
      drepEntityToBeClaimed,
      drepClaimMismatch,
      setDrepClaimMismatch,
      setDrepToBeClaimed,
      handleActionModalOpen,
      handleActionModalClose,
      handleCleanup,
      ...sharedState,
    }),
    [
      isWalletListModalOpen,
      hideCloseButtonOnWalletListModal,
      isNotDRepErrorModalOpen,
      currentRegistrationStep,
      currentLocale,
      drepId,
      signatureId,
      loginModalOpen,
      steps,
      updateStep,
      sharedState,
      handleCleanup,
      metadataJsonLd,
      isDRepRegistered,
      metadataJsonHash,
      drepToBeClaimed,
      drepEntityToBeClaimed,
    ],
  );

  return (
    <DRepContext.Provider value={value}>
      {props.children}
      {sharedState.isWalletListModalOpen && (
        <div className="blur-container absolute left-0 top-0  z-50 flex h-screen w-full items-center justify-center">
          <ChooseWalletModal
            hideCloseButton={hideCloseButtonOnWalletListModal}
          />
        </div>
      )}

      {loginModalOpen && (
        <div className="blur-container fixed left-0 top-0  z-50 flex h-screen w-full items-center justify-center">
          <UserLoginModal hideCloseButton={hideCloseButtonOnLoginModal} />
        </div>
      )}
      {isActionModalOpen && (
        <div className="blur-container fixed left-0 top-0  z-50 flex h-screen w-full items-center justify-center">
          <ActionModal
            {...actionModalProps}
            handleClose={() => {
              setActionModalProps(null);
              setIsActionModalOpen(false);
            }}
          />
        </div>
      )}
    </DRepContext.Provider>
  );
}

function useDRepContext() {
  const context = useContext(DRepContext);

  if (!context) {
    throw new Error('useDRepContext must be used within a DRepProvider');
  }

  const logout = useCallback(async () => {
    await context.logout();
  }, [context]);

  return { ...context, logout };
}

export { DRepProvider, useDRepContext };
