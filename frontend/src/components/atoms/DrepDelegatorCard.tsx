import React, { useState, useEffect } from 'react';
import { formatAsCurrency, lovelaceToAda, shortenAddress } from '@/lib';
import ArrowRightIcon from './svgs/ArrowRightIcon';

const DrepDelegatorCard = ({ item }: { item: any }) => {
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

  const formatTotalStake = (stake: string, addedPower: boolean) => {
    const sign = addedPower ? '+' : '-';
    const ada = lovelaceToAda(Number(stake));
    return `${sign}${formatAsCurrency(ada)}`;
  };

  return (
    <div className="flex w-full flex-col gap-2 text-center">
      <p className="text-sm font-bold">
        {formatTotalStake(item?.total_stake, item?.added_power)} ₳
      </p>
      <p className="text-base">
        {shortenAddress(item?.stake_address, addressLength)}
      </p>
      <div className="flex w-full items-center justify-center">
        <p className="text-sm font-bold uppercase text-yellow-500">
          {!!item.previous_drep
            ? shortenAddress(item?.previous_drep, drepLength)
            : 'null'}
        </p>
        <ArrowRightIcon color="black" />
        <p className="text-sm font-bold uppercase text-primary-300">
          {shortenAddress(item?.drep, drepLength)}
        </p>
      </div>
    </div>
  );
};

export default DrepDelegatorCard;
