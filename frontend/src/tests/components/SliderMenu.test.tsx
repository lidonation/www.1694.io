import React from 'react';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { usePathname as useNextPathname } from 'next/navigation';
import { SliderMenu } from '@/components/organisms/SliderMenu';

jest.mock('next/navigation', () => ({
  __esModule: true,
  usePathname: jest.fn(),
  useParams: () => ({ locale: 'de' }),
}));

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

jest.mock('@/constants', () => ({
  locales: { variants: ['en', 'de'] },
}));

const mockUsePathname = useNextPathname as jest.MockedFunction<
  typeof useNextPathname
>;

const renderSliderMenu = () =>
  render(
    <NextIntlClientProvider locale="de" messages={{}}>
      <SliderMenu isOpen handleClose={() => {}} />
    </NextIntlClientProvider>,
  );

describe('SliderMenu CIP nav entry', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/de');
  });

  it('renders a locale-qualified CIP link, never a bare /', () => {
    renderSliderMenu();
    const cip = screen.getByTestId('mobile-nav-cip-link');
    expect(cip).toHaveAttribute('href', '/de');
    expect(cip.getAttribute('href')).not.toBe('/');
  });
});
