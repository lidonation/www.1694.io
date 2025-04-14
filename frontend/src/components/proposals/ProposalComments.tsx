import { ChatBubbleOutline, Send } from '@mui/icons-material';
import { Box, Button } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useDRepContext } from '@/context/drepContext';
import { useCardano } from '@/context/walletContext';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { useQueryClient } from 'react-query';
import { formatNumberTimeToReadable, getDataFromSession } from '@/lib';
import { setUpPdfJwt } from '@/lib/pdfJwtHelper';
import MarkdownParser from '../atoms/MarkdownParser';
import { postProposalComment } from '@/services/requests/postProposalComment';
import { getDRepRegStatus } from '@/services/requests/getDRepRegStatus';

type CommentData = {
  bd_proposal_id: string;
  comment_text: string;
  drep_id: string;
  comment_parent_id?: string;
};

type ProposalCommentsProps = {
  proposal: any;
  comments: any;
  isCommentsLoading?: boolean;
};

const CommentForm = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Add your comment...',
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  placeholder?: string;
}) => (
  <Box className="flex-1">
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full resize-none rounded-lg border border-gray-300 p-3 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
      rows={3}
    />
    <Box className="mt-2 flex justify-end">
      <Button
        variant="outlined"
        size="medium"
        className="flex w-fit justify-between gap-1"
        onClick={onSubmit}
      >
        <Send fontSize="small" />
        <span>Submit</span>
      </Button>
    </Box>
  </Box>
);

const CommentContent = ({ comment }: { comment: any }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isClamped, setIsClamped] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [drepRegistered, setDRepRegistered] = useState(null);

  console.log('drepRegistered', drepRegistered);

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      setIsClamped(el.scrollHeight > el.clientHeight);
    }

    async function getRegStatus() {
      if(!comment?.attributes?.drep_id) return;
      setDRepRegistered(null);
      try {
        const isDRepRegistered = await getDRepRegStatus(
          comment?.attributes?.drep_id,
        );
        setDRepRegistered(isDRepRegistered);
      } catch (error) {
        console.error('Error fetching DRep registration status:', error);
      }
    }

    getRegStatus();
  }, [comment]);

  return (
    <>
      <Box className="flex items-center justify-between">
        <Box className="mb-1 flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">
            @{comment.attributes.user_govtool_username}
          </h3>
          {drepRegistered?.registered && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-primary-300">
              Drep
            </span>
          )}
        </Box>
        <span className="text-sm text-gray-500">
          {formatNumberTimeToReadable(comment.attributes.createdAt)}
        </span>
      </Box>

      {drepRegistered?.view && (
        <p className="w-1/2 truncate text-xs text-primary-300">
          <span className="text-gray-700">ID:</span>{' '}
          {drepRegistered?.view?.substring(0, 20)}...
        </p>
      )}

      <Box>
        <Box
          ref={contentRef}
          className={`${
            expanded ? '' : 'line-clamp-3'
          } transition-all duration-300`}
        >
          <MarkdownParser
            text={comment.attributes.comment_text?.toString() || '-'}
          />
        </Box>

        {isClamped && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-1 text-sm text-primary-300 underline hover:opacity-80"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </Box>
    </>
  );
};

function ProposalComments({
  proposal,
  comments,
  isCommentsLoading,
}: ProposalCommentsProps) {
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState<{
    isReplying: boolean;
    commentId: string | null;
  }>({
    isReplying: false,
    commentId: null,
  });

  const { setIsWalletListModalOpen } = useDRepContext();
  const { dRepID, isEnabled, stakeKey, walletApi } = useCardano();
  const { addWarningAlert, addSuccessAlert } = useGlobalNotifications();
  const queryClient = useQueryClient();
  const [drepRegistered, setDRepRegistered] = useState(null);

  useEffect(() => {
    async function getRegStatus() {
      if(!dRepID) return;
      setDRepRegistered(null);
      try {
        const isDRepRegistered = await getDRepRegStatus(dRepID);
        setDRepRegistered(isDRepRegistered);
      } catch (error) {
        console.error('Error fetching DRep registration status:', error);
      }
    }
    getRegStatus();
  }, [proposal]);

  const totalComments = proposal?.attributes?.prop_comments_number || 0;

  const parentComments = comments?.data.filter(
    (comment) => comment.attributes.comment_parent_id === null,
  );

  const getChildComments = (parentId: string) => {
    return comments?.data.filter(
      (comment) => comment.attributes.comment_parent_id === parentId.toString(),
    );
  };

  const checkWalletConnection = (): boolean => {
    if (!isEnabled) {
      setIsWalletListModalOpen(true);
      return false;
    }
    return true;
  };

  const validateCommentText = (text: string): boolean => {
    if (text.trim() === '') {
      addWarningAlert('Comment cannot be empty');
      return false;
    }
    return true;
  };

  const prepareCommentData = (text: string, parentId?: string): CommentData => {
    return {
      bd_proposal_id: proposal.id.toString(),
      comment_text: text,
      drep_id: drepRegistered?.registerd ? dRepID || '' : '',
      ...(parentId && { comment_parent_id: parentId.toString() }),
    };
  };

  const handleCommentSubmit = async () => {
    if (!checkWalletConnection() || !validateCommentText(commentText)) return;

    if (!getDataFromSession('pdfUserJwt')) {
      await setUpPdfJwt(stakeKey, walletApi);
    }

    try {
      const commentData = prepareCommentData(commentText);
      await postProposalComment(proposal.id, commentData);
      setCommentText('');
      queryClient.invalidateQueries({
        queryKey: ['getActionProposalCommentsKey'],
      });
      addSuccessAlert('Comment posted successfully');
    } catch (error) {
      console.error('Failed to post comment:', error);
      addWarningAlert('Failed to post comment. Please try again.');
    }
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!checkWalletConnection() || !validateCommentText(replyText)) return;

    if (!getDataFromSession('pdfUserJwt')) {
      await setUpPdfJwt(stakeKey, walletApi);
    }

    try {
      const commentData = prepareCommentData(replyText, commentId);
      await postProposalComment(proposal.id, commentData);
      setReplyText('');
      setReplying({ isReplying: false, commentId: null });
      queryClient.invalidateQueries({
        queryKey: ['getActionProposalCommentsKey'],
      });
      addSuccessAlert('Comment posted successfully');
    } catch (error) {
      console.error('Failed to post reply:', error);
      addWarningAlert('Failed to post reply. Please try again.');
    }
  };

  const toggleReply = (commentId: string) => {
    setReplying({
      isReplying:
        replying.commentId === commentId ? !replying.isReplying : true,
      commentId:
        replying.commentId === commentId && replying.isReplying
          ? null
          : commentId,
    });
    setReplyText('');
  };

  return (
    <Box id="comments" className="space-y-6 rounded-md bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Comments ({totalComments})</h2>

      <Box className="mb-4">
        <Box className="flex items-start space-x-3">
          <CommentForm
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onSubmit={handleCommentSubmit}
          />
        </Box>
      </Box>

      {isCommentsLoading ? (
        <p className="text-center">Loading proposal comments...</p>
      ) : parentComments && parentComments.length > 0 ? (
        <Box className="space-y-6">
          {parentComments.map((comment) => (
            <Box key={comment.id}>
              <Box className=" flex-1 rounded-md  bg-gray-50 p-2 shadow-sm">
                <CommentContent comment={comment} />

                <Box className="mt-2">
                  <Button
                    variant="outlined"
                    className="flex items-center gap-1"
                    size="medium"
                    onClick={() => toggleReply(comment.id)}
                  >
                    <ChatBubbleOutline fontSize="small" />
                    {replying.isReplying && replying.commentId === comment.id
                      ? 'Close'
                      : 'Reply'}
                  </Button>

                  {replying.isReplying && replying.commentId === comment.id && (
                    <Box className="mt-2 flex-1">
                      <CommentForm
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onSubmit={() => handleReplySubmit(comment.id)}
                      />
                    </Box>
                  )}
                </Box>
              </Box>

              <Box className="mt-4 space-y-4">
                {getChildComments(comment.id).map((childComment) => (
                  <Box key={childComment.id} className="ml-12">
                    <Box className="flex-1 rounded-md bg-gray-50 p-2 shadow-sm">
                      <CommentContent comment={childComment} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <p className="text-center">No comments yet, be the first to comment!</p>
      )}
    </Box>
  );
}

export default ProposalComments;
