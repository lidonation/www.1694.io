import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { usePathname as useNextPathname } from 'next/navigation';
import MenuDropDown from '@/components/atoms/MenuDropDown';

jest.mock('next/navigation', () => ({
  __esModule: true,
  usePathname: jest.fn(),
  useParams: () => ({ locale: 'de' }),
}));

jest.mock('@/constants', () => ({
  locales: { variants: ['en', 'de'] },
}));

const mockUsePathname = useNextPathname as jest.MockedFunction<
  typeof useNextPathname
>;

describe('MenuDropDown navigation', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/de');
  });

  it('localizes internal destinations and leaves external destinations unchanged', () => {
    render(
      <NextIntlClientProvider locale="de" messages={{}}>
        <MenuDropDown
          title="DReps"
          menuItems={[
            { label: 'Browse DReps', text: 'Internal', to: '/dreps' },
            {
              label: 'External docs',
              text: 'External',
              href: 'https://example.com/docs',
            },
          ]}
        />
      </NextIntlClientProvider>,
    );

    fireEvent.click(screen.getByText('DReps'));

    expect(screen.getByText('Browse DReps').closest('a')).toHaveAttribute(
      'href',
      '/de/dreps',
    );
    expect(screen.getByText('External docs').closest('a')).toHaveAttribute(
      'href',
      'https://example.com/docs',
    );
  });
});
