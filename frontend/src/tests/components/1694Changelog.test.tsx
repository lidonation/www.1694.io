import React from 'react';
import { render, screen } from '@testing-library/react';
import CIPChangelog from '@/components/1694.io/1694Changelog';

describe('CIP changelog', () => {
  it('ends with the latest governance milestones', () => {
    const { container } = render(<CIPChangelog />);

    const sections = Array.from(container.querySelectorAll('section'));
    expect(sections.at(-1)).toHaveTextContent(
      'Governance implementation (2024-2026)',
    );
    expect(screen.getByText(/Chang hard fork in September 2024/)).toBeVisible();
    expect(screen.getByText(/Plomin hard fork in January 2025/)).toBeVisible();
    expect(screen.getByText(/amended in January 2026/)).toBeVisible();
  });
});
