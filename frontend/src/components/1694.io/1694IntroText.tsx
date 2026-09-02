import React from 'react';
import { TermTooltip } from '../atoms/term-tooltip';

const CIPIntroText = () => {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-start justify-start gap-20">
      <div className="text-start text-4xl font-black text-zinc-800 lg:text-6xl">
        <p>CIP 1694 - An On-Chain</p>
        <p>Decentralized Governance</p>
        <p>
          Mechanism for <TermTooltip term="Voltaire" />
        </p>
      </div>
      <div className="text-lg font-light text-gray-800 lg:pr-40">
        <hr className="border border-black opacity-50" />
        <p>
          We propose a revision of Cardano's on-chain governance system to
          support the new requirements for Voltaire. The existing specialized
          governance support for protocol parameter updates and MIR certificates
          will be removed, and two new fields will be added to normal
          transaction bodies :
          <span className="font-bold">
            {' '}
            <TermTooltip term="Governance Action">
              governance actions
            </TermTooltip>
            , <TermTooltip term="Ratification">votes</TermTooltip>.
          </span>
        </p>
      </div>
    </div>
  );
};

export default CIPIntroText;
