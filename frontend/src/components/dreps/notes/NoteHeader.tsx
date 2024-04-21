import NoteHeaderTitle from "./NoteHeaderTitle";
import NoteHeaderInfo from "./NoteHeaderInfo";

function NoteHeader() {
  return (
    <div className="p-10 bg-pure-white flex flex-col gap-y-12 min-h-screen">
      <NoteHeaderTitle />

      <NoteHeaderInfo />
    </div>
  );
}

export default NoteHeader;
