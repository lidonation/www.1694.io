import React from 'react';
import { render, screen } from '@testing-library/react';
import { SliderMenu } from '@/components/organisms/SliderMenu';

jest.mock('@/navigation', () => {
  const React = require('react');
  const NextLink = require('next/link').default;
  return {
    __esModule: true,
    Link: React.forwardRef(({ href, ...rest }, ref) => (
      <NextLink
        ref={ref}
        href={href === '/' ? '/de' : `/de${href}`}
        {...rest}
      />
    )),
    usePathname: () => '/',
  };
});

jest.mock('@/hooks', () => ({
  useScreenDimension: () => ({ isMobile: true, screenWidth: 390 }),
}));

jest.mock('@/services/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  },
}));

jest.mock('@/context/globalContext', () => ({
  __esModule: true,
  useWallet: () => ({
    wallet: { isConnected: false, isConnecting: false },
    currentLocale: 'de',
  }),
  useModals: () => ({ openModal: jest.fn() }),
  ModalType: { LOGIN: 'LOGIN' },
}));

jest.mock('@/components/molecules', () => ({
  __esModule: true,
  WalletInfoCard: () => <div />,
}));

jest.mock(
  '@/components/molecules/WalletInfoCard',
  () => ({
    __esModule: true,
    WalletInfoCard: () => <div />,
  }),
  { virtual: true },
);

jest.mock('@/components/molecules/WalletConnectButton', () => ({
  __esModule: true,
  default: () => <button>Connect Wallet</button>,
}));

jest.mock('@/components/molecules/VoltaireMenu', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('@/components/molecules/DRepMenu', () => ({
  __esModule: true,
  default: () => <div />,
}));

describe('SliderMenu CIP nav entry', () => {
  it('renders a locale-qualified CIP link, never a bare /', () => {
    render(<SliderMenu isOpen handleClose={() => {}} />);
    const cip = screen.getByTestId('mobile-nav-cip-link');
    expect(cip).toHaveAttribute('href', '/de');
    expect(cip.getAttribute('href')).not.toBe('/');
  });
});
