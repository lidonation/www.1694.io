import React from 'react';
import { render, screen, within } from '@testing-library/react';
import DRepsTable from '@/components/molecules/DRepsTable';

const mockDReps = {
  data: [
    {
      view: 'drep_always_no_confidence',
      type: 'voting_option',
      active: true,
      retired: false,
      voting_power: 131769490.12,
      live_stake: 131769490.12,
      delegation_vote_count: 206967,
      governance_vote_count: 0,
      given_name: null,
    },
    {
      view: 'drep1ytfwpmt2fvdnyvlswyjyggpf8unnamedexample0000000000',
      type: 'drep',
      active: true,
      retired: false,
      voting_power: 1000,
      live_stake: 1100,
      delegation_vote_count: 12,
      governance_vote_count: 0,
      given_name: null,
    },
    {
      view: 'drep1y2200we9c904un36tzaearntzzl63snffuul9qsk0te4utqfkke0w',
      type: 'drep',
      active: true,
      retired: false,
      voting_power: 500,
      live_stake: 500,
      delegation_vote_count: 4,
      governance_vote_count: 155,
      given_name: 'YUTA',
    },
  ],
  currentPage: 1,
  totalPages: 1,
  totalItems: 3,
};

jest.mock('@/hooks/useGetDRepsQuery', () => ({
  useGetDRepsQuery: () => ({
    DReps: mockDReps,
    isDRepsLoading: false,
    isError: false,
  }),
}));
jest.mock('@/hooks', () => ({
  useScreenDimension: () => ({ isMobile: false }),
}));
jest.mock('@/context/globalNotificationContext', () => ({
  useGlobalNotifications: () => ({ addSuccessAlert: jest.fn() }),
}));
jest.mock('@/lib/lastDrepTabNavigation', () => ({
  useDRepNavigator: () => jest.fn(),
}));
jest.mock('@/components/molecules/DRepLogo', () => ({
  __esModule: true,
  default: () => <span data-testid="drep-logo" />,
}));
jest.mock('@/components/molecules/Pagination', () => ({
  __esModule: true,
  default: () => <div data-testid="pagination" />,
}));

const row = (view: string) => screen.getByTestId(`drep-id-${view}`);

describe('DRepsTable listing polish (cardano.org review)', () => {
  test('voting option shows its readable name, no truncated ID and no vote count', () => {
    render(<DRepsTable />);
    const option = row('drep_always_no_confidence');
    expect(
      within(option).getByText('Always No Confidence'),
    ).toBeInTheDocument();
    expect(within(option).getByText('Voting Option')).toBeInTheDocument();
    expect(option.textContent).not.toMatch(/\.\.\.\.\.\.\./);
    expect(option.textContent).not.toMatch(/Votes/);
    expect(option.textContent).not.toMatch(/Active0|^0$/);
    // A bare "0" must not leak from a falsy vote count.
    const cell = option.querySelector('td');
    expect(cell?.textContent?.trim().endsWith('0')).toBe(false);
  });

  test('DRep without a name shows its ID once, not again as a name', () => {
    render(<DRepsTable />);
    const unnamed = row(
      'drep1ytfwpmt2fvdnyvlswyjyggpf8unnamedexample0000000000',
    );
    expect(within(unnamed).getAllByText(/drep1ytfwp/)).toHaveLength(1);
    expect(within(unnamed).getByText('Votes: 0')).toBeInTheDocument();
  });

  test('no 0% suffix when live stake matches voting power; real change shown', () => {
    render(<DRepsTable />);
    expect(screen.queryByText(/^0%$/)).not.toBeInTheDocument();
    const named = row(
      'drep1y2200we9c904un36tzaearntzzl63snffuul9qsk0te4utqfkke0w',
    );
    expect(named.textContent).not.toMatch(/%/);
    const changed = row(
      'drep1ytfwpmt2fvdnyvlswyjyggpf8unnamedexample0000000000',
    );
    expect(within(changed).getByText('+10%')).toBeInTheDocument();
  });
});
