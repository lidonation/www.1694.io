import React from 'react';
import { render, within } from '@testing-library/react';
import CIPSpecifications from '@/components/1694.io/1694Specifications';

describe('CIP specifications', () => {
  it('describes the ratified Constitution without the obsolete proposal framing', () => {
    const { container } = render(<CIPSpecifications />);

    const constitution = container.querySelector('#the-cardano-constitution');
    expect(constitution).not.toBeNull();
    const text = within(constitution as HTMLElement).getByText(
      /The Cardano Constitution defines/,
    );
    expect(text).toHaveTextContent('ratified on-chain in February 2025');
    expect(text).toHaveTextContent('amended in January 2026');
    expect(text).not.toHaveTextContent(
      /informational document|informal, off-chain document|not yet defined/i,
    );
  });
});
