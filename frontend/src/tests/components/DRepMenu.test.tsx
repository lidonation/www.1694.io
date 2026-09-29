import React from 'react';
import { render, screen } from '@testing-library/react';
import DRepMenu from '@/components/molecules/DRepMenu';

jest.mock('next/navigation', () => ({
  usePathname: () => '/en/dreps/list',
}));

describe('DRepMenu direct list link (issue 232)', () => {
  test('renders a direct DReps link to the list and no dropdown menu', () => {
    const { container } = render(<DRepMenu />);

    const listLink = screen.getByRole('link', { name: /^dreps$/i });
    expect(listLink).toHaveAttribute(
      'href',
      'https://www.1694.io/en/dreps/list',
    );

    expect(
      container.querySelector('[role="menu"], .MuiMenu-root, .MuiPopover-root'),
    ).not.toBeInTheDocument();
  });
});
