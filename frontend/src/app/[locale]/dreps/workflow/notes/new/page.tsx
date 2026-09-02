'use client';
import BreadCrumbs from '@/components/molecules/BreadCrumbs';
import ViewDraftsButton from '@/components/molecules/ViewDraftsButton';
import NewNoteForm from '@/components/organisms/NewNoteForm';
import { ModalType, useModals, useWallet } from '@/context/globalContext';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect } from 'react';

const page = () => {
  const {
    wallet: { isConnected },
    currentLocale,
  } = useWallet();
  const { openModal } = useModals();
  const pathname = usePathname();

  const checkAccess = useCallback(() => {
    if (!pathname.includes(`/${currentLocale}/dreps/workflow/notes/new`)) {
      return;
    }
    if (!isConnected) {
      openModal(ModalType.LOGIN, {
        hideCloseButton: true,
      });
    }
  }, [isConnected]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return (
    <div>
      <BreadCrumbs
        crumbs={[
          {
            label: 'Notes',
            href: `/dreps/notes`,
          },
          {
            label: `New`,
            href: `/dreps/workflow/notes/new`,
          },
        ]}
      />
      <div className="drep_radial_bg mt-4 flex items-center justify-center">
        <div className="form_container h-full">
          <div className="w-full bg-white p-10">
            <div className="flex flex-row items-center justify-between">
              <h2 className="w-[85%] shrink grow basis-0 text-4xl leading-10 font-bold">
                New Note
              </h2>
              <div className="flex w-[15%] items-center justify-center text-center text-base leading-4 font-medium">
                <ViewDraftsButton />
              </div>
            </div>
            <NewNoteForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
