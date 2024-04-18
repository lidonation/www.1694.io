"use client";

import Button from "@/components/atoms/Button";
import { useRouter } from "next/navigation";

function NoteHeaderTitle() {
  const router = useRouter();

  function handleNavigate() {
    router.push("/dreps/workflow/notes/new");
  }

  return (
    <div className="flex justify-between items-center">
      <h2 className="text-8xl font-black">Notes</h2>

      <Button
        size="extraLarge"
        width={"180px"}
        variant="outlined"
        bgColor="transparent"
        color="primary"
        handleClick={handleNavigate}
      >
        New Note
      </Button>
    </div>
  );
}

export default NoteHeaderTitle;
