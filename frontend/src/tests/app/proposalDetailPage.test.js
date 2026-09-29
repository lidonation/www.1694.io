import { render, screen } from '@testing-library/react';
import ProposalDetailPage from '@/app/[locale]/proposals/[proposalid]/page';
import { useGetActionProposalQuery } from '@/hooks/useGetActionProposalQuery';
import { useGetActionProposalPollQuery } from '@/hooks/useGetActionProposalPollQuery';

jest.mock('next/navigation', () => ({
  useParams: () => ({ proposalid: '20' }),
}));

jest.mock('@/hooks/useGetActionProposalQuery', () => ({
  useGetActionProposalQuery: jest.fn(),
}));

jest.mock('@/hooks/useGetActionProposalPollQuery', () => ({
  useGetActionProposalPollQuery: jest.fn(),
}));

jest.mock('@/hooks/useUserCatalystParticipationQuery', () => ({
  useUserParticipationQuery: () => ({ data: undefined, isLoading: false }),
}));

jest.mock('@/context/globalContext', () => ({
  useWallet: () => ({
    wallet: { isConnected: false, isDRep: false },
  }),
}));

jest.mock('@/components/molecules/BreadCrumbs', () => ({
  __esModule: true,
  default: ({ crumbs }) => (
    <div data-testid="breadcrumbs">
      {crumbs.map((crumb) => crumb.label).join(' / ')}
    </div>
  ),
}));

jest.mock('@/components/proposals/ProposalIdentity', () => ({
  __esModule: true,
  default: () => <div data-testid="proposal-identity" />,
}));

jest.mock('@/components/proposals/ProposalDetails', () => ({
  __esModule: true,
  default: () => <div data-testid="proposal-details" />,
}));

jest.mock('@/components/proposals/ProposalComments', () => ({
  __esModule: true,
  default: () => <div data-testid="proposal-comments" />,
}));

jest.mock('@/components/proposals/VoteResultsCard', () => ({
  __esModule: true,
  default: () => <div data-testid="vote-results-card" />,
}));

jest.mock('@/components/proposals/VotingSection', () => ({
  __esModule: true,
  default: () => <div data-testid="voting-section" />,
}));

jest.mock('@/components/proposals/CatalystParticipation', () => ({
  __esModule: true,
  default: () => <div data-testid="catalyst-participation" />,
}));

describe('proposal detail error states', () => {
  test('does not render proposal content when proposal request fails', () => {
    useGetActionProposalQuery.mockReturnValue({
      actionProposal: undefined,
      isActionProposalLoading: false,
      isActionProposalError: true,
    });
    useGetActionProposalPollQuery.mockReturnValue({
      poll: undefined,
      isPollLoading: false,
      isPollError: true,
    });

    render(<ProposalDetailPage />);

    expect(
      screen.getByText(/Proposal details are currently unavailable/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumbs')).toHaveTextContent(
      'Proposal unavailable',
    );
    expect(screen.queryByTestId('proposal-identity')).not.toBeInTheDocument();
    expect(screen.queryByTestId('proposal-details')).not.toBeInTheDocument();
    expect(screen.queryByTestId('proposal-comments')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('catalyst-participation'),
    ).not.toBeInTheDocument();
  });

  test('keeps proposal content when only poll request fails', () => {
    useGetActionProposalQuery.mockReturnValue({
      actionProposal: {
        data: {
          attributes: {
            bd_proposal_detail: {
              data: { attributes: { proposal_name: 'Proposal 20' } },
            },
          },
        },
      },
      isActionProposalLoading: false,
      isActionProposalError: false,
    });
    useGetActionProposalPollQuery.mockReturnValue({
      poll: undefined,
      isPollLoading: false,
      isPollError: true,
    });

    render(<ProposalDetailPage />);

    expect(
      screen.getByText(/Poll results are currently unavailable/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId('proposal-identity')).toBeInTheDocument();
    expect(screen.getByTestId('proposal-details')).toBeInTheDocument();
    expect(screen.getByTestId('proposal-comments')).toBeInTheDocument();
    expect(screen.queryByTestId('voting-section')).not.toBeInTheDocument();
  });
});
