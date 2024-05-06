import React from 'react';

const DRepIntroText = () => {
  return (
    <div className="ml-4 mt-28">
      <div className="text-7xl font-black text-zinc-800">
        <p>A next step</p>
        <p>in Cardano</p>
        <p>governance:</p>
        <p>Voltaire</p>
      </div>
      <div className="text-lg font-light text-gray-800">
        <p>
          We propose a revision of Cardano's on-chain governance system to
          support the new requirements for Voltaire. The existing specialized
          governance support for protocol parameter updates and MIR certificates
          will be removed, and two new fields will be added to normal
          transaction bodies for:
        </p>
        <ol className="ml-10 list-decimal">
          <li>governance actions</li>
          <li>votes</li>
        </ol>
      </div>
    </div>
  );
};

export default DRepIntroText;
