import { useCardano } from '@/context/walletContext';
import React from 'react';
import WalletConnectButton from './WalletConnectButton';

const BecomeADrepCard = () => {
  const { isEnabled } = useCardano();
  return (
    <div className="mb-10 grid grid-cols-2 text-zinc-100">
      <div className="col-span-1 flex-col items-center justify-center">
        <div className="mb-3 text-5xl font-black">
          <p>How can I</p>
          <p> become a DRep</p>
        </div>

        <p>
          In order to participate in governance, a stake credential must be
          delegated to a DRep. Ada holders will generally delegate their voting
          rights to a registered DRep that will vote on their behalf.
        </p>

        <ul className="mb-2 ml-4 list-disc">
          <li>You might need this</li>
          <li>also this</li>
          <li>and this</li>
          <li>maybe this</li>
          <li>and definitely this</li>
        </ul>
        <div>{!isEnabled && <WalletConnectButton test_name={'within'} />}</div>
      </div>

      <div className="col-span-1 mr-8 flex items-center justify-end sm:mr-3 md:mr-6">
        <img
          src="/img/becomeDrepImg.png"
          alt="Handholdingcardanocoin"
          width={'210px'}
        />
      </div>
    </div>
  );
};

export default BecomeADrepCard;
