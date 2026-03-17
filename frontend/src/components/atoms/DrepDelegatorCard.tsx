import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ArrowRightIcon from './svgs/ArrowRightIcon';
import { convertHexToCIP129, formatAsCurrency, lovelaceToAda, shortenAddress } from '@/lib';
import { urls } from '@/constants';
import { DelegationData } from '../../../types/api';

const useResponsiveLengths = () => {
  const [addressLength, setAddressLength] = useState(10);
  const [drepLength, setDRepLength] = useState(6);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024 && window.innerWidth < 1280) {
        setDRepLength(3);
        setAddressLength(6);
      } else {
        setDRepLength(6);
        setAddressLength(10);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { addressLength, drepLength };
};

const DrepLink = ({ drep, hasScript, chainId, isTarget, drepLength }: any) => {
  const drepAddress = convertHexToCIP129(hasScript, chainId || drep);

  return isTarget ? (
    <p className="text-sm font-bold uppercase text-primary-300">
      {shortenAddress(drepAddress, drepLength)}
    </p>
  ) : (
    <Link href={`/dreps/${drepAddress}`} className="text-sm font-bold uppercase text-yellow-500">
      {shortenAddress(drepAddress, drepLength)}
    </Link>
  );
};

const StakeAddressLink = ({ stakeAddress, addressLength }: any) => (
  <Link href={stakeAddress ? `/voters/${stakeAddress}` : '#'} className="hover:font-medium">
    <p className="text-base">{shortenAddress(stakeAddress, addressLength)}</p>
  </Link>
);

const TransactionLink = ({ txHash }: any) => (
  <Link href={`${urls.cexplorerUrl}/tx/${txHash}`} target="_blank">
    <div className="flex items-center justify-center gap-2 text-nowrap text-gray-500 hover:cursor-pointer hover:text-gray-800">
      <img src="/svgs/external-link.svg" alt="external link" />
      <p>View Tx</p>
    </div>
  </Link>
);

const DrepDelegatorCard = ({ item }: { item: DelegationData }) => {
  const { addressLength, drepLength } = useResponsiveLengths();
  const {
    total_stake,
    added_power,
    stake_address,
    previous_drep,
    previous_drep_has_script,
    previous_chain_id,
    current_drep,
    current_drep_has_script,
    current_chain_id,
    target_drep,
    tx_hash,
  } = item;

  const formatTotalStake = (stake: string, addedPower: boolean) => {
    const sign = addedPower ? '+' : '-';
    const ada = lovelaceToAda(Number(stake));
    return `${sign}${formatAsCurrency(ada)}`;
  };

  const isPreviousTargetDRep = previous_drep === target_drep;
  const isCurrentTargetDRep = current_drep === target_drep;

  return (
    <div className="flex w-full flex-col gap-2 text-center">
      {Number(total_stake) > 0 && <p className="text-sm font-bold">{formatTotalStake(total_stake, added_power)} ₳</p>}
      <div className="flex flex-col items-center">
        <StakeAddressLink stakeAddress={stake_address} addressLength={addressLength} />
        <p className="text-[10px] text-gray-400 font-medium">
          {new Date((item as any).timestamp).toLocaleString(undefined, { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
      <div className="flex w-full items-center justify-center">
        {previous_drep ? (
          <DrepLink
            drep={previous_drep}
            hasScript={previous_drep_has_script}
            chainId={previous_chain_id}
            isTarget={isPreviousTargetDRep}
            drepLength={drepLength}
          />
        ) : (
          <p className="text-sm font-bold uppercase text-yellow-500">null</p>
        )}
        <ArrowRightIcon color="black" />
        <DrepLink
          drep={current_drep}
          hasScript={current_drep_has_script}
          chainId={current_chain_id}
          isTarget={isCurrentTargetDRep}
          drepLength={drepLength}
        />
      </div>
      <TransactionLink txHash={tx_hash} />
    </div>
  );
};

export default DrepDelegatorCard;
