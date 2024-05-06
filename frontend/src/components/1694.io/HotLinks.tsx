import React from 'react';

interface HotLinksProps {
  seethrough?: boolean;
}
const HotLinks = ({ seethrough }: HotLinksProps) => {
  const links = [
    {
      title: 'The Cardano Constitution',
      link: 'http://example.com',
    },
    {
      title: 'The constitutional committee',
      link: 'http://example.com',
    },
    {
      title: 'State of no-confidence',
      link: 'http://example.com',
    },
    {
      title: 'Replacing the constitutional committee',
      link: 'http://example.com',
    },
    {
      title: 'Size of the constitutional committee ',
      link: 'http://example.com',
    },
    {
      title: 'Term limits',
      link: 'http://example.com',
    },
    {
      title: 'Delegated representatives (DReps)',
      link: 'http://example.com',
    },
    {
      title: 'Pre-defined DReps',
      link: 'http://example.com',
    },
    {
      title: 'Registered DReps',
      link: 'http://example.com',
    },
    {
      title: 'New stake distribution for DReps',
      link: 'http://example.com',
    },
    {
      title: 'DRep incentives',
      link: 'http://example.com',
    },
    {
      title: 'Governance actions',
      link: 'http://example.com',
    },
    {
      title: 'Ratification',
      link: 'http://example.com',
    },
    {
      title: 'Requirements',
      link: 'http://example.com',
    },
    {
      title: 'Restrictions',
      link: 'http://example.com',
    },
    {
      title: 'Enactment',
      link: 'http://example.com',
    },
    {
      title: 'Lifecycle',
      link: 'http://example.com',
    },
    {
      title: 'Content',
      link: 'http://example.com',
    },
    {
      title: 'Protocol parameter groups',
      link: 'http://example.com',
    },
    {
      title: 'Votes',
      link: 'http://example.com',
    },
    {
      title: 'Governance state',
      link: 'http://example.com',
    },
    {
      title: 'Changes to the stake snapshot',
      link: 'http://example.com',
    },
    {
      title: 'Definitions relating to voting stake',
      link: 'http://example.com',
    },
  ];
  return (
    <div className={`my-5 bg-white ${seethrough ? 'bg-opacity-50' : ''}`}>
      <div
        className={`flex w-full flex-row flex-wrap items-center justify-center gap-3 p-8`}
      >
        {links.map((item) => (
          <div
            key={item.title}
            className="flex w-fit items-center justify-center rounded-2xl bg-blue-100 px-2 py-1"
          >
            <p className="text-nowrap text-sm text-black">{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotLinks;
