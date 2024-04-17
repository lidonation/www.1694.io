import Button from "@/components/atoms/Button";

function NoteHeaderTitle() {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-8xl font-black">Notes</h2>

      <Button
        size="extraLarge"
        width={"180px"}
        variant="outlined"
        bgColor="transparent"
        color="primary"
      >
        New Note
      </Button>
    </div>
  );
}

export default NoteHeaderTitle;
