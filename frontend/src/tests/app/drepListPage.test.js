import { act, render, screen } from '@testing-library/react';
import DRepListPage from '@/app/[locale]/dreps/list/page';
import React from 'react';

jest.mock('@/navigation', () => {
  const React = require('react');
  const NextLink = require('next/link').default;
  const MockLink = React.forwardRef(({ href, ...rest }, ref) => (
    <NextLink ref={ref} href={`/de${href}`} {...rest} />
  ));
  MockLink.displayName = 'MockLink';

  return {
    __esModule: true,
    Link: MockLink,
    usePathname: () => '/dreps/list',
    useRouter: () => ({ replace: jest.fn() }),
  };
});

jest.mock('next/navigation', () => ({
  usePathname: () => '/de/dreps/list',
  useSearchParams: () => ({ toString: () => '' }),
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock('@/components/atoms/DRepsMetrics', () => ({
  __esModule: true,
  default: () => <div data-testid="dreps-metrics" />,
}));

jest.mock('@/components/atoms/DRepTableSearch', () => ({
  __esModule: true,
  default: () => <div data-testid="drep-table-search" />,
}));

jest.mock('@/components/atoms/DRepFilterChips', () => ({
  __esModule: true,
  default: () => <div data-testid="drep-filter-chips" />,
}));

jest.mock('@/components/molecules/DRepsTable', () => ({
  __esModule: true,
  default: () => <div data-testid="dreps-table" />,
}));

jest.mock('@/components/molecules/BreadCrumbs', () => ({
  __esModule: true,
  default: () => <div data-testid="breadcrumbs" />,
}));

describe('DRep list page Learn about DReps CTA (issue 232)', () => {
  test('heading row carries a Learn about DReps button linking to the overview', async () => {
    const searchParams = Promise.resolve({});
    let container;
    await act(async () => {
      ({ container } = render(<DRepListPage searchParams={searchParams} />));
    });

    const cta = screen.getByRole('link', { name: /learn about dreps/i });
    expect(cta).toHaveAttribute('href', '/de/dreps');
    expect(cta).toHaveClass('MuiButton-root');

    const heading = container.querySelector('h2');
    expect(heading).toHaveTextContent('Available DReps');
    const row = heading.closest('section');
    expect(row).toContainElement(cta);
  });
});
