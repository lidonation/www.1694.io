import { ChatBubbleOutline, Send } from '@mui/icons-material';
import { Box, Button } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useDRepContext } from '@/context/drepContext';
import { useCardano } from '@/context/cardanoContext';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { useQueryClient } from 'react-query';
import { formatNumberTimeToReadable, getDataFromSession } from '@/lib';
import MarkdownParser from '../atoms/MarkdownParser';
import { postProposalComment } from '@/services/requests/postProposalComment';
import { setUpPdfJwt } from '@/lib/pdfJwtHelper';
import { useGetDRepRegistrationQuery } from '@/hooks/useGetDRepRegistrationQuery';
import { loginUserToPdf } from '@/services/requests/loginUserToPdf';
import { useWallet } from '@/context/walletContext';
import { AuthMethod } from '../../../types/auth';

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
  const { registration } = useGetDRepRegistrationQuery(
    comment?.attributes?.drep_id,
  );

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      setIsClamped(el.scrollHeight > el.clientHeight);
    }
  }, [comment]);

  return (
    <>
      <Box className="flex items-center justify-between">
        <Box className="mb-1 flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">
            @{comment.attributes.user_govtool_username}
          </h3>
          {registration?.registered && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-primary-300">
              Drep
            </span>
          )}
        </Box>
        <span className="text-sm text-gray-500">
          {formatNumberTimeToReadable(comment.attributes.createdAt)}
        </span>
      </Box>

      {registration?.view && (
        <p className="w-1/2 truncate text-xs text-primary-300">
          <span className="text-gray-700">ID:</span>{' '}
          {registration?.view?.substring(0, 20)}...
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

  const { setLoginModalOpen, setGovToolUsernameModalOpen } = useDRepContext();
  const { signMessage } = useCardano();
  const {
    wallet: { isConnected, dRepId, dRepKeyHash, stakeKey, isDRep },
    activeWallet,
  } = useWallet();
  const { addWarningAlert, addSuccessAlert } = useGlobalNotifications();
  const queryClient = useQueryClient();

  const totalComments = proposal?.attributes?.prop_comments_number || 0;

  const parentComments = comments?.data.filter(
    (comment: { attributes: { comment_parent_id: null } }) =>
      comment.attributes.comment_parent_id === null,
  );

  const getChildComments = (parentId: string) => {
    return comments?.data.filter(
      (comment: { attributes: { comment_parent_id: string } }) =>
        comment.attributes.comment_parent_id === parentId.toString(),
    );
  };

  const handleLoginToPdf = async () => {
    let res = await signMessage(
      'To proceed, please sign this data to verify your identity. This ensures that the action is secure and confirms your identity.',
      stakeKey,
      activeWallet === AuthMethod.HOT_WALLET ? true : false,
      activeWallet === AuthMethod.LOGIN_FILE ? true : false,
    );
    const userResponse = await loginUserToPdf({
      identifier: stakeKey,
      signedData: res,
    });

    await setUpPdfJwt(userResponse);

    if (!userResponse?.user?.govtool_username) {
      setGovToolUsernameModalOpen(true);
      return { userNameModalActive: true };
    }

    if (isDRep && userResponse?.user?.govtool_username) {
      addWarningAlert(
        'You are a DRep! We need to verify your drep key.',
        false,
      );
      let signedData = await signMessage(
        `To proceed, please sign this data to verify your dRep identity. This ensures that the action is secure and confirms your identity. Timestamp: ${new Date()?.getTime()}`,
        dRepId,
        activeWallet === AuthMethod.HOT_WALLET ? true : false,
        activeWallet === AuthMethod.LOGIN_FILE ? true : false,
      );
      const drepResponse = await loginUserToPdf({
        identifier: dRepKeyHash.to_hex(),
        signedData,
      });

      await setUpPdfJwt(drepResponse);
    }
  };

  const checkWalletConnection = (): boolean => {
    if (!isConnected) {
      setLoginModalOpen(true);
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
      drep_id: isDRep ? dRepId || '' : '',
      ...(parentId && { comment_parent_id: parentId.toString() }),
    };
  };

  const handleCommentSubmit = async () => {
    if (!checkWalletConnection() || !validateCommentText(commentText)) return;

    if (!getDataFromSession('pdfUserJwt')) {
      const loginRes = await handleLoginToPdf();
      if (loginRes?.userNameModalActive) return;
    }

    try {
      const commentData = prepareCommentData(commentText);
      await postProposalComment(proposal.id, commentData);
      setCommentText('');
      queryClient.invalidateQueries({
        queryKey: ['getActionProposalCommentsKey'],
      });
      addSuccessAlert('Your comment has been recorded successfully');
    } catch (error) {
      console.error('Failed to post comment:', error);
      addWarningAlert('Failed to record comment. Please try again.');
    }
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!checkWalletConnection() || !validateCommentText(replyText)) return;

    if (!getDataFromSession('pdfUserJwt')) {
      await handleLoginToPdf();
    }

    try {
      const commentData = prepareCommentData(replyText, commentId);
      await postProposalComment(proposal.id, commentData);
      setReplyText('');
      setReplying({ isReplying: false, commentId: null });
      queryClient.invalidateQueries({
        queryKey: ['getActionProposalCommentsKey'],
      });
      addSuccessAlert('Your comment has been recorded successfully');
    } catch (error) {
      console.error('Failed to post reply:', error);
      addWarningAlert('Failed to record comment. Please try again.');
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
      <h2 className="text-xl font-semibold">Comments ({totalComments})</h2>

      {isConnected && (
        <Box className="my-4">
          <Box className="flex items-start space-x-3">
            <CommentForm
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onSubmit={handleCommentSubmit}
            />
          </Box>
        </Box>
      )}

      {!isConnected && (
        <Button
          variant="outlined"
          className="flex items-center gap-1"
          size="medium"
          onClick={() => setLoginModalOpen(true)}
        >
          <ChatBubbleOutline fontSize="small" />
          Login to leave a comment
        </Button>
      )}

      {isCommentsLoading ? (
        <p className="text-center">Loading proposal comments...</p>
      ) : parentComments && parentComments.length > 0 ? (
        <Box className="space-y-6">
          {parentComments.map((comment) => (
            <Box key={comment.id}>
              <Box className=" flex-1 rounded-md  bg-gray-50 p-2 shadow-sm">
                <CommentContent comment={comment} />

                <Box className="mt-2">
                  {isConnected && (
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
                  )}

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
