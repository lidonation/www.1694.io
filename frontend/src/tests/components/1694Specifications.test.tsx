import React from 'react';
import { render, within } from '@testing-library/react';
import CIPSpecifications from '@/components/1694.io/1694Specifications';

describe('CIP specifications', () => {
  it('describes the ratified Constitution without the obsolete proposal framing', () => {
    const { container } = render(<CIPSpecifications />);

    const constitution = container.querySelector('#the-cardano-constitution');
    expect(constitution).not.toBeNull();
    const constitutionText = within(constitution as HTMLElement).getByText(
      /The Cardano Constitution defines/,
    );
    expect(constitutionText).toHaveTextContent(
      'ratified on-chain in February 2025',
    );
    expect(constitutionText).toHaveTextContent('amended in January 2026');

    const guardrails = container.querySelector('#guardrails-script');
    expect(guardrails).not.toBeNull();
    expect(guardrails).toHaveTextContent(
      'optional guardrails script can also enforce on-chain constraints',
    );

    expect(container).not.toHaveTextContent(
      /informational document|informal, off-chain document|not yet defined/i,
    );
  });
});
