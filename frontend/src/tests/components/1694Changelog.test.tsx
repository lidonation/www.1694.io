import React from 'react';
import { render, screen } from '@testing-library/react';
import CIPChangelog from '@/components/1694.io/1694Changelog';

describe('CIP changelog', () => {
  it('includes the newest governance update after the May 2024 entry', () => {
    render(<CIPChangelog />);

    const headings = screen.getAllByText(
      /^(May 2024|Governance implementation \(2024-2026\))$/,
    );
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent('May 2024');
    expect(headings[1]).toHaveTextContent(
      'Governance implementation (2024-2026)',
    );
    expect(
      screen.getByText(/Plomin hard fork in January 2025/),
    ).toBeInTheDocument();
    expect(screen.getByText(/amended in January 2026/)).toBeInTheDocument();
  });
});
