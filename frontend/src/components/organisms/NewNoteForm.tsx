"use client";
import React, {useEffect, useState} from "react";
import NewNotePostForm from "../molecules/NewNotePostForm";
import {useCardano} from "@/context/walletContext";
import {useDRepContext} from "@/context/drepContext";

const NewNoteForm = () => {
    const {isEnabled} = useCardano();
    const [postDataState, setpostDataState] = useState({
        postTitle: "",
        postTag: "",
        postText: null,
        postVisibility: null,
    });
    const [error, setError] = useState(null);
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
            onSubmit={handleSubmit}>            
                <NewNotePostForm
                    dataState={postDataState}
                    setdataState={setpostDataState}
                />
            <div className="text-[#c22727]" data-testid="error-msg">{error && error}</div>
        </form>
    );
};

export default NewNoteForm;
