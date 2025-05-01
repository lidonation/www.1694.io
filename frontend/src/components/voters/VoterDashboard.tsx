import React from 'react';
import VoterWalletStats from './VoterWalletStats';
import VoterDelegationHistory from './VoterDelegationHistory';
import { useParams } from 'next/navigation';
import { useVoterDataByIdentityQuery } from '@/hooks/useGetVoterDataByIdentityQuery';
import { Address } from '@emurgo/cardano-serialization-lib-asmjs';
import { convertDrepPhraseToCIP105 } from '@/lib';

const convertAddressToBech32 = (address: string) => {
  if (address.includes('addr') || address.includes('stake')) {
    return address;
  } else if (address.includes('drep')) {
    return convertDrepPhraseToCIP105(address);
  } else
    return Address.from_bytes(Buffer.from(address, 'hex') as any).to_bech32();
};

const VoterDashboard = () => {
  const { voterId } = useParams();
  const { voterData, isVoterDataLoading } = useVoterDataByIdentityQuery(
    convertAddressToBech32(voterId as string),
  );
  return (
    <div className="flex min-h-screen w-full flex-col gap-3 bg-white py-4">
      <VoterWalletStats
        voterData={voterData}
        isVoterDataLoading={isVoterDataLoading}
      />
      <hr className="w-[95%] self-center border-t border-green-400" />
      <VoterDelegationHistory
        voterData={voterData}
        isVoterDataLoading={isVoterDataLoading}
      />
    </div>
  );
};

export default VoterDashboard;
