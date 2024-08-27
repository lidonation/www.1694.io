import React, { useState } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Grow from '@mui/material/Grow';
import { Box } from '@mui/material';

export default function VoltaireMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const menuItems = [
    {
      label: 'GovTool',
      text: 'Register to become a DRep, delegate voting power to DReps, & review & vote on governance actions.',
      href: '//preview.gov.tools',
      svg: '/svgs/voltaire_nav/notification.svg',
    },
    {
      label: 'Cardano',
      text: 'Learn more about Cardano proof-of-stake blockchain platform.',
      href: '//cardano.org/',
      svg: '/svgs/voltaire_nav/search.svg',
    },
    {
      label: 'Proposal Discussion Forum',
      text: 'Engage in community-driven governance conversations and decision-making.',
      href: '//preview.gov.tools/proposal_discussion',
      svg: '/svgs/voltaire_nav/search.svg',
    },
    {
      label: 'Intersect',
      text: 'Intersect is a member-based organization for the Cardano ecosystem.',
      href: '//www.intersectmbo.org/',
      svg: '/svgs/voltaire_nav/loader.svg',
    },
    {
      label: 'Catalyst Explorer',
      text: 'Explore the world/’s largest decentralized innovation engine for solving real-world challenges.',
      href: '//catalystexplorer.com/',
      svg: '/svgs/voltaire_nav/search.svg',
    },
    {
        label: 'Cardano CIPs',
        text: 'Explore Cardano Improvement Proposals: to change the Cardano ecosystem, processes, or environment.',
        href: '//cips.cardano.org/',
        svg: '/svgs/voltaire_nav/secondary-search.svg',
    },
    {
      label: 'Lido Nation',
      text: 'Blockchain Education in plain English, Kiswahili, and Español.',
      href: '//www.lidonation.com/',
      svg: '/svgs/voltaire_nav/wave.svg',
    },
  ];

  return (
    <div>
      <p
        id="voltaire-dropdown"
        aria-controls={open ? 'voltaire-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        className="cursor-pointer text-gray-800"
      >
        Ecosystem
      </p>

      {!!menuItems && (
        <Menu
          id="voltaire-menu"
          MenuListProps={{
            'aria-labelledby': 'voltaire-dropdown',
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
            },
            '.MuiMenu-list': { padding: 0 },
          }}
        >
          <Box className="relative grid grid-cols-1 sm:grid-cols-2">
            {menuItems.map((item, index) => (
              <a key={index + item.label} href={item?.href} target="_blank">
                <MenuItem
                  onClick={handleClose}
                  sx={{
                    '&:hover': {
                      backgroundColor: '#FFC19D',
                    },
                  }}
                >
                  <Box className="flex max-w-60 gap-4">
                    <img
                      alt={`${item.label} svg`}
                      src={item.svg}
                      className="mt-1 h-12 w-12"
                    />
                    <Box className="flex flex-col text-wrap text-complementary-500">
                      <p className="p-0 text-base font-normal">{item.label}</p>
                      <p className="text-xs font-normal leading-4">
                        {item.text}
                      </p>
                    </Box>
                  </Box>
                </MenuItem>
              </a>
            ))}
            <div className="absolute inset-y-0 left-1/2 hidden w-px bg-destructive-200 sm:block"></div>
          </Box>
        </Menu>
      )}
    </div>
  );
}
