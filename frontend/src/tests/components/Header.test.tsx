import React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/atoms/Header';

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
  useScreenDimension: () => ({ isMobile: false, screenWidth: 1280 }),
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

jest.mock('@/components/molecules/NotificationDrawer', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('@/components/molecules/VoltaireMenu', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('@/components/molecules/DRepMenu', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('@/components/organisms/SliderMenu', () => ({
  __esModule: true,
  SliderMenu: () => <div />,
}));

jest.mock('@/constants', () => ({
  CONFIGURED_NETWORK_NAME: 'mainnet',
}));

describe('Header CIP nav entry', () => {
  it('renders a locale-qualified CIP link, never a bare /', () => {
    render(<Header />);
    const cip = screen.getByTestId('nav-cip-link');
    expect(cip).toHaveAttribute('href', '/de');
    expect(cip.getAttribute('href')).not.toBe('/');
  });

  it('keeps every internal link inside the active locale', () => {
    render(<Header />);
    const links = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href') ?? '');
    const internal = links.filter((href) => href.startsWith('/'));
    expect(internal.length).toBeGreaterThan(0);
    internal.forEach((href) => {
      expect(href.startsWith('/de')).toBe(true);
    });
  });

  it('marks CIP active on the /de locale root', () => {
    render(<Header />);
    expect(screen.getByTestId('nav-cip-link')).toHaveClass('text-orange-500');
  });
});
