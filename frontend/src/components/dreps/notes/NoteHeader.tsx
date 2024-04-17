import Button from "@/components/atoms/Button";
import NoteHeaderTitle from "./NoteHeaderTitle";
import NoteHeaderInfo from "./NoteHeaderInfo";

function NoteHeader() {
  return (
    <div className="py-32 px-24 bg-pure-white flex flex-col gap-y-12">
      <NoteHeaderTitle />
      <NoteHeaderInfo />
    </div>
  );
}

export default NoteHeader;
