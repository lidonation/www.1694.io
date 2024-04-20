"use client";
import ViewDraftsButton from "@/components/molecules/ViewDraftsButton";
import NewNoteForm from "@/components/organisms/NewNoteForm";
import React from "react";

const page = () => {
  return (
    <div className="containerSpacing flex items-center justify-center drep_radial_bg">
      <div className="note-modal-width h-fullScale p-10 bg-pure-white">
        <div className="flex flex-row items-center justify-between">
          <h2 className="grow shrink basis-0 text-4xl font-bold leading-10 w-[85%]">
            New Note
          </h2>
          <div className="flex items-center justify-center w-[15%] text-base font-medium leading-4 text-center">
            <ViewDraftsButton />
          </div>
        </div>
        <NewNoteForm />
      </div>
    </div>
  );
};

export default page;
