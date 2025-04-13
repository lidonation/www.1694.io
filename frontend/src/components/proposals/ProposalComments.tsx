import {
  AccountCircle,
  ChatBubbleOutline,
  MoreHoriz,
  Send,
  ThumbUp,
} from '@mui/icons-material';
import { Box } from '@mui/material';
import React, { useState } from 'react';
import Button from '../atoms/Button';

type ProposalCommentsProps = {
  proposal: any;
  comments: any;
  isCommentsLoading?: boolean;
};
function ProposalComments({
  proposal,
  comments,
  isCommentsLoading,
}: ProposalCommentsProps) {
  const [commentText, setCommentText] = useState('');

  const TotalComments = proposal?.attributes?.prop_comments_number || 0;

  const parentComments = comments?.data.filter(
    (comment) => comment.attributes.comment_parent_id === null,
  );

  const getChildComments = (parentId) => {
    return comments?.data.filter(
      (comment) => comment.attributes.comment_parent_id === parentId.toString(),
    );
  };

  const handleCommentSubmit = () => {
    if (commentText.trim() !== '') {
      alert(`Comment submitted: ${commentText}`);
      setCommentText('');
    }
  };

  return (
    <Box id="comments" className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Comments ({TotalComments})</h2>

      <Box className="mb-4">
        <Box className="flex items-start space-x-3">
          <Box className="flex-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add your comment..."
              className="w-full resize-none rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <Box className="mt-2 flex justify-end">
              <Button
                size="medium"
                className="flex w-fit justify-between gap-1"
                handleClick={handleCommentSubmit}
              >
                <Send fontSize="small" />
                <span>Submit</span>
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box className="space-y-4">
        {parentComments?.map((comment) => (
          <Box key={comment.id} className="rounded-md bg-gray-100 p-4 pb-6">
            <Box className="mb-1 flex-1">
              <Box className="flex items-center justify-between">
                <Box className="mb-1 flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">
                    @{comment.attributes.user_govtool_username}
                  </h3>
                  {comment?.attributes?.drep_id && (
                    <span className="rounded-full bg-gray-300 px-2 py-1 text-sm">
                      Drep
                    </span>
                  )}
                </Box>
                <span className="text-sm text-gray-500">
                  {new Date(comment.attributes.createdAt).toLocaleDateString(
                    'en-GB',
                  )}
                </span>
              </Box>
              <p className="w-1/2 truncate text-sm text-primary-300 md:w-1/3">
                {comment?.attributes?.drep_id}
              </p>
              <p className="mt-2 text-gray-700">
                {comment.attributes.comment_text}
              </p>
              <Box className="mt-2">
                <Button className="flex items-center gap-1" size="medium">
                  <ChatBubbleOutline fontSize="small" />
                  Reply
                </Button>
              </Box>
            </Box>
            <Box className="mt-4 space-y-4">
              {getChildComments(comment.id)?.map((childComment) => (
                <Box key={childComment.id} className="ml-12">
                  <Box className="flex-1">
                    <Box className="flex items-center justify-between">
                      <Box className="mb-1 flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          @{childComment.attributes.user_govtool_username}
                        </h3>
                        {childComment?.attributes?.drep_id && (
                          <span className="rounded-full bg-gray-300 px-2 py-1 text-sm">
                            Drep
                          </span>
                        )}
                      </Box>
                      <span className="text-sm text-gray-500">
                        {new Date(
                          childComment.attributes.createdAt,
                        ).toLocaleDateString('en-GB')}
                      </span>
                    </Box>
                    <p className="w-1/2 truncate text-sm text-primary-300 md:w-1/3">
                      {childComment?.attributes?.drep_id}
                    </p>
                    <p className="mt-2 text-gray-700">
                      {childComment.attributes.comment_text}
                    </p>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default ProposalComments;
