import React from "react";

const TogglePostMedia = ({ activeInput, setActiveInput }) => {
  return (
    <div className="flex flex-row items-start gap-3 ">
      <div
        className={`flex flex-row items-center justify-center gap-5 px-14 py-4 cursor-pointer toggle-tab ${
          activeInput === "post" && "active"
        }`}
        onClick={() => setActiveInput("post")}
      >
        <img src="/note/note.svg" alt="Post img" />
        <p className="text-custom-blue">Post</p>
      </div>
      <div
        className={`flex flex-row items-center justify-center gap-5 px-10 py-4 cursor-pointer toggle-tab ${
          activeInput === "multimedia" && "active"
        }`}
        onClick={() => setActiveInput("multimedia")}
      >
        <img src="/note/pic.svg" alt="Pic img" />
        <p className="text-custom-blue">Multimedia</p>
      </div>
    </div>
  );
};

export default TogglePostMedia;
