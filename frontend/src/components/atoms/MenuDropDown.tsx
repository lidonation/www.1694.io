'use client';
import React, { useEffect, useState } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Grow from '@mui/material/Grow';
import { Box } from '@mui/material';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

type MenuDropDownProps = {
  title: string;
  menuItems: {
    label: string;
    text: string;
    to?: string;
    href?: string;
  }[];
};

export default function MenuDropDown({ title, menuItems }: MenuDropDownProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();
  const [activeLink, setActiveLink] = useState<string | null>(null);

  useEffect(() => {
    setActiveLink(pathname);
  }, [pathname]);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      {!!title && (
        <p
          id="voltaire-dropdown"
          aria-controls={open ? 'voltaire-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
          className={`cursor-pointer transition-colors ${
            !!activeLink && activeLink.includes(title.toLocaleLowerCase())
              ? 'text-orange-500'
              : 'text-gray-800'
          }`}
        >
          {title}
        </p>
      )}
      {!!menuItems && (
        <Menu
          id="voltaire-menu"
          disableAutoFocusItem
          disableEnforceFocus
          MenuListProps={{
            'aria-labelledby': 'voltaire-dropdown',
            autoFocusItem: false,
          }}
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          TransitionComponent={Grow}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
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
              mt: 1,
            },
            '.MuiMenu-list': { padding: 0 },
          }}
        >
          <Box>
            {menuItems.map((item, index) => {
              const ItemContent = (
                <MenuItem
                  onClick={handleClose}
                  sx={{
                    '&:hover': {
                      backgroundColor: '#FFC19D',
                    },
                  }}
                >
                  <Box className="text-complementary-500 flex max-w-64 flex-col items-start text-wrap">
                    <p className="text-base font-normal">{item.label}</p>
                    <p className="text-xs leading-4 font-normal">{item.text}</p>
                  </Box>
                </MenuItem>
              );

              return (
                <div key={index + item.label}>
                  {item.to ? (
                    <Link href={item.to}>{ItemContent}</Link>
                  ) : (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {ItemContent}
                    </a>
                  )}
                </div>
              );
            })}
          </Box>
        </Menu>
      )}
    </div>
  );
}
