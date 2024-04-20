"use client";
import React, { useEffect, useState } from "react";
import TogglePostMedia from "../molecules/TogglePostMedia";
import NewNotePostForm from "../molecules/NewNotePostForm";
import NewNoteMediaForm from "../molecules/NewNoteMediaForm";
import { useCardano } from "@/context/walletContext";
import { useDRepContext } from "@/context/drepContext";

const NewNoteForm = () => {
  const [activeInput, setActiveInput] = useState("post");
  const { isEnabled } = useCardano();
  const { setIsWalletListModalOpen } = useDRepContext();
  const [postDataState, setpostDataState] = useState({
    postTitle: "",
    postTag: "",
    postText: null,
    postVisibility: null,
  });
  const [error, setError] = useState(null);
  useEffect(() => {
    const checkLogin = () => {
      if (!isEnabled) setIsWalletListModalOpen(true);
    };
    checkLogin();
  }, []);
  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!isEnabled) {
      setError("Please connect your wallet!");
      setTimeout(() => {
        setError(null);
      }, 1000);
      return;
    }
    console.log(postDataState);
  };
  return (
    <form
      className="bg-note-form-bg shadow-lg mt-4 p-5 rounded-3xl mb-48"
      onSubmit={handleSubmit}
    >
      <TogglePostMedia
        activeInput={activeInput}
        setActiveInput={setActiveInput}
      />
      {activeInput === "post" ? (
        <NewNotePostForm
          dataState={postDataState}
          setdataState={setpostDataState}
        />
      ) : (
        <NewNoteMediaForm />
      )}
      <div className="text-[#c22727]">{error && error}</div>
    </form>
  );
};

export default NewNoteForm;
