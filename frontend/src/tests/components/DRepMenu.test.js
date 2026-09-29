import React from 'react';
import { render, screen } from '@testing-library/react';
import DRepMenu from '@/components/molecules/DRepMenu';

let mockPathname = '/dreps/list';

jest.mock('@/navigation', () => {
  const React = require('react');
  const NextLink = require('next/link').default;
  const MockLink = React.forwardRef(({ href, ...rest }, ref) => (
    <NextLink ref={ref} href={'/de' + href} {...rest} />
  ));
  MockLink.displayName = 'MockLink';

  return {
    __esModule: true,
    Link: MockLink,
    usePathname: () => mockPathname,
  };
});

describe('DRepMenu direct list link (issue 232)', () => {
  beforeEach(() => {
    mockPathname = '/dreps/list';
  });

  test('renders one locale-qualified DReps link to the list, no dropdown', () => {
    const { container } = render(<DRepMenu />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent(/^DReps$/);
    expect(links[0]).toHaveAttribute('href', '/de/dreps/list');

    expect(
      container.querySelector('[role="menu"], .MuiMenu-root, .MuiPopover-root'),
    ).not.toBeInTheDocument();
  });

  test('marks the entry active on a DRep route', () => {
    render(<DRepMenu />);
    expect(screen.getByTestId('nav-dreps-link')).toHaveClass('text-orange-500');
  });

  test('does not mark a lookalike route active', () => {
    mockPathname = '/dreps-archive';

    render(<DRepMenu />);

    expect(screen.getByTestId('nav-dreps-link')).toHaveClass('text-gray-800');
  });
});
