'use client';
import BreadCrumbs from '@/components/molecules/BreadCrumbs';
import ViewDraftsButton from '@/components/molecules/ViewDraftsButton';
import UpdateNoteForm from '@/components/organisms/UpdateNoteForm';
import { ModalType, useModals, useWallet } from '@/context/globalContext';
import { getSingleNote } from '@/services/requests/getSingleNote';
import React, { useEffect, useState, use } from 'react';

interface PageProps {
  params: Promise<{ noteid: number }>;
}

const page = ({ params }: PageProps) => {
  const { noteid } = use(params);
  const {
    wallet: { isConnected },
  } = useWallet();
  const { openModal, closeModal } = useModals();
  const [initialValues, setInitialValues] = useState(null);

  //displays or hides modal only if in form page
  useEffect(() => {
    const fetchNoteAndCheckLogin = async () => {
      try {
        if (!isConnected) {
          openModal(ModalType.LOGIN, {
            hideCloseButton: true,
          });
        }
        const note = await getSingleNote(noteid);
        setInitialValues(note);
      } catch (error) {
        console.log(error);
      }
    };
    fetchNoteAndCheckLogin();
    return () => {
      closeModal(ModalType.WALLET_LIST);
    };
  }, []);
  return (
    <div>
      <BreadCrumbs
        crumbs={[
          {
            label: 'Notes',
            href: `/dreps/notes`,
          },
          ...(initialValues?.title
            ? [
                {
                  label: `Title (${initialValues.title})`,
                },
              ]
            : []),
        ]}
      />
      <div className="drep_radial_bg mt-4 flex items-center justify-center">
        <div className="form_container h-full ">
          <div className="w-full bg-white p-10">
            <div className="flex flex-row items-center justify-between">
              <h2 className="w-[85%] shrink grow basis-0 text-4xl font-bold leading-10">
                Update Note
              </h2>
              <div className="flex w-[15%] items-center justify-center text-center text-base font-medium leading-4">
                <ViewDraftsButton isUpdating={true} />
              </div>
            </div>
            <UpdateNoteForm
              noteId={noteid}
              initialValues={initialValues}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
