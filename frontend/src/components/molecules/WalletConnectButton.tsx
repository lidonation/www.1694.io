import React from 'react';
import Button from '../atoms/Button';
interface WalletConnectButtonProps {
  test_name: string;
  handleConnect: (event: React.MouseEvent<HTMLButtonElement>) => void;
  isConnecting: boolean;
}

const WalletConnectButton = ({
  test_name,
  handleConnect,
  isConnecting,
}: WalletConnectButtonProps) => {
  return (
    <Button
      handleClick={handleConnect}
      data-testid={`${test_name}-connect-wallet-button`}
      size="small"
    >
      <p>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</p>
    </Button>
  );
};

export default WalletConnectButton;
