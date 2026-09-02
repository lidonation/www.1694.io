'use client';
import React, { useState } from 'react';
import { Typography, Box, IconButton, Checkbox } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '../../../types/commonTypes';
import * as marked from 'marked';
import HoverChip from './HoverChip';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onMarkAsUnread: (id: number) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: 'read' | 'unread') => {
    handleCloseMenu();
    switch (action) {
      case 'read':
        onMarkAsRead(notification.id);
        break;
      case 'unread':
        onMarkAsUnread(notification.id);
        break;
    }
  };

  return (
    <Box
      className="my-0.5 flex items-center justify-between p-2"
      sx={{
        opacity: notification.isRead ? '50%' : '100%',
      }}
    >
      <Box className="mr-2 flex flex-grow flex-col">
        <Typography variant="subtitle2" className="font-bold">
          {notification.title}
        </Typography>
        <p
          className="parsed-content text-xs text-gray-600"
          dangerouslySetInnerHTML={{
            __html: marked.parse(notification.message),
          }}
        ></p>
        <Typography variant="caption" className="text-gray-400">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </Typography>
      </Box>
      <IconButton
        className="self-start"
        onClick={() => handleAction(notification.isRead ? 'unread' : 'read')}
      >
        <HoverChip
          text={notification.isRead ? 'Mark as unread' : 'Mark as read'}
          position="bottom"
        >
          <Checkbox checked={notification.isRead} />
        </HoverChip>
      </IconButton>
    </Box>
  );
};

export default NotificationItem;
