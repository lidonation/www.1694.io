import React from 'react';
import Button from '../atoms/Button';

const ConversationsCard = () => {
  const conversations = [
    {
      avatar: '/avatar1.png',
      name: 'Jmagan',
      content: `Is there a documented business case for CIP-1694? If so, could someone please post the link? I would like to get up to speed as quickly as possible.
            If information is still being gathered, such as competitive analysis or benchmark studies to compare the strengths and weaknesses of CPI-1694? with those of Cardano's competitors, then I would like to suggest reviewing the PivX DAO (see also Why and How the PIVX DAO Works, for example)`,
      dateAdded: '2022-11-20T18:10:31Z',
      link: 'http://example.com',
    },
    {
      avatar: '/avatar2.png',
      name: 'Paradoxicalsphere',
      content: `Overall I'm very impressed with and happy with the contents, structure, ideas, and work put into the draft CIP-1694. Personally I was considering some similar ideas for governance, however because this isn't my field of expertise my ideas were not nearly as comprehensive.
            One feature of this CIP that I really like is that there is no mandatory hierarchical structure for how payouts must be made. This leaves funding the future community structure of the (members based organization, professional society, Catalyst startup incubator, whatever outcome of the Cardano constitutional process) entirely flexible. This flexibility is wise and is absolutely necessary for financial (fund/defund) checks-and-balances of future Cardano (organizations/ societies/ companies/ developers/ contractors/ ect).`,
      dateAdded: '2022-11-20T18:10:31Z',
      link: 'http://example.com',
    },
    {
      avatar: '/avatar3.png',
      name: 'Kronoshus',
      content: `One feature of this CIP that I really like is that there is no mandatory hierarchical structure for how payouts must be made. This leaves funding the future community structure of the (members based organization, professional society, Catalyst startup incubator, whatever outcome of the Cardano constitutional process) entirely flexible. This flexibility is wise and is absolutely necessary for financial (fund/defund) checks-and-balances of future Cardano (organizations/ societies/ companies/ developers/ contractors/ ect).`,
      dateAdded: '2022-11-20T18:10:31Z',
      link: 'http://example.com',
    },
  ];
  return (
    <div className="container py-20">
      <p className="text-6xl font-bold text-zinc-800">Conversations</p>
      <div className="flex flex-row gap-10 p-8">
        {conversations.map((item) => (
          <div key={item.name} className="flex flex-col gap-3">
            <div className="flex flex-row items-center justify-start gap-5">
              <img src={item.avatar} alt={item.name} />
              <p className="text-2xl font-bold">{item.name}</p>
            </div>
            <p>{item.content}</p>
            <div>
              <p>{item.dateAdded}</p>
              <a href={item.link} className="font-semibold underline">
                View on Github
              </a>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-row items-center justify-center">
        <Button>Join The Conversation on Github</Button>
      </div>
    </div>
  );
};

export default ConversationsCard;
