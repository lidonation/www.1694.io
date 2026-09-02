'use client';
import { ChatBubbleOutline, Send } from '@mui/icons-material';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import React, { memo, useEffect, useRef, useState } from 'react';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { useQueryClient } from 'react-query';
import { deleteDataFromSession, formatNumberTimeToReadable } from '@/lib';
import MarkdownParser from '../atoms/MarkdownParser';
import { postProposalComment } from '@/services/requests/postProposalComment';
import { useGetDRepRegistrationQuery } from '@/hooks/useGetDRepRegistrationQuery';
import { useWallet, ModalType, useModals } from '@/context/globalContext';
import { useGetActionProposalCommentsQuery } from '@/hooks/useGetActionProposalCommentsQuery';
import { usePdfTokenManager } from '@/hooks/usePdfTokenManager';

type CommentData = {
  bd_proposal_id: string;
  comment_text: string;
  drep_id: string;
  comment_parent_id?: string;
};

type ProposalCommentsProps = {
  proposal: any;
};

const CommentForm = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Add your comment here...',
  isLoading,
}: {
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => void;
  onSubmit: () => void;
  placeholder?: string;
  isLoading: boolean;
}) => {
  const MAX_COMMENT_LENGTH = 2500;

  return (
    <Box className="flex-1">
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="focus:border-primary-300 focus:ring-primary-300 w-full resize-none rounded-lg border border-gray-300 p-3 shadow-sm outline-none focus:ring-1"
        rows={3}
        disabled={isLoading}
      />

      <Box className="mt-2 flex items-center justify-end">
        <Typography
          variant="caption"
          className={`${value?.length >= MAX_COMMENT_LENGTH ? 'text-red-600' : ''}`}
          sx={{
            float: 'right',
            mr: 2,
          }}
        >
          {`${value?.length || 0}/${MAX_COMMENT_LENGTH}`}
        </Typography>
        <Button
          variant="outlined"
          size="medium"
          className="flex w-fit justify-between gap-1"
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
        >
          {isLoading && <CircularProgress size={20} sx={{ mr: 1 }} />}
          <Send fontSize="small" />
          <span>Submit</span>
        </Button>
      </Box>
    </Box>
  );
};

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
            <span className="text-primary-300 rounded-full bg-blue-100 px-3 py-1 text-sm">
              Drep
            </span>
          )}
        </Box>
        <span className="text-sm text-gray-500">
          {formatNumberTimeToReadable(comment.attributes.createdAt)}
        </span>
      </Box>

      {registration?.view && (
        <p className="text-primary-300 w-1/2 truncate text-xs">
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
            className="text-primary-300 mt-1 text-sm underline hover:opacity-80"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </Box>
    </>
  );
};

function ProposalComments({ proposal }: ProposalCommentsProps) {
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replying, setReplying] = useState<{
    isReplying: boolean;
    commentId: string | null;
  }>({
    isReplying: false,
    commentId: null,
  });

  const { openModal } = useModals();
  const { ensureAuthenticated } = usePdfTokenManager();
  const { comments, isCommentsLoading } = useGetActionProposalCommentsQuery(
    Number(proposal?.attributes?.master_id),
  );
  const {
    wallet: { isConnected, dRepId, stakeKey, isDRep },
    activeWallet,
    signMessage,
  } = useWallet();
  const { addWarningAlert, addSuccessAlert, addErrorAlert } =
    useGlobalNotifications();
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

  const checkWalletConnection = (): boolean => {
    if (!isConnected) {
      openModal(ModalType.LOGIN);
      return false;
    }
    return true;
  };

  const validateCommentText = (text: string): boolean => {
    if (text.trim() === '') {
      addWarningAlert('Hey, comment text cannot be empty');
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

    setSubmittingComment(true);

    const authStatus = await ensureAuthenticated(
      stakeKey,
      dRepId,
      isDRep,
      activeWallet,
    );

    if (authStatus.userNameModalActive || authStatus.loginFailed) {
      setSubmittingComment(false);
      return;
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
      deleteDataFromSession('pdfUserJwt');
      addWarningAlert('Failed to record comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!checkWalletConnection() || !validateCommentText(replyText)) return;

    setSubmittingReply(true);

    const authStatus = await ensureAuthenticated(
      stakeKey,
      dRepId,
      isDRep,
      activeWallet,
    );

    if (authStatus.userNameModalActive || authStatus.loginFailed) {
      setSubmittingReply(false);
      return;
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
      deleteDataFromSession('pdfUserJwt');
      addWarningAlert('Failed to record comment. Please try again.');
    } finally {
      setSubmittingReply(false);
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
              isLoading={submittingComment}
            />
          </Box>
        </Box>
      )}

      {!isConnected && (
        <Button
          variant="outlined"
          className="flex items-center gap-1"
          size="medium"
          onClick={() => openModal(ModalType.LOGIN)}
        >
          <ChatBubbleOutline fontSize="small" />
          Login to leave a comment
        </Button>
      )}

      {isCommentsLoading ? (
        <p className="animate-pulse text-center">
          Loading proposal comments...
        </p>
      ) : parentComments && parentComments.length > 0 ? (
        <Box className="space-y-6">
          {parentComments.map((comment) => (
            <Box key={comment.id}>
              <Box className="flex-1 rounded-md bg-gray-50 p-2 shadow-sm">
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
                        isLoading={submittingReply}
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

export default memo(ProposalComments);
