'use client'
import ViewDraftsButton from "@/components/molecules/ViewDraftsButton";
import NewNoteForm from "@/components/organisms/NewNoteForm";
import React from "react";

const page = () => {
  return (
    <div className="containerSpacing flex items-center justify-center drep_radial_bg">
      <div className="w-[1200px] h-fullScale p-10 bg-pure-white">
        <div className="flex flex-row items-center justify-between">
          <h2 className="font-black text-4xl w-[90%]">New Note</h2>
          <div className="flex items-center justify-center w-[10%]">
            <ViewDraftsButton />
          </div>
        </div>
        <NewNoteForm />
      </div>
    </div>
  );
};

export default page;
