import { useEffect, useState } from "react";
import Comment from "./Comment";
import { useGetNotesQuery } from "@/hooks/useGetNotesQuery";
import { useDRepContext } from "@/context/drepContext";

const SingleNoteResponses = ({
  comments,
  isEnabled,
  isLoggedIn,
  currentVoter,
}) => {
  const [sortedComments, setSortedComments] = useState(comments);
  const { refetch } = useGetNotesQuery();
  const { setIsWalletListModalOpen, setLoginModalOpen } = useDRepContext()  

  useEffect(() => {
    const sorted = [...comments].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    setSortedComments(sorted);
  }, [currentVoter, comments]);

  return (
    <div className="flex flex-col gap-3 p-2 pl-8">
      {sortedComments.map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          currentVoter={currentVoter}
          depth={0}
          refetch={refetch}
          isEnabled={isEnabled}
          isLoggedIn={isLoggedIn}
          setIsWalletListModalOpen={setIsWalletListModalOpen}
          setLoginModalOpen={setLoginModalOpen}
        />
      ))}
    </div>
  );
};

export default SingleNoteResponses;
