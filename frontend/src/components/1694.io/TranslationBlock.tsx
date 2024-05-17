import React from 'react';
import Link from 'next/link';
import Button from '../atoms/Button';
import BecomeADRepButton from './BecomeADRepButton';
import HoverChip from '../atoms/HoverChip';

const TranslationBlock = () => {
  const flags = [
    {
      link: '#',
      icon: '/flags/GR.png',
    },
    {
      link: '#',
      icon: '/flags/SA.png',
    },
    {
      link: '#',
      icon: '/flags/DE.png',
    },
    {
      link: '#',
      icon: '/flags/FR.png',
    },
    {
      link: '#',
      icon: '/flags/NL.png',
    },
    {
      link: '#',
      icon: '/flags/JP.png',
    },
    {
      link: '#',
      icon: '/flags/KR.png',
    },
    {
      link: '#',
      icon: '/flags/ID.png',
    },
    {
      link: '#',
      icon: '/flags/PT.png',
    },
    {
      link: '#',
      icon: '/flags/ES.png',
    },
    {
      link: '#',
      icon: '/flags/KE.png',
    },
  ];
  return (
    <div className='bg-white bg-opacity-50'>
      <div className="base_container flex flex-row items-center justify-start pb-3">
        <div className="mr-10 flex flex-row items-center justify-center gap-2">
          <p>Translation</p>
          <HoverChip
            icon={'/info-circle.svg'}
            text={
              'Translations done through rewarded bounties at the Catalyst Swarm Bounty Board. Donations to Catalyst Swarm'
            }
            position="bottom"
            textToCopy="Addr1qxhxg0mwzahfv8x4nr5s9zmffssxueqsnxxv282kz2c30nykg8fw8x99crukwyc7yftwfgxmhsu2xx0n8elfvj7mljlqm45kgs"
          />
        </div>
        <div className="flex flex-row gap-5">
          {flags.map((flag) => (
            <div key={flag.icon} className="cursor-pointer">
              <img src={flag.icon} alt="Flag" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TranslationBlock;
