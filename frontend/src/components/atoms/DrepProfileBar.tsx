'use client';
import { useScreenDimension } from '@/hooks';
import { Box, Grid, IconButton, SwipeableDrawer } from '@mui/material';
import React, { useState } from 'react';
import { Background } from './Background';
import Link from 'next/link';
interface SliderMenuProps {
  options: { name: string; path: string }[];
  handleClose: () => void;
}

const DRAWER_PADDING = 2;
// 8 is number of multiple in Material UI 2 is left and right side
const CALCULATED_DRAWER_PADDING = DRAWER_PADDING * 8 * 2;
const DRepProfileBar = () => {
  const { isMobile, screenWidth } = useScreenDimension();
  const [active, setIsActive] = useState(0);
  const getCurrentYear = () => {
    return new Date().getFullYear();
  };
  const utilityLinks = [
    {
      icon: '/user-circle-filled-orange',
      title: 'Profile',
      link: '#',
    },
    {
      icon: '/file-stack',
      title: 'Notes',
      link: '#',
    },
    {
      icon: '/governance-actions',
      title: 'Gov Tools',
      link: '#',
    },
    {
      icon: '/guides',
      title: 'Guides',
      link: '#',
    },
    {
      icon: '/message-question',
      title: 'FAQs',
      link: '#',
    },
  ];
  return (
    <div className="h-screen max-w-60 bg-white">
      {isMobile ? (
        <>
          <SwipeableDrawer
            anchor="right"
            onClose={() => {}}
            onOpen={() => {}}
            open={false}
          >
            <Background>
              <Box
                sx={{
                  flex: 1,
                  px: DRAWER_PADDING,
                  pb: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flex: 1,
                      justifyContent: 'space-between',
                      py: 3,
                      width: screenWidth - CALCULATED_DRAWER_PADDING,
                    }}
                  >
                    <IconButton
                      data-testid="close-drawer-button"
                      onClick={() => {}}
                      sx={{ padding: 0 }}
                    >
                      <img src={'/close.svg'} />
                    </IconButton>
                  </Box>
                  <Grid
                    container
                    direction="column"
                    rowGap={4}
                    mt={6}
                    className="text-center"
                  >
                    <Grid item>{/* Where the logo will be */}</Grid>
                    {utilityLinks.map((link, index) => (
                      <Grid item key={index + link.title}>
                        <Link
                          href={link.link}
                          className="flex flex-row items-center justify-center gap-3"
                        >
                          <img src={link.icon} />
                          <p>{link.title}</p>
                        </Link>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            </Background>
          </SwipeableDrawer>
        </>
      ) : (
        <div className="flex h-full w-full flex-col justify-between px-5 py-3 ">
          <div className="lg:gap-30 flex flex-col gap-20">
            <div className="flex w-2/3 shrink-0 items-center justify-center py-5">
              <img src="/sancho1694.svg" alt="Logo" />
            </div>
            <div className="flex flex-col gap-4">
              {/* something to indicate active link form */}
              {utilityLinks.map((link, index) => (
                <Link
                  href={link.link}
                  key={index + link.title}
                  className={`${active === index && 'bg-blue-100'} ml-5 flex flex-row items-center justify-start gap-3 rounded-3xl px-3 py-3 hover:bg-blue-50`}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsActive(index);
                  }}
                >
                  <img
                    src={`${active === index ? link.icon + '-active' : link.icon}.svg`}
                  />
                  <p>{link.title}</p>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex max-w-fit flex-col gap-2">
            <div className="flex flex-row items-center gap-3 pl-5">
              <img src="/governance-actions.svg" alt="Help" />
              <p>Help</p>
            </div>
            <p>&copy; {getCurrentYear()} Voltaire Gov Tool</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DRepProfileBar;
