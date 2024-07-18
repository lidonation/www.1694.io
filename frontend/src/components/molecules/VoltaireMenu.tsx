import React from 'react';
import MenuDropDown from '../atoms/MenuDropDown';

export default function VoltaireMenu() {
  const menuItems = [
    {
      label: 'Voltaire',
      text: 'Explore the revised on-chain governance system for Cardano’s future.',
      href: '#',
    },
    {
      label: 'Sancho Gov Tool',
      text: 'Delegate your voting power or become a DRep on SanchoNet.',
      href: '#',
    },
    {
      label: 'Lido Nation',
      text: 'Discover the power of decentralization with Lido Nation.',
      href: 'https://www.lidonation.com/',
    },
    {
      label: 'Cardano',
      text: 'Drive global change with Cardano’s innovative blockchain technology.',
      href: '#',
    },
    {
      label: 'Catalyst Explorer',
      text: 'Collaborate and research for groundbreaking advancements in Cardano.',
      href: '#',
    },
    {
      label: 'Cardano CIPs',
      text: 'Contribute to the evolution of Cardano with Cardano Improvement Proposals.',
      href: '#',
    },
    {
      label: 'Proposal Discussion Forum',
      text: 'Engage in discussions, solve doubts, and improve governance.',
      href: '#',
    },
  ];

  return <MenuDropDown title="Voltaire" menuItems={menuItems} />;
}
