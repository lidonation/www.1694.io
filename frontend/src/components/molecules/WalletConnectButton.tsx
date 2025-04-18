
import React from 'react';
import Button from '../atoms/Button';
import { useDRepContext } from '@/context/drepContext';
import { useWallet } from '@/context/walletContext';

const WalletConnectButton = ({ test_name }) => {
  const { setLoginModalOpen } = useDRepContext();
  const { wallet } = useWallet();
  
  return (
    <Button
      handleClick={() => setLoginModalOpen(true)} 
      data-testid={`${test_name}-connect-wallet-button`}
      size='small'
    >
      <p>
        {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </p>
    </Button>
  );
};

export default WalletConnectButton;