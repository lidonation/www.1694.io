import React, { useState } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Grow from '@mui/material/Grow';
import { Box, Badge, Divider } from '@mui/material';
import { useGetUserNotificationQuery } from '@/hooks/useGetUserNotificationQuery';
import Typography from '@mui/material/Typography';
import { useDRepContext } from '@/context/drepContext';
import NotificationItem from '../atoms/SingleNotification';
import {
  postMarkNotificationAsRead,
  postMarkNotificationAsUnread,
} from '@/services/requests/postNotificationRequests';

export default function NotificationDrawer() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { signatureId } = useDRepContext();
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const { notifications: allNotifications = [], refetch } =
    useGetUserNotificationQuery({
      recipientId: signatureId,
    });

  const inboxNotifications = allNotifications.filter(
    (n) => !n.isRead && !n.isArchived,
  );

  const handleMarkAsRead = async (id: number) => {
    await postMarkNotificationAsRead({ notificationId: String(id) });
    refetch();
  };
  const handleMarkAsUnread = async (id: number) => {
    await postMarkNotificationAsUnread({ notificationId: String(id) });
    refetch();
  };

  const renderNotifications = (notifications: any[]) => {
    if (notifications.length === 0) {
      return (
        <MenuItem>
          <Box className="mb-4 flex flex-col text-wrap py-2 text-complementary-500">
            {signatureId ? (
              <>
                <Typography variant="subtitle2" className="font-bold">
                  Mempool Clear
                </Typography>
                <Typography variant="body1">You're all caught up.</Typography>
              </>
            ) : (
              <Typography variant="body1">
                Please login to view notifications
              </Typography>
            )}
          </Box>
        </MenuItem>
      );
    }
    return notifications.map((item) => (
      <NotificationItem
        key={item.id}
        notification={item}
        onMarkAsRead={handleMarkAsRead}
        onMarkAsUnread={handleMarkAsUnread}
      />
    ));
  };

  return (
    <div>
      <Badge
        className="cursor-pointer"
        badgeContent={inboxNotifications.length || 0}
        color="warning"
        max={10}
      >
        <img
          src="/svgs/bell.svg"
          id="notification-dropdown"
          aria-controls={open ? 'notification-drawer' : undefined}
          aria-haspopup="true"
          alt="Notifs"
          onClick={handleClick}
          aria-expanded={open ? 'true' : undefined}
        />
      </Badge>
      <Menu
        id="notification-drawer"
        MenuListProps={{
          'aria-labelledby': 'notification-dropdown',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        TransitionComponent={Grow}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{
          '.MuiPaper-root': {
            borderRadius: '0 0 1rem 1rem',
            boxShadow: '1px 2px 11px 0 rgba(0, 18, 61, 0.37)',
            bgcolor: '#F3F5FF',
            maxHeight: '80vh',
            width: '20rem',
            overflow: 'auto',
          },
          '.MuiMenu-list': { padding: 1 },
        }}
      >
        {/* Header */}
        <MenuItem
          disabled
          className="flex w-full items-center justify-between p-1"
        >
          <Typography variant="h6">Notifications</Typography>
        </MenuItem>
        <Divider />
        {renderNotifications(allNotifications)}
      </Menu>
    </div>
  );
}
